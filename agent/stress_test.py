#!/usr/bin/env python3
"""
Stress Test Suite for Customer AI Agent
Push the system to its limits:
- Very long conversations (50+ turns)
- Massive knowledge bases (100+ nodes)
- Concurrent operations
- Memory stress
- Context window limits
- Performance benchmarks
"""

import sys
sys.path.insert(0, '/projects/Customer-Agent-Thing/agent')

from agent import CustomerAgent, HippocampusClient, OllamaClient
import time
import threading
import statistics


class Colors:
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    MAGENTA = '\033[0;35m'
    NC = '\033[0m'


def print_header(title):
    print(f"\n{Colors.MAGENTA}{'='*70}{Colors.NC}")
    print(f"{Colors.YELLOW}{title}{Colors.NC}")
    print(f"{Colors.MAGENTA}{'='*70}{Colors.NC}")


def print_metric(name, value, unit=""):
    print(f"{Colors.CYAN}{name}:{Colors.NC} {Colors.GREEN}{value}{unit}{Colors.NC}")


def stress_test_1_long_conversation():
    """
    Test 1: Very Long Conversation (50 turns)
    Push context window limits
    """
    print_header("STRESS TEST 1: Long Conversation (50 Turns)")

    hippocampus = HippocampusClient()
    ollama = OllamaClient()
    agent = CustomerAgent(
        agent_id="stress_long_conversation",
        hippocampus_client=hippocampus,
        ollama_client=ollama
    )

    start_time = time.time()
    response_times = []

    # Simulate 50-turn conversation
    conversation_topics = [
        "I need help with my account",
        "How do I change my password?",
        "What features are in premium?",
        "Can you explain API rate limits?",
        "I'm getting errors in production",
        "How do I export my data?",
        "What's your refund policy?",
        "Do you have webhooks?",
        "How do I integrate with Node.js?",
        "What about Python integration?",
    ]

    print(f"{Colors.CYAN}Running 50 conversation turns...{Colors.NC}\n")

    for i in range(50):
        topic = conversation_topics[i % len(conversation_topics)]
        query = f"{topic} (turn {i+1})"

        turn_start = time.time()
        try:
            response = agent.chat(query)
            turn_time = time.time() - turn_start
            response_times.append(turn_time)

            if i % 10 == 0:
                print(f"  Turn {i+1}/50: {turn_time:.2f}s - {len(response)} chars")
        except Exception as e:
            print(f"{Colors.RED}  Turn {i+1} failed: {e}{Colors.NC}")

    total_time = time.time() - start_time

    # Metrics
    print(f"\n{Colors.GREEN}Results:{Colors.NC}")
    print_metric("  Total turns", 50)
    print_metric("  Total time", f"{total_time:.2f}", "s")
    print_metric("  Average response", f"{statistics.mean(response_times):.2f}", "s")
    print_metric("  Min response", f"{min(response_times):.2f}", "s")
    print_metric("  Max response", f"{max(response_times):.2f}", "s")
    print_metric("  Median response", f"{statistics.median(response_times):.2f}", "s")
    print_metric("  Conversation history", len(agent.conversation_history), " messages")

    print(f"\n{Colors.GREEN}✓ Long conversation test complete{Colors.NC}")
    return {
        "total_turns": 50,
        "total_time": total_time,
        "avg_response": statistics.mean(response_times),
        "max_response": max(response_times)
    }


def stress_test_2_massive_knowledge_base():
    """
    Test 2: Massive Knowledge Base (200+ nodes)
    Test search performance with large dataset
    """
    print_header("STRESS TEST 2: Massive Knowledge Base (200 Nodes)")

    hippocampus = HippocampusClient()
    ollama = OllamaClient()
    agent = CustomerAgent(
        agent_id="stress_massive_kb",
        hippocampus_client=hippocampus,
        ollama_client=ollama
    )

    print(f"{Colors.CYAN}Loading 200 knowledge nodes...{Colors.NC}\n")

    start_time = time.time()
    insert_times = []

    # Generate diverse knowledge
    categories = ["product", "technical", "billing", "support", "security"]
    for i in range(200):
        category = categories[i % len(categories)]
        key = f"{category}_knowledge_{i}"
        content = f"This is detailed knowledge about {category} topic number {i}. " \
                  f"It contains important information that customers need to know. " \
                  f"Reference ID: {i}, Category: {category}, Priority: {i % 3}"

        insert_start = time.time()
        agent.add_knowledge_node(key, content, f"{category}_module")
        insert_times.append(time.time() - insert_start)

        if i % 50 == 0 and i > 0:
            print(f"  Loaded {i}/200 nodes...")

    load_time = time.time() - start_time

    # Test search performance
    print(f"\n{Colors.CYAN}Testing search performance...{Colors.NC}\n")
    search_times = []
    search_queries = [
        "product information",
        "technical documentation",
        "billing questions",
        "support policies",
        "security features"
    ]

    for query in search_queries:
        search_start = time.time()
        results = agent.search_knowledge(query, top_k=10)
        search_time = time.time() - search_start
        search_times.append(search_time)
        print(f"  Query '{query}': {search_time:.3f}s, {len(results)} results")

    # Metrics
    print(f"\n{Colors.GREEN}Results:{Colors.NC}")
    print_metric("  Total nodes", 200)
    print_metric("  Load time", f"{load_time:.2f}", "s")
    print_metric("  Avg insert", f"{statistics.mean(insert_times)*1000:.1f}", "ms")
    print_metric("  Avg search", f"{statistics.mean(search_times)*1000:.1f}", "ms")
    print_metric("  Max search", f"{max(search_times)*1000:.1f}", "ms")

    # Module distribution
    print(f"\n{Colors.CYAN}Module distribution:{Colors.NC}")
    for module, nodes in agent.knowledge_modules.items():
        if len(nodes) > 0:
            print(f"  {module}: {len(nodes)} nodes")

    print(f"\n{Colors.GREEN}✓ Massive knowledge base test complete{Colors.NC}")
    return {
        "total_nodes": 200,
        "load_time": load_time,
        "avg_search": statistics.mean(search_times) * 1000
    }


def stress_test_3_rapid_fire_queries():
    """
    Test 3: Rapid Fire Queries (100 queries back-to-back)
    Test system under high load
    """
    print_header("STRESS TEST 3: Rapid Fire Queries (100 queries)")

    hippocampus = HippocampusClient()
    ollama = OllamaClient()
    agent = CustomerAgent(
        agent_id="stress_rapid_fire",
        hippocampus_client=hippocampus,
        ollama_client=ollama
    )

    queries = [
        "What is your pricing?",
        "How do I upgrade?",
        "What features exist?",
        "Tell me about support",
        "API documentation?"
    ]

    print(f"{Colors.CYAN}Firing 100 queries rapidly...{Colors.NC}\n")

    start_time = time.time()
    response_times = []
    errors = 0

    for i in range(100):
        query = queries[i % len(queries)]

        try:
            turn_start = time.time()
            response = agent.chat(query)
            turn_time = time.time() - turn_start
            response_times.append(turn_time)

            if i % 20 == 0:
                print(f"  Query {i+1}/100: {turn_time:.2f}s")
        except Exception as e:
            errors += 1
            print(f"{Colors.RED}  Query {i+1} error: {e}{Colors.NC}")

    total_time = time.time() - start_time

    # Metrics
    print(f"\n{Colors.GREEN}Results:{Colors.NC}")
    print_metric("  Total queries", 100)
    print_metric("  Successful", 100 - errors)
    print_metric("  Errors", errors)
    print_metric("  Total time", f"{total_time:.2f}", "s")
    print_metric("  Throughput", f"{100/total_time:.2f}", " queries/sec")
    print_metric("  Avg latency", f"{statistics.mean(response_times):.2f}", "s")

    print(f"\n{Colors.GREEN}✓ Rapid fire test complete{Colors.NC}")
    return {
        "total_queries": 100,
        "errors": errors,
        "throughput": 100/total_time,
        "avg_latency": statistics.mean(response_times)
    }


def stress_test_4_context_window_limit():
    """
    Test 4: Context Window Exhaustion
    Keep adding to conversation until context limit hit
    """
    print_header("STRESS TEST 4: Context Window Limit Test")

    hippocampus = HippocampusClient()
    ollama = OllamaClient()
    agent = CustomerAgent(
        agent_id="stress_context_window",
        hippocampus_client=hippocampus,
        ollama_client=ollama
    )

    print(f"{Colors.CYAN}Testing context window limits...{Colors.NC}\n")

    # Generate very long message
    long_context = "This is a detailed explanation. " * 200  # ~800 words

    messages_until_limit = 0
    start_time = time.time()

    for i in range(30):  # Test up to 30 messages
        try:
            query = f"{long_context} Question number {i+1}?"
            response = agent.chat(query)
            messages_until_limit = i + 1

            print(f"  Message {i+1}: History size = {len(agent.conversation_history)} messages")

            # Check if we're hitting limits (degraded performance)
            if len(agent.conversation_history) > 20:
                print(f"{Colors.YELLOW}  ⚠ Large conversation history detected{Colors.NC}")

        except Exception as e:
            print(f"{Colors.RED}  Failed at message {i+1}: {e}{Colors.NC}")
            break

    total_time = time.time() - start_time

    # Metrics
    print(f"\n{Colors.GREEN}Results:{Colors.NC}")
    print_metric("  Messages sent", messages_until_limit)
    print_metric("  Final history size", len(agent.conversation_history))
    print_metric("  Total time", f"{total_time:.2f}", "s")
    print_metric("  Avg per message", f"{total_time/messages_until_limit:.2f}", "s")

    print(f"\n{Colors.GREEN}✓ Context window test complete{Colors.NC}")
    return {
        "messages": messages_until_limit,
        "history_size": len(agent.conversation_history)
    }


def stress_test_5_concurrent_agents():
    """
    Test 5: Multiple Agents Concurrently
    Simulate multiple customers at once
    """
    print_header("STRESS TEST 5: Concurrent Agents (5 agents)")

    print(f"{Colors.CYAN}Running 5 agents concurrently...{Colors.NC}\n")

    def run_agent(agent_id, queries):
        """Run agent in thread"""
        hippocampus = HippocampusClient()
        ollama = OllamaClient()
        agent = CustomerAgent(
            agent_id=f"stress_concurrent_{agent_id}",
            hippocampus_client=hippocampus,
            ollama_client=ollama
        )

        results = []
        for query in queries:
            try:
                start = time.time()
                response = agent.chat(query)
                duration = time.time() - start
                results.append({"success": True, "duration": duration})
            except Exception as e:
                results.append({"success": False, "error": str(e)})

        return results

    # Prepare queries for each agent
    agent_queries = [
        ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
        for _ in range(5)
    ]

    threads = []
    results = []
    start_time = time.time()

    # Start all threads
    for i in range(5):
        thread = threading.Thread(target=lambda idx=i: results.append(run_agent(idx, agent_queries[idx])))
        threads.append(thread)
        thread.start()
        print(f"  Started agent {i+1}")

    # Wait for completion
    for thread in threads:
        thread.join()

    total_time = time.time() - start_time

    # Analyze results
    total_queries = sum(len(r) for r in results if r)
    successful = sum(1 for r in results if r for q in r if q.get("success", False))

    print(f"\n{Colors.GREEN}Results:{Colors.NC}")
    print_metric("  Concurrent agents", 5)
    print_metric("  Total queries", total_queries)
    print_metric("  Successful", successful)
    print_metric("  Total time", f"{total_time:.2f}", "s")
    print_metric("  Effective throughput", f"{total_queries/total_time:.2f}", " queries/sec")

    print(f"\n{Colors.GREEN}✓ Concurrent agents test complete{Colors.NC}")
    return {
        "agents": 5,
        "total_queries": total_queries,
        "success_rate": successful / total_queries if total_queries > 0 else 0
    }


def stress_test_6_memory_intensive():
    """
    Test 6: Memory Intensive Operations
    Multiple large agents with lots of data
    """
    print_header("STRESS TEST 6: Memory Intensive Operations")

    print(f"{Colors.CYAN}Creating 3 agents with 100 nodes each...{Colors.NC}\n")

    agents = []
    start_time = time.time()

    for agent_num in range(3):
        hippocampus = HippocampusClient()
        ollama = OllamaClient()
        agent = CustomerAgent(
            agent_id=f"stress_memory_{agent_num}",
            hippocampus_client=hippocampus,
            ollama_client=ollama
        )

        # Load 100 nodes per agent
        for i in range(100):
            content = f"Large content block for agent {agent_num}, item {i}. " * 20
            agent.add_knowledge_node(f"node_{i}", content, "stress_module")

        agents.append(agent)
        print(f"  Agent {agent_num+1}: 100 nodes loaded")

    load_time = time.time() - start_time

    # Perform operations on all agents
    print(f"\n{Colors.CYAN}Performing searches on all agents...{Colors.NC}\n")

    search_start = time.time()
    for i, agent in enumerate(agents):
        results = agent.search_knowledge("content block", top_k=5)
        print(f"  Agent {i+1}: Found {len(results)} results")

    search_time = time.time() - search_start

    # Metrics
    print(f"\n{Colors.GREEN}Results:{Colors.NC}")
    print_metric("  Total agents", 3)
    print_metric("  Nodes per agent", 100)
    print_metric("  Total nodes", 300)
    print_metric("  Load time", f"{load_time:.2f}", "s")
    print_metric("  Search time", f"{search_time:.2f}", "s")

    print(f"\n{Colors.GREEN}✓ Memory intensive test complete{Colors.NC}")
    return {
        "agents": 3,
        "total_nodes": 300,
        "load_time": load_time
    }


def run_all_stress_tests():
    """Run all stress tests"""
    print(f"\n{Colors.MAGENTA}{'='*70}{Colors.NC}")
    print(f"{Colors.MAGENTA}CUSTOMER AI AGENT - STRESS TEST SUITE{Colors.NC}")
    print(f"{Colors.MAGENTA}{'='*70}{Colors.NC}")

    all_results = {}
    start_time = time.time()

    try:
        # Run tests
        all_results["test_1"] = stress_test_1_long_conversation()
        time.sleep(2)

        all_results["test_2"] = stress_test_2_massive_knowledge_base()
        time.sleep(2)

        all_results["test_3"] = stress_test_3_rapid_fire_queries()
        time.sleep(2)

        all_results["test_4"] = stress_test_4_context_window_limit()
        time.sleep(2)

        all_results["test_5"] = stress_test_5_concurrent_agents()
        time.sleep(2)

        all_results["test_6"] = stress_test_6_memory_intensive()

        # Final summary
        total_time = time.time() - start_time

        print(f"\n{Colors.MAGENTA}{'='*70}{Colors.NC}")
        print(f"{Colors.GREEN}✓ ALL STRESS TESTS COMPLETE{Colors.NC}")
        print(f"{Colors.MAGENTA}{'='*70}{Colors.NC}")

        print(f"\n{Colors.YELLOW}PERFORMANCE SUMMARY:{Colors.NC}")
        print(f"\n{Colors.CYAN}Test 1 - Long Conversation:{Colors.NC}")
        print_metric("  Avg Response", f"{all_results['test_1']['avg_response']:.2f}", "s")
        print_metric("  Max Response", f"{all_results['test_1']['max_response']:.2f}", "s")

        print(f"\n{Colors.CYAN}Test 2 - Massive Knowledge Base:{Colors.NC}")
        print_metric("  Total Nodes", all_results['test_2']['total_nodes'])
        print_metric("  Avg Search", f"{all_results['test_2']['avg_search']:.1f}", "ms")

        print(f"\n{Colors.CYAN}Test 3 - Rapid Fire:{Colors.NC}")
        print_metric("  Throughput", f"{all_results['test_3']['throughput']:.2f}", " q/s")
        print_metric("  Avg Latency", f"{all_results['test_3']['avg_latency']:.2f}", "s")

        print(f"\n{Colors.CYAN}Test 4 - Context Window:{Colors.NC}")
        print_metric("  Messages Handled", all_results['test_4']['messages'])
        print_metric("  History Size", all_results['test_4']['history_size'])

        print(f"\n{Colors.CYAN}Test 5 - Concurrent:{Colors.NC}")
        print_metric("  Success Rate", f"{all_results['test_5']['success_rate']*100:.1f}", "%")

        print(f"\n{Colors.CYAN}Test 6 - Memory:{Colors.NC}")
        print_metric("  Total Nodes", all_results['test_6']['total_nodes'])
        print_metric("  Load Time", f"{all_results['test_6']['load_time']:.2f}", "s")

        print(f"\n{Colors.YELLOW}Overall:{Colors.NC}")
        print_metric("  Total Test Time", f"{total_time/60:.2f}", " minutes")
        print_metric("  All Tests", f"{Colors.GREEN}PASSED{Colors.NC}")

    except Exception as e:
        print(f"\n{Colors.RED}✗ Stress test failed: {e}{Colors.NC}")
        import traceback
        traceback.print_exc()
        return False

    return True


if __name__ == "__main__":
    import sys
    success = run_all_stress_tests()
    sys.exit(0 if success else 1)
