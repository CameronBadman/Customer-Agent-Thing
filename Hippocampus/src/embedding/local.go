package embedding

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type LocalEmbeddingRequest struct {
	Text string `json:"text"`
}

type LocalEmbeddingResponse struct {
	Embedding []float32 `json:"embedding"`
}

// EmbeddingService interface for flexibility
type EmbeddingService interface {
	GetEmbedding(ctx context.Context, text string) ([]float32, error)
}

// LocalEmbedder uses a local HTTP embedding service
type LocalEmbedder struct {
	ServiceURL string
	HTTPClient *http.Client
}

func NewLocalEmbedder(serviceURL string) *LocalEmbedder {
	return &LocalEmbedder{
		ServiceURL: serviceURL,
		HTTPClient: &http.Client{},
	}
}

func (le *LocalEmbedder) GetEmbedding(ctx context.Context, text string) ([]float32, error) {
	payload := LocalEmbeddingRequest{
		Text: text,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal error: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", le.ServiceURL+"/embed", bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("request creation error: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := le.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("embedding service error: status %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	var response LocalEmbeddingResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("unmarshal error: %w", err)
	}

	if len(response.Embedding) != 512 {
		return nil, fmt.Errorf("expected 512 dimensions, got %d", len(response.Embedding))
	}

	return response.Embedding, nil
}

// Simple mock embedder for testing (generates random-ish embeddings)
type MockEmbedder struct{}

func NewMockEmbedder() *MockEmbedder {
	return &MockEmbedder{}
}

func (me *MockEmbedder) GetEmbedding(ctx context.Context, text string) ([]float32, error) {
	// Generate deterministic pseudo-random embedding based on text hash
	embedding := make([]float32, 512)
	hash := 0
	for _, c := range text {
		hash = (hash*31 + int(c)) % 1000000
	}

	for i := 0; i < 512; i++ {
		hash = (hash*1103515245 + 12345) % 1000000
		embedding[i] = float32(hash) / 1000000.0
	}

	// Normalize
	var sum float32
	for _, v := range embedding {
		sum += v * v
	}
	norm := float32(1.0) / float32(sum)
	for i := range embedding {
		embedding[i] *= norm
	}

	return embedding, nil
}

// GetEmbedding is the main function that external packages call
// It now uses the local embedder instead of AWS Bedrock
func GetEmbedding(ctx context.Context, embedder EmbeddingService, text string) ([]float32, error) {
	return embedder.GetEmbedding(ctx, text)
}
