#!/bin/bash

# IT Support Agent - Docker Stop Script

echo "🛑 Stopping IT Support Agent services..."
docker-compose stop

echo ""
echo "✅ All services stopped"
echo ""
echo "To start again: ./scripts/docker-start.sh"
echo "To remove containers: docker-compose down"
echo "To remove all data: docker-compose down -v"
