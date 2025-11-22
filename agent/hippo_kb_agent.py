import os
import json
import requests
from datetime import datetime

# Import the existing HippocampusClient
try:
    from agent import HippocampusClient
except ImportError:
    # Fallback if agent module not available
    HippocampusClient = None

class HippocampusKBAgent:
    """IT Support Agent using Hippocampus for all knowledge storage"""

    def __init__(self, hippo_client=None, ollama_url="http://localhost:11434"):
        if hippo_client:
            self.hippo = hippo_client
        elif HippocampusClient:
            self.hippo = HippocampusClient(host="localhost", port=6379)
        else:
            raise Exception("HippocampusClient not available")

        self.ollama_url = ollama_url

        # Hippocampus namespace prefixes
        self.BASE_KB = "base_knowledge"
        self.COMP_KB = "completed_issues"
        self.USER_KB_PREFIX = "user_specific_"

    def search_base_knowledge(self, query, limit=3):
        """Search company-wide base knowledge in Hippocampus"""
        try:
            # Use Hippocampus search - returns list of strings
            results = self.hippo.search(self.BASE_KB, query, top_k=limit)
            return results if results else []
        except Exception as e:
            print(f"Base KB search error: {e}")
            return []

    def search_completed_issues(self, query, limit=3):
        """Search past resolved issues in Hippocampus"""
        try:
            results = self.hippo.search(self.COMP_KB, query, top_k=limit)
            return results if results else []
        except Exception as e:
            print(f"Completed issues search error: {e}")
            return []

    def search_user_knowledge(self, username, query, limit=3):
        """Search user-specific knowledge in Hippocampus"""
        try:
            user_namespace = f"{self.USER_KB_PREFIX}{username}"
            results = self.hippo.search(user_namespace, query, top_k=limit)
            return results if results else []
        except Exception as e:
            print(f"User KB search error: {e}")
            return []

    def add_base_knowledge(self, key, content):
        """Add knowledge to base KB (admin only)"""
        try:
            success = self.hippo.insert(self.BASE_KB, key, content)
            return success
        except Exception as e:
            print(f"Error adding base knowledge: {e}")
            return False

    def add_completed_issue(self, issue_id, issue_data):
        """Add resolved issue to completed issues KB"""
        try:
            content = json.dumps(issue_data) if isinstance(issue_data, dict) else issue_data
            success = self.hippo.insert(self.COMP_KB, issue_id, content)
            return success
        except Exception as e:
            print(f"Error adding completed issue: {e}")
            return False

    def add_user_knowledge(self, username, key, content):
        """Add to user's specific knowledge KB"""
        try:
            user_namespace = f"{self.USER_KB_PREFIX}{username}"
            success = self.hippo.insert(user_namespace, key, content)
            return success
        except Exception as e:
            print(f"Error adding user knowledge: {e}")
            return False

    def build_context(self, username, user_message):
        """Build context from all 3 Hippocampus KBs"""
        context = {
            'base_knowledge': self.search_base_knowledge(user_message),
            'completed_issues': self.search_completed_issues(user_message),
            'user_knowledge': self.search_user_knowledge(username, user_message)
        }
        return context

    def format_context_for_llm(self, context):
        """Format Hippocampus search results for LLM"""
        prompt_parts = []

        # Add base knowledge
        if context['base_knowledge']:
            prompt_parts.append("📋 COMPANY POLICIES & PROCEDURES:")
            for item in context['base_knowledge']:
                prompt_parts.append(f"- {item}")

        # Add completed issues
        if context['completed_issues']:
            prompt_parts.append("\n🔧 SIMILAR PAST ISSUES & SOLUTIONS:")
            for item in context['completed_issues']:
                prompt_parts.append(f"- {item}")

        # Add user-specific knowledge
        if context['user_knowledge']:
            prompt_parts.append("\n👤 USER-SPECIFIC INFORMATION:")
            for item in context['user_knowledge']:
                prompt_parts.append(f"- {item}")

        return "\n".join(prompt_parts)

    def chat(self, username, user_message, conversation_history=[]):
        """Main chat method using Hippocampus for knowledge"""

        # Build context from all Hippocampus KBs
        context = self.build_context(username, user_message)
        context_prompt = self.format_context_for_llm(context)

        # Build system prompt
        system_prompt = f"""You are a helpful IT support agent. Use the following information from the knowledge base:

{context_prompt}

Instructions:
- Provide clear, actionable IT support
- Reference company policies when relevant
- Suggest solutions from past resolved issues
- Adapt your communication style to the user
- Be concise but thorough"""

        # Build messages for Ollama
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history
        for msg in conversation_history[-5:]:
            messages.append(msg)

        messages.append({"role": "user", "content": user_message})

        # Call Ollama API
        try:
            response = requests.post(
                f"{self.ollama_url}/api/chat",
                json={
                    "model": "mistral",
                    "messages": messages,
                    "stream": False
                },
                timeout=180
            )
            response.raise_for_status()
            result = response.json()

            bot_response = result['message']['content']

            return {
                'response': bot_response,
                'context_used': {
                    'base_knowledge_count': len(context['base_knowledge']),
                    'completed_issues_count': len(context['completed_issues']),
                    'user_knowledge_count': len(context['user_knowledge'])
                }
            }

        except Exception as e:
            print(f"Ollama API error: {e}")
            return {
                'response': f"I'm having trouble connecting to my AI engine. Error: {str(e)}",
                'error': str(e)
            }

# Singleton instance
_agent_instance = None

def get_hippo_agent(hippo_client=None):
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = HippocampusKBAgent(hippo_client=hippo_client)
    return _agent_instance
