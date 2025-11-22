# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /build

# Copy source code
COPY . .

# Build the server binary
RUN CGO_ENABLED=0 GOOS=linux go build -o hippocampus-server src/cmd/redis-server/main.go

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Install redis-tools for health check
RUN apk add --no-cache redis

# Copy built binary from builder
COPY --from=builder /build/hippocampus-server /app/hippocampus-server
RUN chmod +x /app/hippocampus-server

# Create data directory
RUN mkdir -p /data

# Expose Redis protocol port
EXPOSE 6379

# Run Hippocampus server
CMD ["/app/hippocampus-server", "-addr", ":6379"]
