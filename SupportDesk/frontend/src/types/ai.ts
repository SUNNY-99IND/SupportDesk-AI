import type { AIClassification } from './ticket';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  classification?: AIClassification;
  timestamp: string;
}

export interface AIChatResponse {
  message: string;
  classification?: AIClassification;
}
