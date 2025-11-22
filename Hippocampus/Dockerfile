FROM debian:bullseye-slim

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

# Copy Hippocampus source
COPY . .

# Build Hippocampus if needed
RUN make clean && make

# Create data directory
RUN mkdir -p /data

# Expose Redis protocol port
EXPOSE 6379

# Run Hippocampus server
CMD ["./bin/hippocampus-server", "--port", "6379", "--data-dir", "/data"]
