package redis

import (
	"Hippocampus/src/client"
	"Hippocampus/src/embedding"
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"strconv"
	"strings"
	"sync"
	"time"
)

// RedisServer implements a subset of Redis protocol for Hippocampus
type RedisServer struct {
	addr      string
	listener  net.Listener
	clients   map[string]*client.Client
	clientsMu sync.RWMutex
	embedder  embedding.EmbeddingService
	ttl       time.Duration
}

func NewRedisServer(addr string, embedder embedding.EmbeddingService, ttl time.Duration) *RedisServer {
	return &RedisServer{
		addr:     addr,
		clients:  make(map[string]*client.Client),
		embedder: embedder,
		ttl:      ttl,
	}
}

func (s *RedisServer) Start() error {
	listener, err := net.Listen("tcp", s.addr)
	if err != nil {
		return fmt.Errorf("failed to start Redis server: %w", err)
	}

	s.listener = listener
	log.Printf("Redis-compatible server listening on %s", s.addr)

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("Error accepting connection: %v", err)
			continue
		}

		go s.handleConnection(conn)
	}
}

func (s *RedisServer) handleConnection(conn net.Conn) {
	defer conn.Close()

	reader := bufio.NewReader(conn)
	writer := bufio.NewWriter(conn)

	for {
		// Read Redis protocol commands
		cmd, err := s.readCommand(reader)
		if err != nil {
			return
		}

		response := s.processCommand(cmd)
		if err := s.writeResponse(writer, response); err != nil {
			return
		}

		writer.Flush()
	}
}

func (s *RedisServer) readCommand(reader *bufio.Reader) ([]string, error) {
	// Simple RESP (Redis Serialization Protocol) parser
	line, err := reader.ReadString('\n')
	if err != nil {
		return nil, err
	}

	line = strings.TrimSpace(line)

	// Handle array format (*n\r\n)
	if strings.HasPrefix(line, "*") {
		count, err := strconv.Atoi(line[1:])
		if err != nil {
			return nil, err
		}

		args := make([]string, count)
		for i := 0; i < count; i++ {
			// Read bulk string length
			line, err = reader.ReadString('\n')
			if err != nil {
				return nil, err
			}

			line = strings.TrimSpace(line)
			if !strings.HasPrefix(line, "$") {
				return nil, fmt.Errorf("expected bulk string")
			}

			length, err := strconv.Atoi(line[1:])
			if err != nil {
				return nil, err
			}

			// Read bulk string content
			buf := make([]byte, length)
			if _, err := reader.Read(buf); err != nil {
				return nil, err
			}

			args[i] = string(buf)

			// Read trailing \r\n
			reader.ReadString('\n')
		}

		return args, nil
	}

	// Handle inline commands (space-separated)
	return strings.Fields(line), nil
}

func (s *RedisServer) writeResponse(writer *bufio.Writer, response interface{}) error {
	switch v := response.(type) {
	case string:
		// Simple string: +OK\r\n
		_, err := writer.WriteString(fmt.Sprintf("+%s\r\n", v))
		return err
	case error:
		// Error: -ERR message\r\n
		_, err := writer.WriteString(fmt.Sprintf("-ERR %s\r\n", v.Error()))
		return err
	case []string:
		// Array of strings
		writer.WriteString(fmt.Sprintf("*%d\r\n", len(v)))
		for _, s := range v {
			writer.WriteString(fmt.Sprintf("$%d\r\n%s\r\n", len(s), s))
		}
		return nil
	case int:
		// Integer: :number\r\n
		_, err := writer.WriteString(fmt.Sprintf(":%d\r\n", v))
		return err
	case nil:
		// Null: $-1\r\n
		_, err := writer.WriteString("$-1\r\n")
		return err
	default:
		return fmt.Errorf("unknown response type")
	}
}

func (s *RedisServer) processCommand(cmd []string) interface{} {
	if len(cmd) == 0 {
		return fmt.Errorf("empty command")
	}

	command := strings.ToUpper(cmd[0])

	switch command {
	case "PING":
		return "PONG"

	case "HSET":
		// HSET agent_id key text
		if len(cmd) < 4 {
			return fmt.Errorf("HSET requires 3 arguments: agent_id key text")
		}
		agentID := cmd[1]
		key := cmd[2]
		text := cmd[3]

		c, err := s.getOrCreateClient(agentID)
		if err != nil {
			return err
		}

		if err := c.Insert(key, text); err != nil {
			return err
		}

		return "OK"

	case "HSEARCH":
		// HSEARCH agent_id query epsilon threshold topk
		if len(cmd) < 6 {
			return fmt.Errorf("HSEARCH requires 5 arguments: agent_id query epsilon threshold topk")
		}

		agentID := cmd[1]
		query := cmd[2]
		epsilon, err := strconv.ParseFloat(cmd[3], 32)
		if err != nil {
			return fmt.Errorf("invalid epsilon: %v", err)
		}
		threshold, err := strconv.ParseFloat(cmd[4], 32)
		if err != nil {
			return fmt.Errorf("invalid threshold: %v", err)
		}
		topK, err := strconv.Atoi(cmd[5])
		if err != nil {
			return fmt.Errorf("invalid topK: %v", err)
		}

		c, err := s.getOrCreateClient(agentID)
		if err != nil {
			return err
		}

		results, err := c.Search(query, float32(epsilon), float32(threshold), topK)
		if err != nil {
			return err
		}

		return results

	case "HINSERT":
		// HINSERT agent_id {"key": "k", "text": "t"}
		if len(cmd) < 3 {
			return fmt.Errorf("HINSERT requires 2 arguments: agent_id json_data")
		}

		agentID := cmd[1]
		jsonData := cmd[2]

		var data struct {
			Key  string `json:"key"`
			Text string `json:"text"`
		}

		if err := json.Unmarshal([]byte(jsonData), &data); err != nil {
			return fmt.Errorf("invalid JSON: %v", err)
		}

		c, err := s.getOrCreateClient(agentID)
		if err != nil {
			return err
		}

		if err := c.Insert(data.Key, data.Text); err != nil {
			return err
		}

		return "OK"

	case "HGET":
		// HGET agent_id query_json
		// query_json: {"query": "text", "epsilon": 0.3, "threshold": 0.5, "top_k": 5}
		if len(cmd) < 3 {
			return fmt.Errorf("HGET requires 2 arguments: agent_id query_json")
		}

		agentID := cmd[1]
		queryJSON := cmd[2]

		var query struct {
			Query     string  `json:"query"`
			Epsilon   float32 `json:"epsilon"`
			Threshold float32 `json:"threshold"`
			TopK      int     `json:"top_k"`
		}

		if err := json.Unmarshal([]byte(queryJSON), &query); err != nil {
			return fmt.Errorf("invalid JSON: %v", err)
		}

		c, err := s.getOrCreateClient(agentID)
		if err != nil {
			return err
		}

		results, err := c.Search(query.Query, query.Epsilon, query.Threshold, query.TopK)
		if err != nil {
			return err
		}

		// Return as JSON array
		jsonResults, _ := json.Marshal(results)
		return string(jsonResults)

	case "DEL":
		// DEL agent_id - deletes/expires an agent's data
		if len(cmd) < 2 {
			return fmt.Errorf("DEL requires 1 argument: agent_id")
		}

		agentID := cmd[1]
		s.clientsMu.Lock()
		delete(s.clients, agentID)
		s.clientsMu.Unlock()

		return "OK"

	case "EXISTS":
		// EXISTS agent_id - check if agent has data
		if len(cmd) < 2 {
			return fmt.Errorf("EXISTS requires 1 argument: agent_id")
		}

		agentID := cmd[1]
		s.clientsMu.RLock()
		_, exists := s.clients[agentID]
		s.clientsMu.RUnlock()

		if exists {
			return 1
		}
		return 0

	case "INFO":
		return "Hippocampus Redis Server v1.0"

	default:
		return fmt.Errorf("unknown command: %s", command)
	}
}

func (s *RedisServer) getOrCreateClient(agentID string) (*client.Client, error) {
	s.clientsMu.RLock()
	c, exists := s.clients[agentID]
	s.clientsMu.RUnlock()

	if exists {
		return c, nil
	}

	// Create new client with in-memory storage
	s.clientsMu.Lock()
	defer s.clientsMu.Unlock()

	// Double-check after acquiring write lock
	if c, exists := s.clients[agentID]; exists {
		return c, nil
	}

	newClient, err := client.New(s.embedder)
	if err != nil {
		return nil, err
	}

	newClient.SetVerbose(false) // Disable verbose logging for Redis mode
	s.clients[agentID] = newClient

	return newClient, nil
}

func (s *RedisServer) Stop() error {
	if s.listener != nil {
		return s.listener.Close()
	}
	return nil
}
