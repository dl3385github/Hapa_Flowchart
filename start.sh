#!/bin/bash

# Start the server
echo "Starting the Hyperswarm bridge server..."
node server/hyperswarm-bridge.js &

# Wait for a few seconds to ensure the server is up
sleep 5

# Start the client application
echo "Starting the client application..."
npm run dev