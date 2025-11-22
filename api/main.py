#!/usr/bin/env python3
"""
FastAPI wrapper for Customer AI Agent
Provides REST API for conversations with persistent memory
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import sys
import logging
from datetime import datetime

# Add agent to path
sys.path.insert(0, '/projects/Customer-Agent-Thing/agent')
from agent import CustomerAgent, HippocampusClient, OllamaClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Customer AI Agent API",
    description="REST API for conversational AI with persistent memory",
    version="1.0.0"
)

# CORS middleware for web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global clients (initialized on startup)
hippocampus_client = None
ollama_client = None

# Agent cache: agent_id -> CustomerAgent instance
agent_cache: Dict[str, CustomerAgent] = {}

# Request/Response Models
class ChatRequest(BaseModel):
    agent_id: str = Field(..., description="Unique agent/customer ID")
    message: str = Field(..., description="User message")
    max_iterations: Optional[int] = Field(5, description="Max tool calling iterations")

class ChatResponse(BaseModel):
    agent_id: str
    message: str
    response: str
    timestamp: str
    injection_detected: bool = False
    anomaly_score: Optional[float] = None

class AgentStatusResponse(BaseModel):
    agent_id: str
    exists: bool
    total_messages: int
    injection_attempts: int
    knowledge_modules: Dict[str, int]

class ResetRequest(BaseModel):
    agent_id: str = Field(..., description="Agent ID to reset")

class AddKnowledgeRequest(BaseModel):
    agent_id: str
    key: str
    content: str
    module: str = "dynamic"

class SearchKnowledgeRequest(BaseModel):
    agent_id: str
    query: str
    top_k: int = 5

# Startup: Initialize shared clients
@app.on_event("startup")
async def startup_event():
    global hippocampus_client, ollama_client

    logger.info("Starting Customer AI Agent API...")

    # Initialize shared clients
    hippocampus_client = HippocampusClient(host='localhost', port=6379)
    ollama_client = OllamaClient(base_url='http://localhost:11434', model='mistral:7b')

    logger.info("✓ Hippocampus client initialized")
    logger.info("✓ Ollama client initialized")
    logger.info("✓ API ready to accept requests")

# Get or create agent instance
def get_agent(agent_id: str) -> CustomerAgent:
    """Get cached agent or create new one"""
    if agent_id not in agent_cache:
        logger.info(f"Creating new agent: {agent_id}")
        agent = CustomerAgent(
            agent_id=agent_id,
            hippocampus_client=hippocampus_client,
            ollama_client=ollama_client
        )
        agent_cache[agent_id] = agent
    return agent_cache[agent_id]

# Health check
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "Customer AI Agent API",
        "version": "1.0.0",
        "active_agents": len(agent_cache)
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "hippocampus": "connected",
        "ollama": "connected",
        "active_agents": len(agent_cache)
    }

# Main chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to an AI agent and get a response

    The agent has persistent memory and will remember context across sessions.
    """
    try:
        # Get or create agent
        agent = get_agent(request.agent_id)

        # Process message
        logger.info(f"Agent {request.agent_id}: Processing message")
        response = agent.chat(request.message, max_iterations=request.max_iterations)

        # Check if injection was detected
        injection_detected = False
        if agent.injection_attempts > 0 and agent.last_injection_time:
            injection_detected = True

        anomaly_score = None
        if agent.behavior_profile.anomaly_score_history:
            anomaly_score = agent.behavior_profile.anomaly_score_history[-1]

        return ChatResponse(
            agent_id=request.agent_id,
            message=request.message,
            response=response,
            timestamp=datetime.now().isoformat(),
            injection_detected=injection_detected,
            anomaly_score=anomaly_score
        )

    except Exception as e:
        logger.error(f"Error processing chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Agent status
@app.get("/agent/{agent_id}/status", response_model=AgentStatusResponse)
async def get_agent_status(agent_id: str):
    """Get agent status and statistics"""
    if agent_id not in agent_cache:
        return AgentStatusResponse(
            agent_id=agent_id,
            exists=False,
            total_messages=0,
            injection_attempts=0,
            knowledge_modules={}
        )

    agent = agent_cache[agent_id]
    modules_count = {
        module: len(nodes)
        for module, nodes in agent.knowledge_modules.items()
    }

    return AgentStatusResponse(
        agent_id=agent_id,
        exists=True,
        total_messages=agent.behavior_profile.total_messages,
        injection_attempts=agent.injection_attempts,
        knowledge_modules=modules_count
    )

# Reset conversation
@app.post("/agent/reset")
async def reset_agent(request: ResetRequest):
    """Reset agent conversation history (keeps knowledge base)"""
    if request.agent_id not in agent_cache:
        raise HTTPException(status_code=404, detail=f"Agent {request.agent_id} not found")

    agent = agent_cache[request.agent_id]
    agent.reset()

    return {
        "status": "success",
        "agent_id": request.agent_id,
        "message": "Conversation history reset"
    }

# Clear knowledge base
@app.post("/agent/clear")
async def clear_agent(request: ResetRequest):
    """Clear agent knowledge base (reset to base module)"""
    if request.agent_id not in agent_cache:
        raise HTTPException(status_code=404, detail=f"Agent {request.agent_id} not found")

    agent = agent_cache[request.agent_id]
    agent.clear_knowledge()

    return {
        "status": "success",
        "agent_id": request.agent_id,
        "message": "Knowledge base cleared"
    }

# Delete agent
@app.delete("/agent/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete agent and all its data"""
    if agent_id in agent_cache:
        agent = agent_cache[agent_id]
        agent.hippocampus.delete(agent_id)
        del agent_cache[agent_id]

        return {
            "status": "success",
            "agent_id": agent_id,
            "message": "Agent deleted"
        }

    raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

# Add knowledge
@app.post("/agent/knowledge/add")
async def add_knowledge(request: AddKnowledgeRequest):
    """Add knowledge to agent's knowledge base"""
    agent = get_agent(request.agent_id)

    success = agent.add_knowledge_node(
        key=request.key,
        content=request.content,
        module=request.module
    )

    if success:
        return {
            "status": "success",
            "agent_id": request.agent_id,
            "key": request.key,
            "module": request.module
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to add knowledge")

# Search knowledge
@app.post("/agent/knowledge/search")
async def search_knowledge(request: SearchKnowledgeRequest):
    """Search agent's knowledge base"""
    agent = get_agent(request.agent_id)

    results = agent.search_knowledge(request.query, top_k=request.top_k)

    return {
        "status": "success",
        "agent_id": request.agent_id,
        "query": request.query,
        "results": results
    }

# List all active agents
@app.get("/agents")
async def list_agents():
    """List all active agents"""
    agents = []
    for agent_id, agent in agent_cache.items():
        agents.append({
            "agent_id": agent_id,
            "total_messages": agent.behavior_profile.total_messages,
            "injection_attempts": agent.injection_attempts,
            "modules": list(agent.knowledge_modules.keys())
        })

    return {
        "total_agents": len(agents),
        "agents": agents
    }

if __name__ == "__main__":
    import uvicorn

    print("="*60)
    print("Starting Customer AI Agent API")
    print("="*60)
    print()
    print("Documentation: http://localhost:8000/docs")
    print("Health check: http://localhost:8000/health")
    print()
    print("Press Ctrl+C to stop")
    print("="*60)

    uvicorn.run(app, host="0.0.0.0", port=8000)
