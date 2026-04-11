import { CohereClient } from 'cohere-ai';
import dns from 'dns';

// Import Cohere types
import type { ChatMessage } from 'cohere-ai/api/types';

// Keep IPv6 as default, but enable fallback to IPv4
// This is set dynamically after first connection attempt
let useIPv4Fallback = false;

// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

// Helper to handle IPv6/IPv4 fallback
function handleNetworkError(error: any) {
  // Check if it's an IPv6 connection timeout
  if (!useIPv4Fallback && 
      (error.message?.includes('Connect Timeout') || 
       error.message?.includes('ETIMEDOUT') ||
       error.code === 'UND_ERR_CONNECT_TIMEOUT')) {
    console.log('⚠️ IPv6 connection failed, switching to IPv4 fallback');
    dns.setDefaultResultOrder('ipv4first');
    useIPv4Fallback = true;
    return true; // Indicates retry is possible
  }
  return false;
}

export default cohere;

// Helper function for text generation
export async function generateText(prompt: string, options?: {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}) {
  try {
    const response = await cohere.generate({
      prompt,
      model: options?.model || 'command',
      maxTokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    });
    
    return response.generations?.[0]?.text || '';
  } catch (error) {
    console.error('Error generating text with Cohere:', error);
    throw error;
  }
}

// Helper function for chat completions with IPv6/IPv4 fallback
export async function chatCompletion(messages: Array<{
  role: 'user' | 'assistant' | 'system';
  content: string;
}>, options?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  // Convert messages to the format expected by Cohere
  const chatHistory: Array<{role: 'USER' | 'CHATBOT' | 'SYSTEM'; message: string}> = [];
  let lastUserMessage = '';
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      lastUserMessage = msg.content;
    } else {
      chatHistory.push({
        role: msg.role === 'assistant' ? 'CHATBOT' : 'SYSTEM',
        message: msg.content
      });
    }
  }
  
  async function attemptChat() {
    const response = await cohere.chat({
      message: lastUserMessage,
      chatHistory,
      model: options?.model || 'command-r-plus-08-2024',
      temperature: options?.temperature || 0.7,
      maxTokens: options?.maxTokens || 1000,
    });
    
    return response.text || '';
  }
  
  try {
    return await attemptChat();
  } catch (error: any) {
    // Try IPv4 fallback if IPv6 failed
    if (handleNetworkError(error)) {
      console.log('🔄 [CHAT] Retrying with IPv4...');
      try {
        return await attemptChat();
      } catch (retryError) {
        console.error('Error with Cohere chat (IPv4 retry):', retryError);
        throw retryError;
      }
    }
    console.error('Error with Cohere chat completion:', error);
    throw error;
  }
}

// Helper function for embeddings
export async function getEmbeddings(texts: string[], options?: {
  model?: string;
  inputType?: 'search_document' | 'search_query' | 'classification' | 'clustering';
}) {
  try {
    const response = await cohere.embed({
      texts,
      model: options?.model || 'embed-english-v3.0',
      inputType: options?.inputType || 'search_document',
    });
    
    return response.embeddings;
  } catch (error) {
    console.error('Error getting embeddings from Cohere:', error);
    throw error;
  }
}

// Helper function for reranking with IPv6/IPv4 fallback
export async function rerank(query: string, documents: string[], options?: {
  model?: string;
  topN?: number;
}) {
  // Validate inputs
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }
  
  if (!documents || documents.length === 0) {
    console.warn('⚠️ [RERANK] No documents to rerank');
    return [];
  }
  
  // Filter out empty documents
  const validDocuments = documents.filter(doc => doc && doc.trim().length > 0);
  if (validDocuments.length === 0) {
    console.warn('⚠️ [RERANK] All documents are empty');
    return [];
  }
  
  async function attemptRerank() {
    console.log('🔍 [RERANK] Starting rerank with:', {
      queryLength: query.length,
      documentCount: validDocuments.length,
      model: options?.model || 'rerank-english-v3.0',
      topN: options?.topN || 5,
      apiKeyPresent: !!process.env.COHERE_API_KEY,
      usingIPv4: useIPv4Fallback
    });
    
    const response = await cohere.rerank({
      query,
      documents: validDocuments.map(doc => ({ text: doc })),
      model: options?.model || 'rerank-english-v3.0',
      topN: Math.min(options?.topN || 5, validDocuments.length),
    });
    
    console.log('✅ [RERANK] Rerank successful, got', response.results?.length, 'results');
    return response.results;
  }
  
  try {
    return await attemptRerank();
  } catch (error: any) {
    // Try IPv4 fallback if IPv6 failed
    if (handleNetworkError(error)) {
      console.log('🔄 [RERANK] Retrying with IPv4...');
      try {
        return await attemptRerank();
      } catch (retryError: any) {
        console.error('❌ [RERANK] IPv4 retry also failed:', retryError.message);
        throw retryError;
      }
    }
    
    console.error('❌ [RERANK] Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      body: error.body,
      name: error.name
    });
    throw error;
  }
}
