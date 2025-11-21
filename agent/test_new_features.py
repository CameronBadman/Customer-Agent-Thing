#!/usr/bin/env python3
"""
Test new features: ML anomaly detection and context search
"""

import sys
import time
from agent import CustomerAgent, HippocampusClient, OllamaClient

def test_ml_anomaly_detection():
    """Test ML-based anomaly detection"""
    print("\n" + "="*70)
    print("TEST 1: ML-Based Anomaly Detection")
    print("="*70)

    hippocampus = HippocampusClient()
    ollama = OllamaClient()
    agent = CustomerAgent("test_ml_agent", hippocampus, ollama)

    # Normal messages - build baseline
    print("\n📊 Building baseline with normal messages...")
    normal_messages = [
        "Hello, I need help with my account",
        "Can you help me reset my password?",
        "I want to upgrade my plan",
        "What are the pricing options?",
        "How do I contact support?"
    ]

    for i, msg in enumerate(normal_messages, 1):
        print(f"\n[{i}/5] Normal message: '{msg[:50]}...'")
        response = agent.chat(msg)
        print(f"  Anomaly score: {agent.behavior_profile.anomaly_score_history[-1] if agent.behavior_profile.anomaly_score_history else 0.0:.2f}")
        time.sleep(0.5)

    # Anomalous messages
    print("\n🚨 Testing anomalous patterns...")
    anomalous_messages = [
        "URGENT URGENT URGENT HELP NOW NOW NOW!!!!!!",  # High uppercase, repetition
        "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀",  # Unusual characters
        "a" * 500,  # Abnormally long
    ]

    for i, msg in enumerate(anomalous_messages, 1):
        print(f"\n[{i}/3] Anomalous message: '{msg[:50]}...'")
        response = agent.chat(msg)
        score = agent.behavior_profile.anomaly_score_history[-1] if agent.behavior_profile.anomaly_score_history else 0.0
        print(f"  Anomaly score: {score:.2f}")
        if score > agent.anomaly_threshold:
            print(f"  ⚠️  Anomaly detected (threshold: {agent.anomaly_threshold})!")
        time.sleep(0.5)

    print("\n✓ ML anomaly detection test complete\n")


def test_context_search():
    """Test context search tool"""
    print("\n" + "="*70)
    print("TEST 2: Context Search (LLM-Only Tool)")
    print("="*70)

    hippocampus = HippocampusClient()
    ollama = OllamaClient()
    agent = CustomerAgent("test_context_agent", hippocampus, ollama)

    # Build conversation history
    print("\n📝 Building conversation history...")
    conversation = [
        "Hi, I prefer dark mode for all interfaces",
        "I also want email notifications enabled",
        "My favorite color is blue",
        "I'm interested in the enterprise plan",
        "Can you tell me about the API features?",
    ]

    for i, msg in enumerate(conversation, 1):
        print(f"[{i}/5] User: {msg}")
        response = agent.chat(msg)
        print(f"     Agent: {response[:80]}...")
        time.sleep(1)

    # Test context search
    print("\n🔍 Testing context search tool...")
    print("\nAsking: 'Do you remember what I said about dark mode?'")
    response = agent.chat("Do you remember what I said about dark mode?")
    print(f"\nAgent response:\n{response}\n")

    print("✓ Context search test complete\n")


def test_character_limits():
    """Test character limit handling"""
    print("\n" + "="*70)
    print("TEST 3: Character Limit Handling")
    print("="*70)

    hippocampus = HippocampusClient()
    ollama = OllamaClient()
    agent = CustomerAgent("test_limit_agent", hippocampus, ollama)

    # Test long message
    long_message = "This is a very long message. " * 50  # ~1500 chars
    print(f"\n📏 Sending {len(long_message)} character message...")
    print(f"Default max: {agent.default_max_chars_per_message} chars")

    response = agent.chat(long_message)
    print(f"\n✓ Message processed")
    print(f"  Context history length: {len(agent.conversation_history[-1]['content'])}")
    print(f"  Full history length: {len(agent.full_conversation_for_search[-1]['content'])}")

    # Verify truncation worked
    assert len(agent.conversation_history[-1]['content']) <= agent.default_max_chars_per_message + 20  # +20 for "... [truncated]"
    assert len(agent.full_conversation_for_search[-1]['content']) == len(long_message)

    print("\n✓ Character limit test complete\n")


def main():
    print("\n" + "="*70)
    print("🧪 TESTING NEW FEATURES")
    print("="*70)

    try:
        # Test 1: ML Anomaly Detection
        test_ml_anomaly_detection()

        # Test 2: Context Search
        test_context_search()

        # Test 3: Character Limits
        test_character_limits()

        print("\n" + "="*70)
        print("✅ ALL TESTS PASSED")
        print("="*70 + "\n")

    except KeyboardInterrupt:
        print("\n\n❌ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
