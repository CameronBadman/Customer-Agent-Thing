# Customer AI Agent System

A complete **local AI agent system** with modular self-modifying knowledge base for customer support.

## ✨ What You Have

🤖 **AI Agent** that can:
- Add/remove knowledge nodes autonomously
- Search its own knowledge base
- Remember customer preferences
- Make tool calls to access data
- Run 100% locally with no cloud APIs

## Architecture

```
┌─────────────────────────────────────────────────┐
│          Customer AI Agent (Python)             │
│  - Ollama Mistral 7B (Tool Calling)            │
│  - Modular Knowledge System                     │
│  - Self-Modifying Knowledge Base                │
└──────────────┬────────────────┬─────────────────┘
               │                │
    ┌──────────▼──────┐  ┌─────▼────────────┐
    │  Hippocampus    │  │  Customer Data   │
    │  (Redis Server) │  │     System       │
    │  - Vector DB    │  │  (To be added)   │
    │  - In-Memory    │  └──────────────────┘
    │  - TTL: 30min   │
    └─────────────────┘
```

## Quick Start

### Option 1: One-Command Start (Recommended)

```bash
./start-agent.sh
```

This script automatically:
- Checks and starts Ollama if needed
- Checks and starts Hippocampus if needed
- Starts the AI agent
- Handles cleanup on exit

### Option 2: Manual Start

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start Hippocampus
cd /projects/Customer-Agent-Thing
./Hippocampus/bin/hippocampus-server -addr :6379 -mock=true -ttl 30m

# Terminal 3: Run Agent
source venv/bin/activate
python3 agent/agent.py
```

### Run Tests

```bash
# Quick test (30 seconds)
./quick-test.sh

# Advanced scenarios (2-3 min)
./run-advanced-tests.sh

# Break tests - Try to break the system! (3-5 min)
./run-break-tests.sh
```

### Try It

```
👤 You: Hi, I prefer dark mode

🤖 Agent: [Stores preference in knowledge base]
I've recorded your dark mode preference!

👤 You: What are my UI preferences?

🤖 Agent: [Searches knowledge base]
You prefer dark mode on all interfaces.
```

## Knowledge Module System

### Base Module (Loaded at Startup)
- Greeting protocols
- Company policies
- Escalation procedures
- Privacy guidelines

### Dynamic Modules (Added During Conversation)
- **customer_preferences**: UI, language, communication style
- **product_knowledge**: Pricing, features, specifications
- **conversation_history**: Past interactions

## Agent Tools

1. **`search_knowledge`** - Vector search in knowledge base
2. **`add_knowledge`** - Store new information
3. **`get_customer_request_data`** - Access customer data

## Files

```
Customer-Agent-Thing/
├── start-agent.sh        # ⭐ One-command launcher
├── quick-test.sh         # Run automated tests
├── Hippocampus/          # Vector database (Redis protocol)
├── agent/
│   ├── agent.py          # Main agent
│   └── test_agent.py     # Test script
├── venv/                 # Python environment
└── README.md             # This file
```

## Performance

- **Model**: Mistral 7B (~6GB VRAM)
- **Response Time**: 2-5 seconds
- **Memory**: ~20MB per agent
- **100% Local**: No cloud APIs

## Documentation

- **Full README**: You're reading it!
- **Hippocampus Docs**: `Hippocampus/README-LOCAL.md`
- **Setup Guide**: `SETUP-COMPLETE.md`

---

## 🚀 Get Started Now

```bash
./start-agent.sh
```

That's it! The agent is ready to chat.
