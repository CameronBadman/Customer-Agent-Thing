# IT Support Agent - Docker Deployment

## Prerequisites

- Docker Desktop installed (includes Docker Compose)
- At least 8GB RAM available for Docker
- 20GB free disk space (for Ollama models)

## Quick Start

### 1. Build and Start All Services

```bash
# Build all containers
docker-compose build

# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f
```

### 2. Initial Setup

After starting the services, you need to:

**a) Wait for Ollama to pull the Mistral model (this takes 5-10 minutes on first run):**

```bash
# Check Ollama logs
docker-compose logs -f ollama

# Or manually pull the model
docker-compose exec ollama ollama pull mistral
```

**b) Seed Hippocampus with sample knowledge:**

```bash
docker-compose exec api python agent/seedHippocampus.py
```

**c) Create MongoDB indexes:**

```bash
docker-compose exec server node scripts/createIndexes.js
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Python AI API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐     │
│  │  React   │─────▶│ Express  │─────▶│  Python  │     │
│  │ :3000    │      │  :5001   │      │   API    │     │
│  └──────────┘      └──────────┘      │  :8000   │     │
│                                       └────┬─────┘     │
│                                            │           │
│  ┌──────────┐      ┌──────────┐      ┌────▼─────┐     │
│  │ MongoDB  │      │Hippocampus│◀────│  Ollama  │     │
│  │ :27017   │      │  :6379    │      │  :11434  │     │
│  └──────────┘      └──────────┘      └──────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Docker Commands

### View Service Status

```bash
# List running containers
docker-compose ps

# View resource usage
docker stats
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f ollama
docker-compose logs -f hippocampus
docker-compose logs -f mongodb
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
docker-compose restart server
```

### Stop Services

```bash
# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop ollama
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes (WARNING: deletes all data!)
docker-compose down -v

# Remove containers, volumes, and images
docker-compose down -v --rmi all
```

## Development Workflow

### Making Code Changes

The services use volume mounts, so code changes are reflected:

- **React**: Changes auto-reload via hot module replacement
- **Express**: Restart server: `docker-compose restart server`
- **Python API**: Restart API: `docker-compose restart api`

### Running Commands Inside Containers

```bash
# Access Python API container
docker-compose exec api bash

# Access Express backend
docker-compose exec server sh

# Access MongoDB shell
docker-compose exec mongodb mongosh it-support-agent

# Run seed scripts
docker-compose exec api python agent/seedHippocampus.py
docker-compose exec server node scripts/seedKnowledge.js
```

### Rebuild After Dependency Changes

```bash
# Rebuild specific service
docker-compose build api
docker-compose up -d api

# Rebuild all services
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Ollama Model Not Loaded

```bash
# Check if model is pulled
docker-compose exec ollama ollama list

# Pull model manually
docker-compose exec ollama ollama pull mistral

# Restart API after model is ready
docker-compose restart api
```

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify connection
docker-compose exec mongodb mongosh it-support-agent --eval "db.runCommand({ping:1})"
```

### Hippocampus Connection Issues

```bash
# Test Hippocampus connection
docker-compose exec hippocampus redis-cli -p 6379 ping

# Check Hippocampus logs
docker-compose logs hippocampus
```

### Port Conflicts

If ports are already in use:

```bash
# Check what's using the port
lsof -i :3000
lsof -i :5001
lsof -i :8000

# Edit docker-compose.yml to use different ports:
# ports:
#   - "3001:3000"  # Use 3001 instead of 3000
```

### Out of Memory

```bash
# Increase Docker Desktop memory allocation
# Docker Desktop → Settings → Resources → Memory

# Or limit Ollama memory in docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 4G
```

## Production Deployment

For production, modify docker-compose.yml:

1. Remove volume mounts (use built images)
2. Use production builds for React
3. Set proper environment variables
4. Enable SSL/TLS
5. Use secrets management
6. Set up reverse proxy (nginx)
7. Configure proper logging

Example production changes:

```yaml
# docker-compose.prod.yml
services:
  client:
    build:
      context: ./client
      target: production
    environment:
      - NODE_ENV=production
    command: npm run build && npx serve -s build

  server:
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}  # Use secrets
```

## GPU Support (Optional)

To use GPU acceleration for Ollama:

1. Install NVIDIA Container Toolkit
2. Uncomment GPU section in docker-compose.yml
3. Restart services

```bash
docker-compose up -d --force-recreate ollama
```

## Backup and Restore

### Backup Data

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out=/tmp/backup
docker cp it-support-mongodb:/tmp/backup ./mongodb-backup

# Backup Hippocampus
docker cp it-support-hippocampus:/data ./hippocampus-backup
```

### Restore Data

```bash
# Restore MongoDB
docker cp ./mongodb-backup it-support-mongodb:/tmp/backup
docker-compose exec mongodb mongorestore /tmp/backup

# Restore Hippocampus
docker cp ./hippocampus-backup/. it-support-hippocampus:/data
docker-compose restart hippocampus
```
