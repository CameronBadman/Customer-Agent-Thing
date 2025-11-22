#!/bin/bash

# IT Support Agent - Docker Quick Start Script

set -e

echo "======================================"
echo "IT Support Agent - Docker Setup"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✓ Docker is running"
echo ""

# Build images
echo "📦 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Wait for MongoDB
echo "  - Waiting for MongoDB..."
until docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    sleep 2
done
echo "    ✓ MongoDB ready"

# Wait for Hippocampus
echo "  - Waiting for Hippocampus..."
until docker-compose exec -T hippocampus redis-cli -p 6379 ping > /dev/null 2>&1; do
    sleep 2
done
echo "    ✓ Hippocampus ready"

# Wait for API
echo "  - Waiting for Python API..."
until curl -s http://localhost:8000/health > /dev/null; do
    sleep 2
done
echo "    ✓ Python API ready"

# Wait for Express backend
echo "  - Waiting for Express backend..."
until curl -s http://localhost:5001/api/health > /dev/null; do
    sleep 2
done
echo "    ✓ Express backend ready"

echo ""
echo "📥 Pulling Ollama Mistral model (this may take 5-10 minutes)..."
docker-compose exec -T ollama ollama pull mistral || echo "⚠️  Ollama pull in progress in background"

echo ""
echo "🌱 Seeding Hippocampus with sample data..."
docker-compose exec -T api python agent/seedHippocampus.py

echo ""
echo "📊 Creating MongoDB indexes..."
docker-compose exec -T server node scripts/createIndexes.js

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "🌐 Access the application:"
echo "   - Frontend:  http://localhost:3000"
echo "   - Backend:   http://localhost:5001"
echo "   - API:       http://localhost:8000"
echo "   - API Docs:  http://localhost:8000/docs"
echo ""
echo "📋 Useful commands:"
echo "   - View logs:        docker-compose logs -f"
echo "   - Stop services:    docker-compose stop"
echo "   - Restart services: docker-compose restart"
echo "   - Clean up:         docker-compose down"
echo ""
echo "📚 See README.docker.md for more information"
echo ""
