export type Role = 'user' | 'assistant' | 'system';

export type AICategory = 'CHAT' | 'IMAGE';

export interface Message {
  id: string;
  conversation_id: string;
  role: Role;
  content: string;
  image_url?: string; // For bot generated images
  attachments?: string[]; // For user uploaded images (Base64)
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string; // Helper for sorting
}

export interface AIProvider {
  id: string;
  name: string;
  api_key?: string; // Only present in admin edit mode or server-side
  endpoint?: string;
  category: AICategory;
  model_name: string;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
}

// AI Adapter Interface
export interface AIAdapter {
  chatStream(
    messages: Message[],
    modelName: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (err: any) => void,
    attachment?: string // Base64 string for image
  ): Promise<void>;

  generateImage(
    prompt: string,
    modelName: string
  ): Promise<string>;
}