package main

import (
	"Hippocampus/src/client"
	"Hippocampus/src/embedding"
	"flag"
	"fmt"
	"log"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Hippocampus CLI - AI Agent Memory Database (Local Version)")
		fmt.Println()
		fmt.Println("Usage:")
		fmt.Println("  hippocampus insert -binary tree.bin -key <id> -text <text>")
		fmt.Println("  hippocampus search -binary tree.bin -text <text> -epsilon 0.3 -threshold 0.5 -top-k 5")
		fmt.Println("  hippocampus insert-csv -binary tree.bin -csv <file.csv>")
		fmt.Println()
		fmt.Println("Commands:")
		fmt.Println("  insert        Store a single memory with a key")
		fmt.Println("  search        Search for similar memories")
		fmt.Println("  insert-csv    Bulk insert from CSV file")
		fmt.Println()
		fmt.Println("Global Flags:")
		fmt.Println("  -binary       Database file path (default: tree.bin)")
		fmt.Println("  -mock         Use mock embedder (default: true)")
		fmt.Println("  -embed-url    Embedding service URL (default: http://localhost:8080)")
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "insert":
		insertCmd := flag.NewFlagSet("insert", flag.ExitOnError)
		binary := insertCmd.String("binary", "tree.bin", "database file")
		useMock := insertCmd.Bool("mock", true, "use mock embedder")
		embedURL := insertCmd.String("embed-url", "http://localhost:8080", "embedding service URL")
		key := insertCmd.String("key", "", "key/identifier for the text")
		text := insertCmd.String("text", "", "text to embed and store")
		insertCmd.Parse(os.Args[2:])

		if *key == "" || *text == "" {
			log.Fatal("both -key and -text are required")
		}

		var embedder embedding.EmbeddingService
		if *useMock {
			embedder = embedding.NewMockEmbedder()
		} else {
			embedder = embedding.NewLocalEmbedder(*embedURL)
		}

		c, err := client.NewWithFileStorage(*binary, embedder)
		if err != nil {
			log.Fatalf("Failed to create client: %v", err)
		}

		if err := c.Insert(*key, *text); err != nil {
			log.Fatalf("Insert failed: %v", err)
		}

		if err := c.Flush(); err != nil {
			log.Fatalf("Flush failed: %v", err)
		}

	case "search":
		searchCmd := flag.NewFlagSet("search", flag.ExitOnError)
		binary := searchCmd.String("binary", "tree.bin", "database file")
		useMock := searchCmd.Bool("mock", true, "use mock embedder")
		embedURL := searchCmd.String("embed-url", "http://localhost:8080", "embedding service URL")
		text := searchCmd.String("text", "", "text to search for")
		epsilon := searchCmd.Float64("epsilon", 0.3, "search radius (per-dimension bounding box)")
		threshold := searchCmd.Float64("threshold", 0.5, "similarity threshold (0.0-1.0, higher = stricter)")
		topK := searchCmd.Int("top-k", 5, "maximum number of results to return")
		searchCmd.Parse(os.Args[2:])

		if *text == "" {
			log.Fatal("-text is required")
		}

		var embedder embedding.EmbeddingService
		if *useMock {
			embedder = embedding.NewMockEmbedder()
		} else {
			embedder = embedding.NewLocalEmbedder(*embedURL)
		}

		c, err := client.NewWithFileStorage(*binary, embedder)
		if err != nil {
			log.Fatalf("Failed to create client: %v", err)
		}

		_, err = c.Search(*text, float32(*epsilon), float32(*threshold), *topK)
		if err != nil {
			log.Fatalf("Search failed: %v", err)
		}

	case "insert-csv":
		csvCmd := flag.NewFlagSet("insert-csv", flag.ExitOnError)
		binary := csvCmd.String("binary", "tree.bin", "database file")
		useMock := csvCmd.Bool("mock", true, "use mock embedder")
		embedURL := csvCmd.String("embed-url", "http://localhost:8080", "embedding service URL")
		csvFile := csvCmd.String("csv", "", "csv file path")
		csvCmd.Parse(os.Args[2:])

		if *csvFile == "" {
			log.Fatalf("-csv is required")
		}

		var embedder embedding.EmbeddingService
		if *useMock {
			embedder = embedding.NewMockEmbedder()
		} else {
			embedder = embedding.NewLocalEmbedder(*embedURL)
		}

		c, err := client.NewWithFileStorage(*binary, embedder)
		if err != nil {
			log.Fatalf("Failed to create client: %v", err)
		}

		if err := c.InsertCSV(*csvFile); err != nil {
			log.Fatalf("CSV insert failed: %v", err)
		}

	default:
		log.Fatalf("unknown command: %s\nRun 'hippocampus' with no arguments for usage", command)
	}
}
