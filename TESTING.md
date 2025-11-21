# Testing Guide

## Test Suites

### 1. Quick Test (`quick-test.sh`)
**Duration**: ~30 seconds
**Purpose**: Basic functionality check

```bash
./quick-test.sh
```

**Tests**:
- ✓ Basic greeting
- ✓ Preference storage
- ✓ Preference recall
- ✓ Product knowledge search
- ✓ Knowledge module verification

### 2. Advanced Test Suite (`run-advanced-tests.sh`)
**Duration**: 2-3 minutes
**Purpose**: Comprehensive scenario testing

```bash
./run-advanced-tests.sh
```

**6 Test Scenarios**:

#### Scenario 1: Customer Onboarding Flow
Tests new customer setup and information collection:
- Customer introduces themselves
- Shares contact preferences (email, timezone)
- Shares technical preferences
- Agent recalls all preferences later

**Tests**:
- Multi-turn conversation
- Information extraction
- Preference storage
- Context recall

#### Scenario 2: Technical Support with Knowledge Building
Tests technical support interactions:
- Customer reports API error (429)
- Agent searches technical knowledge
- Provides troubleshooting steps
- Answers follow-up questions

**Tests**:
- Knowledge base search
- Technical documentation retrieval
- Multi-step problem solving

#### Scenario 3: Product Feature Inquiry & Comparison
Tests product knowledge and comparisons:
- Customer asks about plan differences
- Specific feature questions (webhooks)
- Upgrade scenario discussion

**Tests**:
- Product catalog navigation
- Feature comparison
- Pricing information retrieval

#### Scenario 4: Context Persistence & Topic Switching
Tests long conversations with topic changes:
- Start with billing question
- Switch to technical issue (API)
- Provide technical details (CORS errors)
- Return to original billing topic

**Tests**:
- Context maintenance across topics
- Conversation history tracking
- Coherent responses after topic switches

#### Scenario 5: Edge Cases & Complex Queries
Tests robustness with difficult inputs:
- Vague question ("It's not working")
- Multiple questions in one message
- Contradictory information (preference changes)

**Tests**:
- Clarification requests
- Multi-question handling
- Conflict resolution

#### Scenario 6: Knowledge Search Accuracy
Tests semantic search quality:
- Add specific knowledge (refunds, exports, API versions)
- Query with different phrasings
- Verify correct information retrieval

**Tests**:
- Semantic understanding
- Query variation handling
- Search relevance

## What Gets Tested

### ✅ Core Functionality
- [x] Agent initialization with base knowledge
- [x] Multi-turn conversations
- [x] Tool calling attempts
- [x] Knowledge storage
- [x] Context persistence

### ✅ Knowledge System
- [x] Base module loading (4 nodes)
- [x] Dynamic module creation
- [x] Knowledge node addition
- [x] Vector search functionality
- [x] Module isolation

### ✅ Tool Integration
- [x] `search_knowledge` tool
- [x] `add_knowledge` tool
- [x] `get_customer_request_data` tool
- [x] Tool argument parsing

### ✅ Conversation Quality
- [x] Context maintenance
- [x] Topic switching
- [x] Follow-up questions
- [x] Preference recall
- [x] Edge case handling

## Expected Results

### Quick Test
```
=== Testing Customer AI Agent ===

✓ Loaded 4 base knowledge nodes

============================================================
TEST 1: Basic greeting (should use base knowledge)
============================================================
🤖 Agent: [Greeting response using base knowledge]

... (4 more tests)

✓ All tests completed!
```

### Advanced Test
```
======================================================================
Advanced Customer AI Agent Test Suite
======================================================================

======================================================================
TEST 1: Customer Onboarding Flow
======================================================================

👤 Customer: Hi! I'm Sarah Johnson...
🤖 Agent: [Personalized response]

... (5 more scenarios with 15+ interactions)

======================================================================
✓ ALL SCENARIOS COMPLETE
Total time: 120.45 seconds
======================================================================

Summary:
  ✓ 6 scenarios tested
  ✓ Multi-turn conversations
  ✓ Knowledge accumulation
  ✓ Context persistence
  ✓ Edge case handling
  ✓ Search accuracy
```

## Performance Metrics

**Quick Test**:
- Tests: 5
- Interactions: 5
- Duration: ~30 seconds
- Knowledge nodes added: ~2

**Advanced Test**:
- Scenarios: 6
- Tests per scenario: 3-5
- Total interactions: 20+
- Duration: 2-3 minutes
- Knowledge nodes added: ~15

## Interpreting Results

### ✅ Success Indicators
- Agent loads base knowledge (4 nodes)
- Responses are contextually relevant
- Tool calls are attempted (visible in output)
- Knowledge modules track additions
- No crashes or errors

### ⚠️ Expected Behavior
- Tool calls may show as JSON in responses (Mistral 7B behavior)
- Some tools may not execute perfectly (normal for local models)
- Response times vary (2-5 seconds per message)
- Context window is limited (2048 tokens)

### ❌ Failure Indicators
- Connection errors (Ollama/Hippocampus not running)
- Python errors or crashes
- Empty responses
- Base knowledge not loading

## Troubleshooting Tests

**Services not running**:
```bash
# Start all services first
./start-agent.sh
# Then run tests in another terminal
```

**Tests timing out**:
```bash
# Ollama might be slow on first run
# Wait for model to load fully
ollama run mistral:7b "test"
```

**Import errors**:
```bash
# Activate venv
source venv/bin/activate
# Verify requests is installed
pip list | grep requests
```

## Creating Custom Tests

Example custom test:

```python
#!/usr/bin/env python3
import sys
sys.path.insert(0, '/projects/Customer-Agent-Thing/agent')

from agent import CustomerAgent, HippocampusClient, OllamaClient

# Initialize
hippocampus = HippocampusClient()
ollama = OllamaClient()
agent = CustomerAgent(
    agent_id="custom_test",
    hippocampus_client=hippocampus,
    ollama_client=ollama
)

# Add custom knowledge
agent.add_knowledge_node(
    key="custom_feature",
    content="Your custom knowledge here",
    module="custom_module"
)

# Test interaction
response = agent.chat("Your test query")
print(response)

# Verify
assert "expected text" in response.lower()
print("✓ Custom test passed!")
```

## CI/CD Integration

For automated testing:

```bash
#!/bin/bash
# ci-test.sh

# Start services
ollama serve &
OLLAMA_PID=$!

./Hippocampus/bin/hippocampus-server &
HIPPO_PID=$!

sleep 5  # Wait for services

# Run tests
./quick-test.sh
EXIT_CODE=$?

# Cleanup
kill $OLLAMA_PID $HIPPO_PID

exit $EXIT_CODE
```

## Test Coverage

| Component | Coverage |
|-----------|----------|
| Agent initialization | ✓ Full |
| Base knowledge loading | ✓ Full |
| Tool calling | ✓ Partial (format varies) |
| Knowledge storage | ✓ Full |
| Knowledge search | ✓ Full |
| Multi-turn conversation | ✓ Full |
| Context persistence | ✓ Full |
| Module management | ✓ Full |
| Edge cases | ✓ Good |
| Error handling | ⚠️ Basic |

## Future Test Enhancements

- [ ] Performance benchmarks
- [ ] Stress testing (100+ turns)
- [ ] Concurrent agent testing
- [ ] Memory leak detection
- [ ] Tool execution verification
- [ ] Response quality scoring
- [ ] Latency measurements

---

**Run tests regularly** to ensure system stability! 🧪
