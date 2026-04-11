# Cohere Integration Setup

This project now includes Cohere AI integration with the following setup:

## Environment Variables

Add your Cohere API key to your `.env.local` file:

```env
COHERE_API_KEY=your_cohere_api_key_here
```

## Available API Endpoints

### 1. Chat Completion
- **Endpoint**: `POST /api/cohere/chat`
- **Body**:
  ```json
  {
    "message": "Your message here",
    "model": "command-r-plus-08-2024", // optional
    "temperature": 0.7, // optional
    "maxTokens": 1000 // optional
  }
  ```

### 2. Text Generation
- **Endpoint**: `POST /api/cohere/generate`
- **Body**:
  ```json
  {
    "prompt": "Your prompt here",
    "model": "command-xlarge-nightly", // optional
    "temperature": 0.7, // optional
    "maxTokens": 100 // optional
  }
  ```

### 3. Embeddings
- **Endpoint**: `POST /api/cohere/embeddings`
- **Body**:
  ```json
  {
    "texts": ["text1", "text2", "text3"],
    "model": "embed-english-v3.0", // optional
    "inputType": "search_document" // optional: search_document, search_query, classification, clustering
  }
  ```

## Usage in Components

```typescript
// Example: Using the chat API in a React component
const handleChat = async (message: string) => {
  const response = await fetch('/api/cohere/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  
  const data = await response.json();
  return data.response;
};
```

## Direct Usage with Cohere Client

```typescript
import { chatCompletion, generateText, getEmbeddings } from '@/lib/cohere';

// Chat completion
const response = await chatCompletion("Hello, how are you?");

// Text generation
const text = await generateText("Write a story about");

// Get embeddings
const embeddings = await getEmbeddings(["text1", "text2"]);
```

## Getting Your API Key

1. Sign up at [Cohere Dashboard](https://dashboard.cohere.ai/)
2. Navigate to API Keys section
3. Generate a new API key
4. Add it to your `.env.local` file

## Models Available

- **Chat**: `command-r-plus-08-2024`, `command-r-08-2024`, `command`
- **Generate**: `command-xlarge-nightly`, `command-xlarge`, `command-medium`, `command-light`
- **Embed**: `embed-english-v3.0`, `embed-multilingual-v3.0`
- **Rerank**: `rerank-english-v3.0`, `rerank-multilingual-v3.0`
