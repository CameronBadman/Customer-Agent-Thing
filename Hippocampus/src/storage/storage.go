package storage

import (
	"Hippocampus/src/types"
	"encoding/binary"
	"io"
	"os"
	"sync"
	"time"
)

// Storage interface for different storage backends
type Storage interface {
	Save(t *types.Tree) error
	Load() (*types.Tree, error)
}

// FileStorage - file-based storage
type FileStorage struct {
	path string
}

func NewFileStorage(path string) *FileStorage {
	return &FileStorage{path: path}
}

// Deprecated: Use NewFileStorage instead
func New(path string) *FileStorage {
	return &FileStorage{path: path}
}

// MemoryStorage - in-memory storage with TTL
type MemoryStorage struct {
	mu         sync.RWMutex
	tree       *types.Tree
	expireTime time.Time
	ttl        time.Duration
}

func NewMemoryStorage() *MemoryStorage {
	return &MemoryStorage{
		tree: &types.Tree{
			Nodes: []types.Node{},
			Index: [512][]int32{},
		},
		ttl:        5 * time.Minute, // Default 5 minute TTL
		expireTime: time.Now().Add(5 * time.Minute),
	}
}

func NewMemoryStorageWithTTL(ttl time.Duration) *MemoryStorage {
	return &MemoryStorage{
		tree: &types.Tree{
			Nodes: []types.Node{},
			Index: [512][]int32{},
		},
		ttl:        ttl,
		expireTime: time.Now().Add(ttl),
	}
}

func (ms *MemoryStorage) Save(t *types.Tree) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.tree = t
	ms.expireTime = time.Now().Add(ms.ttl)
	return nil
}

func (ms *MemoryStorage) Load() (*types.Tree, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	// Check if data has expired
	if time.Now().After(ms.expireTime) {
		// Return empty tree if expired
		return &types.Tree{
			Nodes: []types.Node{},
			Index: [512][]int32{},
		}, nil
	}

	return ms.tree, nil
}

func (ms *MemoryStorage) SetTTL(ttl time.Duration) {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.ttl = ttl
	ms.expireTime = time.Now().Add(ttl)
}

func (ms *MemoryStorage) Expire() {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.tree = &types.Tree{
		Nodes: []types.Node{},
		Index: [512][]int32{},
	}
	ms.expireTime = time.Now()
}

func (fs *FileStorage) Save(t *types.Tree) error {
	f, err := os.Create(fs.path)
	if err != nil {
		return err
	}
	defer f.Close()

	if err := binary.Write(f, binary.LittleEndian, int64(len(t.Nodes))); err != nil {
		return err
	}

	for i := range t.Nodes {
		if err := writeNode(f, &t.Nodes[i]); err != nil {
			return err
		}
	}

	return nil
}

func (fs *FileStorage) Load() (*types.Tree, error) {
	f, err := os.Open(fs.path)
	if err != nil {
		if os.IsNotExist(err) {
			return &types.Tree{
				Nodes: []types.Node{},
				Index: [512][]int32{},
			}, nil
		}
		return nil, err
	}
	defer f.Close()

	info, err := f.Stat()
	if err != nil {
		return nil, err
	}

	if info.Size() == 0 {
		return &types.Tree{
			Nodes: []types.Node{},
			Index: [512][]int32{},
		}, nil
	}

	var nodeCount int64
	if err := binary.Read(f, binary.LittleEndian, &nodeCount); err != nil {
		return nil, err
	}

	t := &types.Tree{
		Nodes: make([]types.Node, nodeCount),
		Index: [512][]int32{},
	}

	for i := range t.Nodes {
		if err := readNode(f, &t.Nodes[i]); err != nil {
			return nil, err
		}
	}

	t.RebuildIndex()

	return t, nil
}

func writeNode(w io.Writer, n *types.Node) error {
	if err := binary.Write(w, binary.LittleEndian, n.Key); err != nil {
		return err
	}

	valueBytes := []byte(n.Value)
	if err := binary.Write(w, binary.LittleEndian, int64(len(valueBytes))); err != nil {
		return err
	}

	_, err := w.Write(valueBytes)
	return err
}

func readNode(r io.Reader, n *types.Node) error {
	if err := binary.Read(r, binary.LittleEndian, &n.Key); err != nil {
		return err
	}

	var valueLen int64
	if err := binary.Read(r, binary.LittleEndian, &valueLen); err != nil {
		return err
	}

	valueBytes := make([]byte, valueLen)
	if _, err := io.ReadFull(r, valueBytes); err != nil {
		return err
	}

	n.Value = string(valueBytes)
	return nil
}
