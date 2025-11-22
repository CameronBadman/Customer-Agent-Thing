import os
import json
import requests
from pymongo import MongoClient
from datetime import datetime

class ITSupportAgent:
    """IT Support Agent with 3-tier knowledge base integration"""

    def __init__(self, mongo_uri, ollama_url="http://localhost:11434"):
        self.mongo_client = MongoClient(mongo_uri)
        self.db = self.mongo_client['it-support-agent']
        self.ollama_url = ollama_url

        # Collections for 3-tier knowledge base
        self.base_knowledge = self.db['baseknowledges']
        self.completed_issues = self.db['completedissues']
        self.user_profiles = self.db['userprofiles']

    def search_base_knowledge(self, query, limit=5):
        """Search company-wide base knowledge"""
        try:
            results = list(self.base_knowledge.find(
                {
                    '$text': {'$search': query},
                    'isActive': True
                },
                {'score': {'$meta': 'textScore'}}
            ).sort([('score', {'$meta': 'textScore'})]).limit(limit))

            return [
                {
                    'title': r['title'],
                    'content': r['content'],
                    'category': r['category'],
                    'source': 'base'
                }
                for r in results
            ]
        except Exception as e:
            print(f"Base knowledge search error: {e}")
            # Fallback to simple query
            results = list(self.base_knowledge.find({'isActive': True}).limit(limit))
            return [
                {
                    'title': r['title'],
                    'content': r['content'],
                    'category': r['category'],
                    'source': 'base'
                }
                for r in results
            ]

    def search_completed_issues(self, query, limit=5):
        """Search completed issues with solutions"""
        try:
            results = list(self.completed_issues.find(
                {'$text': {'$search': query}},
                {'score': {'$meta': 'textScore'}}
            ).sort([('score', {'$meta': 'textScore'})]).limit(limit))

            return [
                {
                    'title': r['issueTitle'],
                    'description': r['issueDescription'],
                    'solution': r['solutionSteps'],
                    'category': r['category'],
                    'source': 'completed'
                }
                for r in results
            ]
        except Exception as e:
            print(f"Completed issues search error: {e}")
            return []

    def get_user_profile(self, username):
        """Get user-specific profile and preferences"""
        try:
            profile = self.user_profiles.find_one({'username': username})
            if not profile:
                # Create default profile
                profile = {
                    'username': username,
                    'systemInfo': {},
                    'preferences': {
                        'communicationStyle': 'detailed',
                        'technicalLevel': 'intermediate'
                    },
                    'commonIssues': [],
                    'notes': ''
                }
                self.user_profiles.insert_one(profile)

            return {
                'systemInfo': profile.get('systemInfo', {}),
                'preferences': profile.get('preferences', {}),
                'commonIssues': profile.get('commonIssues', []),
                'notes': profile.get('notes', ''),
                'source': 'user_profile'
            }
        except Exception as e:
            print(f"User profile error: {e}")
            return {'source': 'user_profile', 'error': str(e)}

    def build_context(self, username, user_message):
        """Build context from all 3 knowledge bases"""
        context = {
            'base_knowledge': self.search_base_knowledge(user_message),
            'completed_issues': self.search_completed_issues(user_message),
            'user_profile': self.get_user_profile(username)
        }
        return context

    def format_context_for_llm(self, context):
        """Format context into a prompt for the LLM"""
        prompt_parts = []

        # Add base knowledge
        if context['base_knowledge']:
            prompt_parts.append("📋 COMPANY POLICIES & PROCEDURES:")
            for item in context['base_knowledge']:
                prompt_parts.append(f"- {item['title']} ({item['category']}): {item['content'][:200]}...")

        # Add completed issues
        if context['completed_issues']:
            prompt_parts.append("\n🔧 SIMILAR PAST ISSUES & SOLUTIONS:")
            for item in context['completed_issues']:
                prompt_parts.append(f"- Issue: {item['title']}")
                prompt_parts.append(f"  Solution: {item['solution'][:200]}...")

        # Add user profile
        user_profile = context['user_profile']
        if user_profile and 'preferences' in user_profile:
            prefs = user_profile['preferences']
            prompt_parts.append(f"\n👤 USER PREFERENCES:")
            prompt_parts.append(f"- Technical Level: {prefs.get('technicalLevel', 'intermediate')}")
            prompt_parts.append(f"- Communication Style: {prefs.get('communicationStyle', 'detailed')}")

            if user_profile.get('systemInfo'):
                sys_info = user_profile['systemInfo']
                if sys_info.get('os'):
                    prompt_parts.append(f"- OS: {sys_info['os']}")
                if sys_info.get('software'):
                    prompt_parts.append(f"- Software: {', '.join(sys_info['software'][:3])}")

        return "\n".join(prompt_parts)

    def chat(self, username, user_message, conversation_history=[]):
        """Main chat method with 3-tier KB integration"""

        # Build context from all knowledge bases
        context = self.build_context(username, user_message)
        context_prompt = self.format_context_for_llm(context)

        # Build system prompt
        system_prompt = f"""You are a helpful IT support agent. Use the following information to assist the user:

{context_prompt}

Instructions:
- Provide clear, actionable IT support
- Reference company policies when relevant
- Suggest solutions from past resolved issues
- Adapt your communication style to the user's technical level
- Be concise but thorough
- If you don't have enough information, ask clarifying questions"""

        # Build messages for Ollama
        messages = [
            {"role": "system", "content": system_prompt}
        ]

        # Add conversation history (last 5 messages)
        for msg in conversation_history[-5:]:
            messages.append(msg)

        # Add current user message
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
                    'user_profile_loaded': bool(context['user_profile'])
                }
            }

        except Exception as e:
            print(f"Ollama API error: {e}")
            return {
                'response': f"I'm having trouble connecting to my AI engine. Error: {str(e)}",
                'error': str(e)
            }

    def store_completed_issue(self, username, issue_title, issue_description, solution, category='other'):
        """Store a resolved issue in the completed issues KB"""
        try:
            issue = {
                'issueTitle': issue_title,
                'issueDescription': issue_description,
                'solutionSteps': solution,
                'category': category,
                'reportedBy': username,
                'resolvedAt': datetime.now(),
                'symptoms': [],
                'tags': []
            }
            self.completed_issues.insert_one(issue)
            return True
        except Exception as e:
            print(f"Error storing completed issue: {e}")
            return False

# Singleton instance
_agent_instance = None

def get_agent(mongo_uri):
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = ITSupportAgent(mongo_uri)
    return _agent_instance
