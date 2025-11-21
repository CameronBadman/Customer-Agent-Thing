#!/bin/bash
# Start Customer AI Agent System
# This script starts all required services and the agent

set -e  # Exit on error

PROJECT_DIR="/projects/Customer-Agent-Thing"
cd "$PROJECT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Customer AI Agent System${NC}"
echo -e "${GREEN}================================${NC}\n"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0

    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"

    while [ $attempt -lt $max_attempts ]; do
        if check_port $port; then
            echo -e "${GREEN}✓ $service_name is ready!${NC}\n"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done

    echo -e "${RED}✗ $service_name failed to start${NC}"
    return 1
}

# 1. Check/Start Ollama
echo -e "${YELLOW}[1/3] Checking Ollama...${NC}"
if check_port 11434; then
    echo -e "${GREEN}✓ Ollama is already running${NC}\n"
else
    echo -e "${YELLOW}Starting Ollama server...${NC}"
    ollama serve > /tmp/ollama.log 2>&1 &
    OLLAMA_PID=$!
    echo $OLLAMA_PID > /tmp/ollama.pid

    if wait_for_service 11434 "Ollama"; then
        echo -e "${GREEN}Ollama logs: /tmp/ollama.log${NC}\n"
    else
        echo -e "${RED}Failed to start Ollama. Check /tmp/ollama.log${NC}"
        exit 1
    fi
fi

# 2. Check/Start Hippocampus
echo -e "${YELLOW}[2/3] Checking Hippocampus...${NC}"
if check_port 6379; then
    echo -e "${GREEN}✓ Hippocampus is already running${NC}\n"
else
    echo -e "${YELLOW}Starting Hippocampus Redis server...${NC}"
    ./Hippocampus/bin/hippocampus-server -addr :6379 -mock=true -ttl 30m > /tmp/hippocampus.log 2>&1 &
    HIPPO_PID=$!
    echo $HIPPO_PID > /tmp/hippocampus.pid

    if wait_for_service 6379 "Hippocampus"; then
        echo -e "${GREEN}Hippocampus logs: /tmp/hippocampus.log${NC}\n"
    else
        echo -e "${RED}Failed to start Hippocampus. Check /tmp/hippocampus.log${NC}"
        exit 1
    fi
fi

# 3. Start Agent
echo -e "${YELLOW}[3/3] Starting AI Agent...${NC}\n"
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}All services ready!${NC}"
echo -e "${GREEN}================================${NC}\n"

# Activate venv and run agent
source venv/bin/activate

echo -e "${YELLOW}Commands:${NC}"
echo -e "  ${GREEN}quit/exit/q${NC} - Exit the agent"
echo -e "  ${GREEN}reset${NC}       - Clear conversation history"
echo -e "  ${GREEN}clear${NC}       - Reset knowledge base to base module"
echo ""
echo -e "${GREEN}================================${NC}\n"

# Run the agent
python3 agent/agent.py

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"

    # Kill Hippocampus if we started it
    if [ -f /tmp/hippocampus.pid ]; then
        HIPPO_PID=$(cat /tmp/hippocampus.pid)
        if kill -0 $HIPPO_PID 2>/dev/null; then
            echo -e "${YELLOW}Stopping Hippocampus (PID: $HIPPO_PID)...${NC}"
            kill $HIPPO_PID
            rm /tmp/hippocampus.pid
        fi
    fi

    # Note: We don't kill Ollama as it might be used by other processes
    # If you want to stop Ollama too, uncomment these lines:
    # if [ -f /tmp/ollama.pid ]; then
    #     OLLAMA_PID=$(cat /tmp/ollama.pid)
    #     if kill -0 $OLLAMA_PID 2>/dev/null; then
    #         echo -e "${YELLOW}Stopping Ollama (PID: $OLLAMA_PID)...${NC}"
    #         kill $OLLAMA_PID
    #         rm /tmp/ollama.pid
    #     fi
    # fi

    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

# Register cleanup function to run on exit
trap cleanup EXIT
