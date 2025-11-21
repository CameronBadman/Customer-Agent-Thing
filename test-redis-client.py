#!/usr/bin/env python3
"""
Simple Python test client for Hippocampus Redis server
"""

import socket
import json


def send_command(sock, *args):
    """Send a Redis RESP command"""
    # Build RESP array format
    command = f"*{len(args)}\r\n"
    for arg in args:
        arg_str = str(arg)
        command += f"${len(arg_str)}\r\n{arg_str}\r\n"

    sock.sendall(command.encode())

    # Read response
    return read_response(sock)


def read_response(sock):
    """Read a Redis RESP response"""
    data = sock.recv(4096).decode()

    if data.startswith('+'):
        # Simple string
        return data[1:].strip()
    elif data.startswith('-'):
        # Error
        return f"ERROR: {data[1:].strip()}"
    elif data.startswith(':'):
        # Integer
        return int(data[1:].strip())
    elif data.startswith('$-1'):
        # Null
        return None
    elif data.startswith('*'):
        # Array - simplified parsing
        lines = data.split('\r\n')
        return lines
    else:
        return data.strip()


def main():
    # Connect to Hippocampus Redis server
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        print("Connecting to Hippocampus Redis server on localhost:6379...")
        sock.connect(('localhost', 6379))
        print("Connected!")

        # Test 1: PING
        print("\n--- Test 1: PING ---")
        response = send_command(sock, "PING")
        print(f"Response: {response}")

        # Test 2: Insert a memory using HSET
        print("\n--- Test 2: Insert Memory ---")
        response = send_command(sock, "HSET", "customer_123", "preference_theme", "User prefers dark mode")
        print(f"Response: {response}")

        # Test 3: Insert another memory
        print("\n--- Test 3: Insert Another Memory ---")
        response = send_command(sock, "HSET", "customer_123", "preference_notifications", "User wants email notifications")
        print(f"Response: {response}")

        # Test 4: Search for memories
        print("\n--- Test 4: Search Memories ---")
        response = send_command(sock, "HSEARCH", "customer_123", "notification preferences", "0.3", "0.5", "5")
        print(f"Response: {response}")

        # Test 5: Check if agent exists
        print("\n--- Test 5: Check if customer exists ---")
        response = send_command(sock, "EXISTS", "customer_123")
        print(f"Response: {response}")

        # Test 6: Insert using JSON
        print("\n--- Test 6: Insert using JSON ---")
        data = json.dumps({"key": "purchase_history", "text": "Purchased premium subscription on 2024-01-15"})
        response = send_command(sock, "HINSERT", "customer_123", data)
        print(f"Response: {response}")

        # Test 7: Search using JSON
        print("\n--- Test 7: Search using JSON ---")
        query = json.dumps({
            "query": "subscription purchases",
            "epsilon": 0.3,
            "threshold": 0.5,
            "top_k": 5
        })
        response = send_command(sock, "HGET", "customer_123", query)
        print(f"Response: {response}")

        print("\n✓ All tests completed!")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        sock.close()


if __name__ == "__main__":
    main()
