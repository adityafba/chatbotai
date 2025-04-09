#!/bin/bash

# DeepSeek API test script
API_KEY="sk-bc6819a2bdcb4676987fb2bb2e054709"
API_URL="https://api.deepseek.com/chat/completions"

echo "Testing DeepSeek API connection..."

# Test request
curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant that provides detailed and informative responses."
      },
      {
        "role": "user",
        "content": "Berikan saya informasi tentang strategi marketing digital yang efektif."
      }
    ],
    "max_tokens": 500
  }' | jq .
