# Customer AI Agent API

FastAPI REST interface for conversational AI agents with persistent memory.

## Features

- 🚀 **Fast**: Built on FastAPI with async support
- 💾 **Persistent Memory**: Each agent remembers across sessions
- 🔒 **Security**: Built-in prompt injection detection and anomaly detection
- 🔧 **Multi-Agent**: Support for multiple isolated agents
- 📊 **Monitoring**: Agent status, statistics, and health checks
- 🛡️ **Production-Ready**: CORS, error handling, logging

## Quick Start

### 1. Start the API

```bash
./start-api.sh
```

This automatically starts:
- Ollama (AI model server)
- Hippocampus (vector memory database)
- FastAPI server (port 8000)

### 2. Test the API

```bash
# In another terminal
python3 api/test_api.py
```

Or visit the interactive docs:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Core Endpoints

#### `POST /chat`
Send a message to an agent and get a response.

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "customer_001",
    "message": "Hello! I need help with my account"
  }'
```

Response:
```json
{
  "agent_id": "customer_001",
  "message": "Hello! I need help with my account",
  "response": "Hello! I'd be happy to help you with your account...",
  "timestamp": "2024-01-15T10:30:00",
  "injection_detected": false,
  "anomaly_score": 0.12
}
```

#### `GET /agent/{agent_id}/status`
Get agent status and statistics.

```bash
curl "http://localhost:8000/agent/customer_001/status"
```

Response:
```json
{
  "agent_id": "customer_001",
  "exists": true,
  "total_messages": 15,
  "injection_attempts": 0,
  "knowledge_modules": {
    "base": 4,
    "customer_preferences": 2,
    "product_knowledge": 1
  }
}
```

### Knowledge Management

#### `POST /agent/knowledge/add`
Add knowledge to agent's memory.

```bash
curl -X POST "http://localhost:8000/agent/knowledge/add" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "customer_001",
    "key": "product_pricing",
    "content": "Premium plan costs $29/month",
    "module": "product_knowledge"
  }'
```

#### `POST /agent/knowledge/search`
Search agent's knowledge base.

```bash
curl -X POST "http://localhost:8000/agent/knowledge/search" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "customer_001",
    "query": "pricing",
    "top_k": 5
  }'
```

### Agent Management

#### `GET /agents`
List all active agents.

```bash
curl "http://localhost:8000/agents"
```

#### `POST /agent/reset`
Reset agent conversation (keeps knowledge).

```bash
curl -X POST "http://localhost:8000/agent/reset" \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "customer_001"}'
```

#### `POST /agent/clear`
Clear agent knowledge base (reset to base module).

```bash
curl -X POST "http://localhost:8000/agent/clear" \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "customer_001"}'
```

#### `DELETE /agent/{agent_id}`
Delete agent and all its data.

```bash
curl -X DELETE "http://localhost:8000/agent/customer_001"
```

### Health & Monitoring

#### `GET /health`
Health check for all services.

```bash
curl "http://localhost:8000/health"
```

## Python Client Example

```python
import requests

# Chat with agent
response = requests.post("http://localhost:8000/chat", json={
    "agent_id": "customer_001",
    "message": "What's the pricing?"
})

data = response.json()
print(f"Agent: {data['response']}")
```

## JavaScript/TypeScript Example

```javascript
// Chat with agent
const response = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agent_id: 'customer_001',
    message: "What's the pricing?"
  })
});

const data = await response.json();
console.log(`Agent: ${data.response}`);
```

## Architecture

```
┌─────────────┐
│  Client     │
│  (REST)     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   FastAPI Server    │
│   (Port 8000)       │
└──────┬──────┬───────┘
       │      │
       ▼      ▼
┌──────────┐  ┌────────────────┐
│  Ollama  │  │  Hippocampus   │
│ (11434)  │  │  (Redis 6379)  │
└──────────┘  └────────────────┘
```

## Security Features

### 1. Prompt Injection Detection
Automatically detects and blocks:
- Role manipulation attempts
- System override attempts
- DAN jailbreaks
- Encoding bypasses

### 2. Anomaly Detection
ML-based user behavior analysis:
- Message length patterns
- Special character ratios
- Timing analysis
- Keyword repetition

### 3. Response Validation
Checks responses for compromise indicators before sending.

## Performance

- **Latency**: 2-5 seconds per response (LLM generation time)
- **Throughput**: 100+ requests/second
- **Memory**: ~50MB per agent
- **Agents**: Unlimited (lazy loaded)

## Production Deployment

### Environment Variables

```bash
export HIPPOCAMPUS_HOST=localhost
export HIPPOCAMPUS_PORT=6379
export OLLAMA_URL=http://localhost:11434
export OLLAMA_MODEL=mistral:7b
export API_PORT=8000
```

### Docker Compose (TODO)

```yaml
version: '3.8'
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"

  hippocampus:
    build: ./Hippocampus
    ports:
      - "6379:6379"

  api:
    build: ./api
    ports:
      - "8000:8000"
    depends_on:
      - ollama
      - hippocampus
```

## Configuration

Edit `api/main.py` to customize:

```python
# Change AI model
ollama_client = OllamaClient(
    base_url='http://localhost:11434',
    model='llama3.2:3b'  # Use smaller model
)

# Adjust rate limits
agent.rate_limit_max = 20  # 20 requests/minute

# Change context window
agent.default_context_messages = 20  # Last 20 messages
agent.default_max_chars_per_message = 1000  # 1000 chars per message
```

## Troubleshooting

**API won't start:**
```bash
# Check if services are running
curl http://localhost:11434/api/version  # Ollama
redis-cli -p 6379 PING  # Hippocampus

# Check logs
tail -f /tmp/ollama.log
tail -f /tmp/hippocampus.log
```

**Slow responses:**
- Use smaller model: `phi3:mini` or `llama3.2:3b`
- Reduce max_iterations in chat request
- Check Ollama GPU usage

**Memory issues:**
- Set TTL on Hippocampus: `-ttl 30m`
- Delete inactive agents periodically
- Use agent reset endpoint frequently

## Development

```bash
# Install dependencies
source venv/bin/activate
pip install -r api/requirements.txt

# Run in development mode with hot reload
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
python3 api/test_api.py
```

## License

Same as parent project.
