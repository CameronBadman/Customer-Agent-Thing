#!/bin/bash
# Run BREAK tests - Try to break the AI agent system

set -e

PROJECT_DIR="/projects/Customer-Agent-Thing"
cd "$PROJECT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}================================${NC}"
echo -e "${RED}🔨 AI AGENT BREAK TESTS 🔨${NC}"
echo -e "${RED}================================${NC}\n"

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
echo -e "${RED}⚠️  WARNING: BREAK TESTS${NC}"
echo -e "${YELLOW}These tests will attempt to:${NC}"
echo -e "  ${RED}•${NC} Inject malicious code (SQL, XSS, command injection)"
echo -e "  ${RED}•${NC} Send adversarial inputs (extreme sizes, special chars)"
echo -e "  ${RED}•${NC} Try prompt injection & jailbreak"
echo -e "  ${RED}•${NC} Exhaust resources (memory, CPU)"
echo -e "  ${RED}•${NC} Send logic bombs & paradoxes"
echo -e "  ${RED}•${NC} Test boundary conditions"
echo -e "  ${RED}•${NC} Attempt state corruption"
echo -e ""
echo -e "${YELLOW}Goal: Find weaknesses and edge cases${NC}"
echo -e "${YELLOW}Expected duration: 3-5 minutes${NC}\n"

# Confirm
read -p "Continue with break tests? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

echo -e "\n${RED}🔨 Starting break tests...${NC}\n"

# Run break tests
source venv/bin/activate
python3 agent/break_test.py

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}================================${NC}"
    echo -e "${GREEN}✓ SYSTEM ROBUST${NC}"
    echo -e "${GREEN}Survived all break attempts!${NC}"
    echo -e "${GREEN}================================${NC}"
else
    echo -e "\n${RED}================================${NC}"
    echo -e "${RED}⚠️  VULNERABILITIES FOUND${NC}"
    echo -e "${RED}Some tests broke the system${NC}"
    echo -e "${RED}================================${NC}"
fi

exit $EXIT_CODE
