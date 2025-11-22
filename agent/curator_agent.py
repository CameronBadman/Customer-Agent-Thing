"""
Curator Agent - Formats and adds knowledge to base Hippocampus store
Ensures information is structured properly for all users
"""
import json
import requests
from datetime import datetime

try:
    from agent import HippocampusClient
except ImportError:
    HippocampusClient = None


class CuratorAgent:
    """Agent that curates and adds knowledge to the base knowledge store"""

    def __init__(self, hippo_client=None, ollama_url="http://localhost:11434"):
        if hippo_client:
            self.hippo = hippo_client
        elif HippocampusClient:
            self.hippo = HippocampusClient(host="localhost", port=6379)
        else:
            raise Exception("HippocampusClient not available")

        self.ollama_url = ollama_url
        self.BASE_KB = "base_knowledge"

    def format_knowledge(self, raw_information):
        """
        Use LLM to format raw information into structured knowledge
        Returns formatted knowledge suitable for base store
        """
        system_prompt = """You are a knowledge curator for an IT support system.

Your job is to take raw information and format it into clear, actionable knowledge entries.

Format Guidelines:
- Be concise and clear
- Use bullet points for multi-step procedures
- Include specific details (software versions, URLs, commands)
- Structure information so it's immediately useful
- Focus on "what" and "how" rather than opinions
- Keep entries focused on a single topic

Examples:

Input: "When people can't login to email they should check their password and maybe restart outlook"
Output: "EMAIL LOGIN ISSUES - Troubleshooting Steps:
1. Verify correct password is being used
2. Check CAPS LOCK is not enabled
3. Close and restart Outlook application
4. If issue persists, try webmail at mail.company.com
5. Contact IT if webmail also fails"

Input: "vpn is company.vpn.com use credentials"
Output: "VPN CONNECTION - Setup Instructions:
- VPN Server: company.vpn.com
- Credentials: Use your company email and password
- Download VPN client from: it.company.com/vpn-setup
- Connect before accessing internal resources"

Now format the following information:"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": raw_information}
        ]

        try:
            response = requests.post(
                f"{self.ollama_url}/api/chat",
                json={
                    "model": "llama3.2:1b",
                    "messages": messages,
                    "stream": False
                },
                timeout=180
            )
            response.raise_for_status()
            result = response.json()
            formatted_knowledge = result['message']['content']
            return formatted_knowledge

        except Exception as e:
            print(f"Error formatting knowledge with LLM: {e}")
            # Fallback: return raw information with timestamp
            return f"[{datetime.now().strftime('%Y-%m-%d')}] {raw_information}"

    def add_knowledge(self, category, raw_information):
        """
        Format and add knowledge to base store

        Args:
            category: Category/key for this knowledge (e.g., "vpn_setup", "email_issues")
            raw_information: Raw text to be formatted and stored

        Returns:
            dict with success status and formatted content
        """
        try:
            # Format the information using LLM
            print(f"Formatting knowledge for category: {category}")
            formatted_content = self.format_knowledge(raw_information)

            # Store in base knowledge with category as key
            success = self.hippo.insert(self.BASE_KB, category, formatted_content)

            if success:
                print(f"✓ Successfully added to base knowledge: {category}")
                return {
                    "success": True,
                    "category": category,
                    "formatted_content": formatted_content,
                    "message": f"Knowledge added to base store under '{category}'"
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to insert into Hippocampus",
                    "category": category
                }

        except Exception as e:
            print(f"Error adding knowledge: {e}")
            return {
                "success": False,
                "error": str(e),
                "category": category
            }

    def list_base_knowledge(self):
        """
        List all entries in base knowledge store
        Returns list of knowledge entries
        """
        try:
            # Try to get all entries from base knowledge
            # Note: Hippocampus search with empty query may return all
            results = self.hippo.search(self.BASE_KB, "", top_k=100)
            return results if results else []
        except Exception as e:
            print(f"Error listing base knowledge: {e}")
            return []

    def search_base_knowledge(self, query, limit=5):
        """
        Search base knowledge store

        Args:
            query: Search query
            limit: Maximum number of results

        Returns:
            List of matching knowledge entries
        """
        try:
            results = self.hippo.search(self.BASE_KB, query, top_k=limit)
            return results if results else []
        except Exception as e:
            print(f"Error searching base knowledge: {e}")
            return []


# Singleton instance
_curator_instance = None


def get_curator_agent(hippo_client=None, ollama_url="http://localhost:11434"):
    """Get or create curator agent instance"""
    global _curator_instance
    if _curator_instance is None:
        _curator_instance = CuratorAgent(hippo_client=hippo_client, ollama_url=ollama_url)
    return _curator_instance
