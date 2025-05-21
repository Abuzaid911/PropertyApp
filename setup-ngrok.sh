#!/bin/bash

# Kill any existing processes on ports 8081 and 4000
lsof -ti:8081 | xargs kill -9 2>/dev/null
lsof -ti:4000 | xargs kill -9 2>/dev/null

# Start Expo server in the background
echo "Starting Expo server..."
npm start -- --port 8081 &
EXPO_PID=$!

# Wait for Expo server to start
echo "Waiting for Expo server to start..."
sleep 5

# Start proxy server in the background
echo "Starting proxy server..."
node proxy-server.js &
PROXY_PID=$!

# Wait for proxy server to start
echo "Waiting for proxy server to start..."
sleep 2

# Start ngrok to expose the proxy server
echo "Starting ngrok..."
ngrok http 4000 &
NGROK_PID=$!

# Wait for ngrok to start
echo "Waiting for ngrok to start..."
sleep 5

# Update the .env file with the ngrok URL
echo "Updating .env file with ngrok URL..."
node update-ngrok-url.js

# Keep the script running
echo "Setup complete. Press Ctrl+C to stop all services."
wait

# Cleanup on exit
trap "kill $EXPO_PID $PROXY_PID $NGROK_PID 2>/dev/null" EXIT 