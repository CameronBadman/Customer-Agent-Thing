package client

import (
	"Hippocampus/src/embedding"
	"Hippocampus/src/storage"
	hippotypes "Hippocampus/src/types"
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"time"
)

type Client struct {
	Storage   storage.Storage
	Embedder  embedding.EmbeddingService

	// In-memory cache
	cachedTree *hippotypes.Tree
	dirty      bool
	verbose    bool
}

// New creates a new client with in-memory storage
func New(embedder embedding.EmbeddingService) (c *Client, err error) {
	return &Client{
		Storage:    storage.NewMemoryStorage(),
		Embedder:   embedder,
		cachedTree: nil,
		dirty:      false,
		verbose:    true,
	}, nil
}

// NewWithFileStorage creates a client with file-based storage (for backward compatibility)
func NewWithFileStorage(binaryPath string, embedder embedding.EmbeddingService) (c *Client, err error) {
	return &Client{
		Storage:    storage.NewFileStorage(binaryPath),
		Embedder:   embedder,
		cachedTree: nil,
		dirty:      false,
		verbose:    true,
	}, nil
}

// getTree returns the in-memory tree, loading from storage if needed
func (client *Client) getTree() (*hippotypes.Tree, error) {
	if client.cachedTree == nil {
		tree, err := client.Storage.Load()
		if err != nil {
			return nil, err
		}
		client.cachedTree = tree
	}
	return client.cachedTree, nil
}

// Flush writes the cached tree to storage if dirty
func (client *Client) Flush() error {
	if client.dirty && client.cachedTree != nil {
		if err := client.Storage.Save(client.cachedTree); err != nil {
			return err
		}
		client.dirty = false
	}
	return nil
}

func (client *Client) Insert(key, text string) error {
	ctx := context.Background()

	// Time embedding generation
	embedStart := time.Now()
	embeddingSlice, err := embedding.GetEmbedding(ctx, client.Embedder, text)
	embedDuration := time.Since(embedStart)
	if err != nil {
		return fmt.Errorf("embedding error: %w", err)
	}

	var embeddingArray [512]float32
	copy(embeddingArray[:], embeddingSlice)

	// Time tree loading
	loadStart := time.Now()
	tree, err := client.getTree()
	loadDuration := time.Since(loadStart)
	if err != nil {
		return fmt.Errorf("tree loading error: %w", err)
	}

	// Time pure insert operation
	insertStart := time.Now()
	tree.Insert(embeddingArray, text)
	insertDuration := time.Since(insertStart)
	client.dirty = true

	// Time storage flush (if needed)
	var flushDuration time.Duration
	if len(tree.Nodes) % 100 == 0 {
		flushStart := time.Now()
		if err := client.Flush(); err != nil {
			return fmt.Errorf("flush error: %w", err)
		}
		flushDuration = time.Since(flushStart)
	}

	if client.verbose {
		fmt.Printf("Successfully inserted %s (total nodes: %d)\n", key, len(tree.Nodes))
		fmt.Printf("TIMING:EMBED:%.3f:LOAD:%.3f:INSERT:%.3f:FLUSH:%.3f\n",
			embedDuration.Seconds()*1000,
			loadDuration.Seconds()*1000,
			insertDuration.Seconds()*1000,
			flushDuration.Seconds()*1000)
	}
	return nil
}

func (client *Client) Search(text string, epsilon float32, threshold float32, topK int) ([]string, error) {
	ctx := context.Background()

	// Time embedding generation
	embedStart := time.Now()
	embeddingSlice, err := embedding.GetEmbedding(ctx, client.Embedder, text)
	embedDuration := time.Since(embedStart)
	if err != nil {
		return nil, fmt.Errorf("embedding error: %w", err)
	}

	var embeddingArray [512]float32
	copy(embeddingArray[:], embeddingSlice)

	// Time tree loading
	loadStart := time.Now()
	tree, err := client.getTree()
	loadDuration := time.Since(loadStart)
	if err != nil {
		return nil, fmt.Errorf("tree loading error: %w", err)
	}

	// Time pure search operation
	searchStart := time.Now()
	results := tree.Search(embeddingArray, epsilon, threshold, topK)
	searchDuration := time.Since(searchStart)

	values := make([]string, len(results))
	for i, node := range results {
		values[i] = node.Value
	}

	if client.verbose {
		fmt.Printf("\nFound %d results (top %d, threshold %.2f):\n", len(results), topK, threshold)
		for _, value := range values {
			fmt.Printf("  %s\n", value)
		}
		fmt.Printf("TIMING:EMBED:%.3f:LOAD:%.6f:SEARCH:%.6f\n",
			embedDuration.Seconds()*1000,
			loadDuration.Seconds()*1000,
			searchDuration.Seconds()*1000)
	}

	return values, nil
}

func (client *Client) InsertCSV(csvFilename string) error {
	file, err := os.Open(csvFilename)
	if err != nil {
		return fmt.Errorf("Error opening file: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)

	for {
		record, err := reader.Read()
		if err != nil {
			if err == io.EOF{
				break
			}
			return fmt.Errorf("Error in reading line: %v", err)
		}

		if err := client.Insert(record[0], record[1]); err != nil {
			return err
		}
	}

	// Flush after bulk insert
	return client.Flush()
}

// SetVerbose controls logging output
func (client *Client) SetVerbose(verbose bool) {
	client.verbose = verbose
}
