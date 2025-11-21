#!/bin/bash
# Run advanced test suite for Customer AI Agent

set -e

PROJECT_DIR="/projects/Customer-Agent-Thing"
cd "$PROJECT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}================================${NC}"
echo -e "${CYAN}Advanced Agent Test Suite${NC}"
echo -e "${CYAN}================================${NC}\n"

# Check if services are running
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Check Ollama
if ! check_port 11434; then
    echo -e "${RED}✗ Ollama is not running${NC}"
    echo -e "${YELLOW}Start it with: ollama serve${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Ollama is running${NC}"

# Check Hippocampus
if ! check_port 6379; then
    echo -e "${RED}✗ Hippocampus is not running${NC}"
    echo -e "${YELLOW}Start it with: ./Hippocampus/bin/hippocampus-server -addr :6379 -mock=true -ttl 30m${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Hippocampus is running${NC}\n"

# Run advanced tests
echo -e "${YELLOW}Running 6 advanced test scenarios...${NC}"
echo -e "${CYAN}This will take 2-3 minutes${NC}\n"

source venv/bin/activate
python3 agent/advanced_test.py

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Advanced tests complete!${NC}"
echo -e "${GREEN}================================${NC}"
