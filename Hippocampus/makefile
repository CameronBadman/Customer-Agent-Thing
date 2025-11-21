.PHONY: build-cli build-server clean test all

build-cli:
	@echo "Building CLI..."
	@mkdir -p bin
	CGO_ENABLED=0 go build -o bin/hippocampus src/cmd/cli/main.go
	@echo "✓ CLI built: bin/hippocampus"

build-server:
	@echo "Building Redis server..."
	@mkdir -p bin
	CGO_ENABLED=0 go build -o bin/hippocampus-server src/cmd/redis-server/main.go
	@echo "✓ Redis server built: bin/hippocampus-server"

clean:
	rm -rf bin/ *.bin

test:
	go test ./src/...

all: build-cli build-server

.DEFAULT_GOAL := build-server
