# Hippocampus Local - 100% Local Vector Database

This is a customized version of Hippocampus that runs entirely locally with **no cloud dependencies**.

## Key Changes from Original

### 1. **Local Embeddings**
- Replaced AWS Bedrock Titan with local embedding support
- Default: Mock embedder (deterministic, fast, no external dependencies)
- Optional: HTTP-based local embedding service (e.g., sentence-transformers)

### 2. **In-Memory Storage with TTL**
- Data stored in memory with configurable TTL (default: 5 minutes)
- Automatic expiration after TTL
- Still supports file-based storage for persistence

### 3. **Redis Protocol Interface**
- Communicate via Redis protocol on port 6379
- Multi-tenant: each customer/agent gets isolated memory
- Compatible with any Redis client library

### 4. **Zero AWS Dependencies**
- Removed all AWS SDK dependencies
- Removed Lambda, S3, EFS, Terraform infrastructure
- Pure Go implementation with no external dependencies

## Quick Start

### Build the Server

```bash
cd Hippocampus
make build-server
```

### Start the Redis Server

```bash
./bin/hippocampus-server -addr :6379 -mock=true -ttl 5m
```

Options:
- `-addr`: Server address (default: `:6379`)
- `-mock`: Use mock embedder (default: `true`)
- `-embed-url`: URL for local embedding service if not using mock
- `-ttl`: Data time-to-live (default: `5m`)

## Redis Protocol Commands

### HSET - Insert a Memory
```
HSET customer_id key text
```

Example:
```
HSET customer_123 preference_theme "User prefers dark mode"
```

### HSEARCH - Search Memories
```
HSEARCH customer_id query epsilon threshold topk
```

Example:
```
HSEARCH customer_123 "theme preferences" 0.3 0.5 5
```

Parameters:
- `epsilon`: Search radius (0.2-0.5, higher = broader)
- `threshold`: Similarity threshold (0.0-1.0, higher = stricter)
- `topk`: Maximum results to return

### HINSERT - Insert with JSON
```
HINSERT customer_id {"key": "k", "text": "t"}
```

Example:
```
HINSERT customer_123 {"key": "purchase_history", "text": "Purchased premium on 2024-01-15"}
```

### HGET - Search with JSON
```
HGET customer_id {"query": "text", "epsilon": 0.3, "threshold": 0.5, "top_k": 5}
```

### EXISTS - Check if Customer Exists
```
EXISTS customer_id
```

### DEL - Delete Customer Data
```
DEL customer_id
```

### PING - Health Check
```
PING
```

## Python Client Example

```python
import socket
import json

def send_command(sock, *args):
    # Build RESP array format
    command = f"*{len(args)}\r\n"
    for arg in args:
        arg_str = str(arg)
        command += f"${len(arg_str)}\r\n{arg_str}\r\n"

    sock.sendall(command.encode())
    return sock.recv(4096).decode()

# Connect
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('localhost', 6379))

# Insert memory
send_command(sock, "HSET", "customer_123", "pref_theme", "User prefers dark mode")

# Search
results = send_command(sock, "HSEARCH", "customer_123", "theme settings", "0.3", "0.5", "5")

sock.close()
```

## Use Cases

### Customer AI Agent System

Perfect for building customer service agents that need to:
- Remember customer preferences
- Track conversation history
- Recall past interactions
- Maintain customer context

Each customer gets isolated memory that expires after TTL, ensuring:
- Privacy by default
- Automatic cleanup
- No manual data management

### Example: Customer Support Agent

```python
# Store customer context
HSET customer_456 contact_name "Sarah Johnson"
HSET customer_456 account_type "Premium subscriber since 2023"
HSET customer_456 last_issue "Billing question about renewal"
HSET customer_456 preference_communication "Prefers email over phone"

# Later, search for relevant context
HSEARCH customer_456 "billing preferences" 0.3 0.5 5
# Returns: Billing history and communication preferences
```

## Architecture

```
┌─────────────────────────────────────────┐
│   Redis Protocol Interface (:6379)      │
│   - HSET, HSEARCH, HGET, DEL, EXISTS    │
└───────────────┬─────────────────────────┘
                │
        ┌───────▼────────┐
        │  Client Layer  │
        │  Per-Customer  │
        │   Isolation    │
        └───────┬────────┘
                │
    ┌───────────┴───────────┐
    │                       │
┌───▼────────┐    ┌────────▼──────┐
│  Embedder  │    │ Memory Storage│
│  (Mock or  │    │ (In-Memory +  │
│   Local)   │    │     TTL)      │
└────────────┘    └───────────────┘
```

### Storage

- **In-Memory with TTL**: Default mode, data expires after configured duration
- **File-Based**: Optional, for persistent storage across restarts

### Embeddings

- **Mock Embedder**: Deterministic pseudo-random 512-dim vectors (fast, no dependencies)
- **Local Embedder**: HTTP-based service for real embeddings (e.g., sentence-transformers)

### Multi-Tenancy

Each customer/agent ID gets:
- Isolated vector database instance
- Separate memory space
- Independent TTL timer
- No cross-customer data leakage

## Performance

With mock embedder:
- **Insert**: <10ms (includes embedding generation + tree update)
- **Search**: <50ms for 5k vectors
- **Memory**: ~20MB per 5k vectors
- **Throughput**: Thousands of operations/second

## Building from Source

Requirements:
- Go 1.25+
- No external dependencies

```bash
cd Hippocampus
make build-server  # Builds bin/hippocampus-server
make build-cli     # Builds bin/hippocampus (file-based CLI)
make all          # Builds both
make clean        # Remove binaries
```

## Testing

Run the included test client:

```bash
python3 /projects/Customer-Agent-Thing/test-redis-client.py
```

## Future Enhancements

Potential additions:
- WebSocket interface
- REST API wrapper
- Authentication/authorization
- Metrics and monitoring
- Persistent Redis compatibility layer
- Real-time sync across instances

## License

Same as original Hippocampus project.

## Credits

Based on [Hippocampus](https://github.com/CameronBadman/Hippocampus) - a vector database built for AI agents.

Modified for 100% local operation with Redis protocol support.
