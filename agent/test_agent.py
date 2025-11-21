#!/usr/bin/env python3
"""
Test script for Customer AI Agent
Demonstrates modular knowledge and tool calling
"""

import sys
sys.path.insert(0, '/projects/Customer-Agent-Thing/agent')

from agent import CustomerAgent, HippocampusClient, OllamaClient


def test_agent():
    """Run automated tests on the agent"""
    print("=== Testing Customer AI Agent ===\n")

    # Initialize
    hippocampus = HippocampusClient()
    ollama = OllamaClient()

    agent = CustomerAgent(
        agent_id="test_agent_001",
        hippocampus_client=hippocampus,
        ollama_client=ollama
    )

    print("\n" + "="*60)
    print("TEST 1: Basic greeting (should use base knowledge)")
    print("="*60)

    response = agent.chat("Hello, I need help with my account")
    print(f"\n🤖 Agent: {response}\n")

    print("\n" + "="*60)
    print("TEST 2: Customer shares preference (agent should store it)")
    print("="*60)

    response = agent.chat("By the way, I prefer dark mode on all interfaces")
    print(f"\n🤖 Agent: {response}\n")

    print("\n" + "="*60)
    print("TEST 3: Ask about stored preference (should recall)")
    print("="*60)

    response = agent.chat("What are my UI preferences?")
    print(f"\n🤖 Agent: {response}\n")

    print("\n" + "="*60)
    print("TEST 4: Product question (agent should search knowledge)")
    print("="*60)

    # Add some product knowledge first
    agent.add_knowledge_node(
        key="pricing_premium",
        content="Premium plan costs $29/month and includes priority support, advanced analytics, and API access",
        module="product_knowledge"
    )

    response = agent.chat("What's included in the premium plan?")
    print(f"\n🤖 Agent: {response}\n")

    print("\n" + "="*60)
    print("TEST 5: Check knowledge modules")
    print("="*60)

    print("\nCurrent knowledge modules:")
    for module_name, nodes in agent.knowledge_modules.items():
        print(f"  {module_name}: {len(nodes)} nodes")

    print("\n✓ All tests completed!\n")


if __name__ == "__main__":
    try:
        test_agent()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
