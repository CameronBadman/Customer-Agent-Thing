package main

import (
	"Hippocampus/src/embedding"
	"Hippocampus/src/redis"
	"flag"
	"log"
	"time"
)

func main() {
	addr := flag.String("addr", ":6379", "Redis server address (default :6379)")
	embedURL := flag.String("embed-url", "http://localhost:8080", "Embedding service URL (optional)")
	useMock := flag.Bool("mock", true, "Use mock embedder (default true)")
	ttl := flag.Duration("ttl", 5*time.Minute, "Data TTL (default 5m)")

	flag.Parse()

	var embedder embedding.EmbeddingService

	if *useMock {
		log.Println("Using mock embedder (deterministic pseudo-random embeddings)")
		embedder = embedding.NewMockEmbedder()
	} else {
		log.Printf("Using local embedding service at %s", *embedURL)
		embedder = embedding.NewLocalEmbedder(*embedURL)
	}

	server := redis.NewRedisServer(*addr, embedder, *ttl)

	log.Printf("Starting Hippocampus Redis server on %s with TTL=%s", *addr, *ttl)
	if err := server.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
