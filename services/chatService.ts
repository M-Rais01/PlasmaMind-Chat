import { supabase, isDemoMode } from '../lib/supabase';
import { Message, Conversation, AIProvider } from '../types';

const generateId = () => crypto.randomUUID();

// Helper to validate UUID format
const isValidUUID = (uuid: string) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

export const chatService = {
  
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data as Conversation[];
  },

  async createConversation(userId: string, title: string = 'New Chat'): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title })
      .select()
      .single();

    if (error) throw error;
    return data as Conversation;
  },

  async updateConversationTitle(id: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteConversation(id: string): Promise<void> {
    // Cascade delete of messages handled by DB FK usually, but explicit delete:
    const { error: msgError } = await supabase.from('messages').delete().eq('conversation_id', id);
    if (msgError) throw msgError;

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[];
  },

  async addMessage(msg: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: msg.conversation_id,
        role: msg.role,
        content: msg.content,
        image_url: msg.image_url,
        attachments: msg.attachments
      })
      .select()
      .single();
    
    if (error) throw error;

    // Update conversation timestamp
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', msg.conversation_id);

    return data as Message;
  },

  async deleteMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- AI Provider Management ---

  async getProviders(userId: string): Promise<AIProvider[]> {
    try {
        const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
        
        if (error) {
            console.warn("Could not fetch custom providers:", error.message);
            return [];
        }

        if (data && data.length > 0) {
            return data as AIProvider[];
        }

        return [];
    } catch (e) {
        console.warn("Unexpected error fetching providers:", e);
        return [];
    }
  },

  async saveProvider(provider: Omit<AIProvider, 'id'>, userId: string, id?: string): Promise<void> {
     // Prepare payload ensuring empty strings become null for optional fields
     const payload = {
        name: provider.name,
        model_name: provider.model_name,
        category: provider.category,
        is_active: provider.is_active,
        api_key: provider.api_key || null,
        endpoint: provider.endpoint || null,
        user_id: userId // Ensure user_id is always present for inserts/security
     };

     // Only attempt UPDATE if ID is present, not a temp ID, AND is a valid UUID.
     if (id && !id.startsWith('temp-') && isValidUUID(id)) {
         // Update
         const { user_id, ...updatePayload } = payload;
         
         const { error } = await supabase
           .from('ai_providers')
           .update(updatePayload)
           .eq('id', id);
         if (error) throw error;
     } else {
         // Insert
         const { error } = await supabase
           .from('ai_providers')
           .insert(payload);
         if (error) throw error;
     }
  },

  async deleteProvider(id: string): Promise<void> {
    // Cannot delete a provider that isn't in the DB (invalid UUID)
    if (!isValidUUID(id)) return;

    const { error } = await supabase.from('ai_providers').delete().eq('id', id);
    if (error) throw error;
  }
};