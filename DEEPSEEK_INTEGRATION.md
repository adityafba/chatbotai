# DeepSeek AI Integration Guide

This document explains how to integrate and use the DeepSeek AI API with the Interactive Chatbot application.

## Overview

The chatbot application can use DeepSeek AI to provide more intelligent and contextual responses based on the knowledge base. When properly configured, the application will:

1. Send the user's query along with relevant knowledge base content to the DeepSeek API
2. Process the AI response and display it to the user
3. Fall back to simple text search if the DeepSeek API is not configured

## Setting Up Your DeepSeek API Key

### Option 1: Using the UI

1. Launch the application
2. Scroll to the bottom of the page to find the "DeepSeek AI Connection" section
3. Enter your DeepSeek API key in the input field
4. Click "Save"

The application will store your API key in the browser's localStorage and use it for all future requests.

### Option 2: Environment Variables

For development or deployment:

1. Create or edit the `.env` file in the project root
2. Add your DeepSeek API key:
   ```
   VITE_DEEPSEEK_API_KEY=your_api_key_here
   ```
3. Restart the application

## How It Works

When a user asks a question:

1. The application loads the relevant knowledge base files for the selected category
2. If a DeepSeek API key is configured:
   - The application creates a prompt that includes the knowledge base content and the user's question
   - This prompt is sent to the DeepSeek API
   - The AI response is displayed to the user
3. If no DeepSeek API key is configured:
   - The application falls back to simple text search within the knowledge base files
   - The most relevant content is displayed to the user

## Customizing the DeepSeek Integration

You can customize the DeepSeek integration by editing the following files:

- `src/config.js`: Configure the DeepSeek API URL and model
- `src/services/deepseekService.js`: Modify how the application interacts with the DeepSeek API
- `src/components/ApiKeyInput.jsx`: Customize the UI for entering the API key

## Obtaining a DeepSeek API Key

To obtain a DeepSeek API key:

1. Visit the [DeepSeek AI website](https://deepseek.ai)
2. Create an account or log in
3. Navigate to the API section
4. Generate a new API key
5. Copy the key and use it in the application as described above

## Troubleshooting

If you encounter issues with the DeepSeek API integration:

1. Check that your API key is correct
2. Ensure you have sufficient credits or quota on your DeepSeek account
3. Check the browser console for any error messages
4. Try the fallback text search by removing your API key temporarily
