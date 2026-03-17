#!/bin/bash
# Start a jsonmd proxy in front of any API
# Usage: TARGET=https://api.example.com ./run.sh

TARGET=${TARGET:-http://localhost:3000} \
  npx jsonmd-proxy --port 3001

echo "Proxy running at http://localhost:3001"
echo "Try: curl http://localhost:3001/api/endpoint.jsonmd"
