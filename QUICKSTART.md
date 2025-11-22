# IT Support Agent - Quick Start Guide

## Two Ways to Run

### Option 1: Docker (Recommended)

**Requirements:**
- Docker Desktop installed
- 8GB RAM available
- 20GB free disk space

**Start Everything:**
```bash
./scripts/docker-start.sh
```

This script will:
1. Build all Docker images
2. Start all services
3. Pull the Mistral AI model
4. Seed the knowledge base
5. Create database indexes

**Access:**
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

**Stop:**
```bash
./scripts/docker-stop.sh
```

---

### Option 2: Manual Setup

**Requirements:**
- Node.js 18+
- Python 3.11+
- MongoDB
- Ollama with Mistral model

**Terminal 1 - Hippocampus:**
```bash
cd Hippocampus
make
./bin/hippocampus-server --port 6379
```

**Terminal 2 - Ollama:**
```bash
ollama serve
ollama pull mistral
```

**Terminal 3 - Python API:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python agent/seedHippocampus.py
cd api
MONGO_URI=mongodb://localhost:27017/it-support-agent python main.py
```

**Terminal 4 - Express Backend:**
```bash
cd server
npm install
node scripts/createIndexes.js
npm start
```

**Terminal 5 - React Frontend:**
```bash
cd client
npm install
npm start
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5001
- API: http://localhost:8000

---

## First Time Setup

### 1. Register a User

Go to http://localhost:3000 and create an account.

### 2. Create an Admin User (Optional)

For admin access to manage base knowledge:

```bash
# Using Docker:
docker-compose exec mongodb mongosh it-support-agent

# Or locally:
mongosh it-support-agent
```

Then in the MongoDB shell:
```javascript
db.users.updateOne(
  {username: "your_username"},
  {$set: {role: "admin"}}
)
```

### 3. Test the Chat

Ask IT support questions like:
- "How do I reset my password?"
- "My VPN isn't working"
- "How do I install new software?"

The agent will use the 3-tier knowledge base:
- **Base Knowledge**: Company policies
- **Completed Issues**: Past solutions
- **User-Specific**: Your preferences and history

---

## Architecture

```
React Frontend (3000)
    ↓
Express Backend (5001)
    ↓
Python FastAPI (8000)
    ↓
┌───────────────┬──────────────┬─────────────┐
│  Hippocampus  │   MongoDB    │   Ollama    │
│  (Vector DB)  │  (Chat DB)   │  (LLM)      │
│     6379      │    27017     │   11434     │
└───────────────┴──────────────┴─────────────┘
```

---

## Troubleshooting

### Docker Issues

**Services won't start:**
```bash
docker-compose down
docker-compose up -d
docker-compose logs -f
```

**Out of memory:**
- Increase Docker Desktop memory allocation
- Settings → Resources → Memory → 8GB+

**Port conflicts:**
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5001
lsof -i :8000
```

### Common Errors

**"Ollama connection timeout"**
- Wait for Mistral model to finish downloading
- Check: `docker-compose logs ollama`

**"MongoDB connection refused"**
- Verify MongoDB is running
- Check: `docker-compose ps mongodb`

**"Hippocampus connection error"**
- Verify Hippocampus is running
- Check: `docker-compose ps hippocampus`

---

## Next Steps

- See `README.docker.md` for detailed Docker documentation
- See `ARCHITECTURE.md` for system architecture details
- See `api/main.py` for API endpoint documentation (or visit http://localhost:8000/docs)

---

## Development

### Making Changes

**Frontend (React):**
```bash
# Edit files in client/src
# Changes auto-reload
```

**Backend (Express):**
```bash
# Edit files in server/
# Restart: docker-compose restart server
```

**Python API:**
```bash
# Edit files in agent/ or api/
# Restart: docker-compose restart api
```

### Adding Knowledge

**Base Knowledge (Admin only):**
```python
docker-compose exec api python
>>> from agent.hippo_kb_agent import HippocampusKBAgent
>>> from agent.agent import HippocampusClient
>>> hippo = HippocampusClient(host='hippocampus', port=6379)
>>> agent = HippocampusKBAgent(hippo)
>>> agent.add_base_knowledge('new_policy', 'Policy content here...')
```

**Completed Issues:**
```python
>>> agent.add_completed_issue('ticket_123', {
...   'problem': 'Issue description',
...   'solution': 'How it was solved'
... })
```

**User-Specific:**
```python
>>> agent.add_user_knowledge('username', 'preferences', 'User preferences...')
```

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f [service]`
2. Review ARCHITECTURE.md
3. Check API docs: http://localhost:8000/docs
