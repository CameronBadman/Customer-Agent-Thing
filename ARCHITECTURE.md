# IT Support Agent - Correct Architecture

## Storage Architecture

### Hippocampus (Vector Database) - Port 6379
**Purpose:** ALL knowledge storage using vector embeddings for semantic search

**Namespaces:**
```
base_knowledge/               # Company-wide IT policies (shared)
  ├─ password_policy
  ├─ vpn_setup
  ├─ software_requests
  └─ ...

completed_issues/             # Past resolved tickets (shared)
  ├─ issue_001
  ├─ issue_002
  └─ ...

user_specific_{username}/     # Per-user knowledge (isolated)
  ├─ user_specific_john/
  │   ├─ system_info
  │   ├─ preferences
  │   └─ past_issues
  ├─ user_specific_jane/
  │   └─ ...
  └─ ...
```

### MongoDB - Port 27017
**Purpose:** Conversation history and Hippocampus file references only

**Collections:**
```
chats                        # Chat messages
users                        # User accounts with role
hipporeferences              # Pointers to Hippocampus namespaces
```

---

## Data Flow

```
User Message
    ↓
Express Backend (/api/chat/message)
    ↓
Python AI Agent API (/hippo-chat)
    ↓
┌──────────────────────────────────────┐
│  HippocampusKBAgent                  │
│                                      │
│  1. Search base_knowledge (Hippo)   │
│  2. Search completed_issues (Hippo) │
│  3. Search user_specific_X (Hippo)  │
│  4. Combine context                 │
│  5. Send to Ollama LLM              │
└──────────────────────────────────────┘
    ↓
Response with context from all 3 KBs
    ↓
Store conversation in MongoDB
```

---

## Why This Architecture?

### Hippocampus Advantages:
✅ **Vector embeddings** - Semantic search, not just keyword matching
✅ **Fast similarity search** - Find relevant knowledge by meaning
✅ **Isolated namespaces** - Each user gets their own KB
✅ **Built for AI** - Designed for LLM context retrieval

### MongoDB Purpose:
✅ **Chat history** - Stores conversation messages
✅ **User metadata** - Authentication, roles, profiles
✅ **Hippocampus references** - Tracks which namespace belongs to which user
✅ **NOT for knowledge storage** - That's Hippocampus's job

---

## Files Created

### Agent
- `agent/hippo_kb_agent.py` - New agent using Hippocampus for all KBs
- `agent/agent.py` - Original agent (still exists, not used by chat)
- `agent/mongo_agent.py` - MongoDB agent (deprecated, don't use)

### Models
- `server/models/HippoReference.js` - MongoDB model tracking Hippocampus namespaces
- `server/models/BaseKnowledge.js` - DEPRECATED (was for MongoDB KB)
- `server/models/CompletedIssue.js` - DEPRECATED (was for MongoDB KB)
- `server/models/UserProfile.js` - DEPRECATED (was for MongoDB KB)

### Scripts
- `server/scripts/seedHippocampus.py` - Load sample data into Hippocampus
- `server/scripts/seedKnowledge.js` - DEPRECATED (was for MongoDB)

---

## Next Steps

1. **Seed Hippocampus** with sample knowledge:
   ```bash
   python agent/seedHippocampus.py
   ```

2. **Update FastAPI** to use `hippo_kb_agent` instead of `mongo_agent`

3. **Test the 3-tier KB**:
   - BASE: Company policies from Hippocampus
   - COMP: Past issues from Hippocampus
   - SPECIFIC: User's personal KB from Hippocampus

---

## How to Add Knowledge

### Admin adds to BASE KB (company-wide):
```python
agent.add_base_knowledge(
    key="vpn_policy_2024",
    content="VPN access requires 2FA. Download Cisco AnyConnect..."
)
```

### System adds to COMP KB (resolved issue):
```python
agent.add_completed_issue(
    issue_id="ticket_12345",
    issue_data={
        "problem": "Outlook not syncing",
        "solution": "Clear cache and reinstall..."
    }
)
```

### Agent adds to USER KB (user-specific):
```python
agent.add_user_knowledge(
    username="john",
    key="system_info",
    content="John uses macOS Sonoma, prefers detailed explanations..."
)
```

---

## MongoDB Only Stores

```javascript
// Chat messages
{
  chatId: "uuid",
  messages: [{role: "user", content: "..."}],
  ...
}

// Hippocampus namespace reference
{
  username: "john",
  hippoNamespace: "user_specific_john",
  lastAccessed: Date,
  knowledgeCount: 15
}
```

**NO knowledge content in MongoDB - all in Hippocampus!**
