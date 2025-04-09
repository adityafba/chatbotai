# Interactive Chatbot Application

A frontend-based interactive chatbot application that allows users to select categories and receive automated AI responses based on knowledge stored in text files.

## Features

- Category selection for different conversation topics
- Interactive chat interface
- Text-based knowledge retrieval
- DeepSeek AI integration for intelligent responses
- Chat history and statistics
- Fully frontend-based (no backend required)

## Project Structure

```
/public
  /knowledge
    /Marketing
      - digital_marketing.txt
      - branding.txt
    /Keuangan
      - investasi.txt
    /Manajemen
      - leadership.txt
/src
  /components
    - CategorySelection.jsx
    - ChatBubble.jsx
    - Chatbot.jsx
  - App.jsx
  - App.css
  - main.jsx
```

## How It Works

1. Users select a category of interest (Marketing, Keuangan, or Manajemen)
2. The application loads knowledge base files related to the selected category
3. Users can ask questions through the chat interface
4. The application searches for relevant information in the knowledge base files
5. Responses are displayed in the chat interface
6. Chat statistics track the usage of different categories

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd interactive-chatbot

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Adding New Knowledge

To add new knowledge to the chatbot:

1. Create a new text file in the appropriate category folder under `/public/knowledge/`
2. Structure the content in a clear, readable format
3. The application will automatically detect and use the new knowledge file

## Technologies Used

- React.js
- Vite
- Styled Components
- DeepSeek AI API integration
- Text-based search algorithms

## DeepSeek AI Integration

This application can be integrated with DeepSeek AI to provide more intelligent and contextual responses. See [DEEPSEEK_INTEGRATION.md](DEEPSEEK_INTEGRATION.md) for detailed instructions on how to set up and use the DeepSeek AI integration.
