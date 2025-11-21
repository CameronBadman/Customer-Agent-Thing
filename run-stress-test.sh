#!/bin/bash
# Run stress tests for Customer AI Agent

set -e

PROJECT_DIR="/projects/Customer-Agent-Thing"
cd "$PROJECT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${MAGENTA}================================${NC}"
echo -e "${MAGENTA}AI Agent Stress Test Suite${NC}"
echo -e "${MAGENTA}================================${NC}\n"

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

# Warning
echo -e "${YELLOW}⚠️  WARNING: Stress tests will push system to limits${NC}"
echo -e "${YELLOW}This includes:${NC}"
echo -e "  • 50-turn conversations"
echo -e "  • 200+ knowledge nodes"
echo -e "  • 100 rapid-fire queries"
echo -e "  • Concurrent agents"
echo -e "  • Memory intensive operations"
echo -e ""
echo -e "${YELLOW}Expected duration: 5-10 minutes${NC}\n"

# Confirm
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

echo -e "\n${GREEN}Starting stress tests...${NC}\n"

# Run stress tests
source venv/bin/activate
python3 agent/stress_test.py

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}================================${NC}"
    echo -e "${GREEN}✓ Stress tests PASSED${NC}"
    echo -e "${GREEN}================================${NC}"
else
    echo -e "\n${RED}================================${NC}"
    echo -e "${RED}✗ Stress tests FAILED${NC}"
    echo -e "${RED}================================${NC}"
fi

exit $EXIT_CODE
