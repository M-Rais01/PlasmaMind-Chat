import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { MessageItem } from './components/Chat/MessageItem';
import { InputArea } from './components/Chat/InputArea';
import { AdminPanel } from './components/Admin/AdminPanel';
import { AuthPage } from './components/Auth/AuthPage';
import { SettingsModal } from './components/Settings/SettingsModal';
import { chatService } from './services/chatService';
import { getGeminiAdapter, GeminiAdapter } from './services/aiAdapter';
import { Conversation, Message, UserProfile, AIProvider } from './types';
import { Menu, Plus, BrainCircuit, Settings } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'pipiliko85@gmail.com';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Model Management
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
        document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Initialize Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check URL for admin access and validate permissions
  useEffect(() => {
    if (session?.user) {
        const path = window.location.pathname;
        const isAdminUrl = path.includes('/admin') || path.includes('admin.tsx');
        const isAuthorized = session.user.email === ADMIN_EMAIL;

        if (isAdminUrl) {
            if (isAuthorized) {
                setShowAdmin(true);
                loadProviders(session.user.id);
            } else {
                console.warn("Unauthorized admin access attempt");
            }
        }
    }
  }, [session]);

  // Load conversations and providers when session changes
  useEffect(() => {
    if (session?.user) {
      loadConversations(session.user.id);
      loadProviders(session.user.id);
    } else {
      setConversations([]);
      setMessages([]);
      setProviders([]);
      setCurrentConversationId(null);
    }
  }, [session]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  const loadProviders = async (userId: string) => {
    try {
      const data = await chatService.getProviders(userId);
      setProviders(data);
      // Select first active provider by default if not set or if current selection is invalid
      if (!selectedProviderId || !data.find(p => p.id === selectedProviderId)) {
          const active = data.find(p => p.is_active);
          if (active) setSelectedProviderId(active.id);
          else if (data.length > 0) setSelectedProviderId(data[0].id);
      }
    } catch (e) {
      console.error("Failed to load providers", e);
    }
  };

  const loadConversations = async (userId: string) => {
    try {
      const convs = await chatService.getConversations(userId);
      setConversations(convs);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (id: string) => {
    try {
      const msgs = await chatService.getMessages(id);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewChat = async () => {
    if (!session?.user) return;
    try {
      const newConv = await chatService.createConversation(session.user.id);
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setShowAdmin(false);
      setShowSettings(false);
      // Close sidebar if on mobile
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
        await chatService.updateConversationTitle(id, newTitle);
        setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    } catch (e) {
        console.error("Rename failed", e);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
        await chatService.deleteConversation(id);
        setConversations(prev => prev.filter(c => c.id !== id));
        if (currentConversationId === id) {
            setCurrentConversationId(null);
            setMessages([]);
        }
    } catch (e) {
        console.error("Delete failed", e);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
        await chatService.deleteMessage(messageId);
        setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (e) {
        console.error("Failed to delete message", e);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSendMessage = async (text: string, providerId: string, attachmentFile?: File, attachmentPreview?: string) => {
    if (!session?.user) return;
    
    // Identify Provider
    const selectedProvider = providers.find(p => p.id === providerId);
    if (!selectedProvider) {
        alert("Please select a valid AI Model from the list, or configure one in the Admin panel.");
        return;
    }

    let convId = currentConversationId;
    
    // Create new chat if none selected
    if (!convId) {
      const newConv = await chatService.createConversation(session.user.id, text.substring(0, 30));
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      convId = newConv.id;
    }

    // 1. Upload Attachment if exists
    let uploadedUrl: string | undefined;
    if (attachmentFile) {
      try {
        const fileExt = attachmentFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, attachmentFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        uploadedUrl = data.publicUrl;
      } catch (error) {
        console.error('Error uploading file:', error);
        uploadedUrl = attachmentPreview; 
      }
    }

    // 2. Add User Message
    const userMsg = await chatService.addMessage({
      conversation_id: convId,
      role: 'user',
      content: text,
      attachments: uploadedUrl ? [uploadedUrl] : undefined
    });
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const modelName = selectedProvider.model_name || 'gemini-2.5-flash';
    const mode = selectedProvider.category || 'CHAT';
    
    // Configure Adapter
    let adapter = getGeminiAdapter();
    if (selectedProvider && (selectedProvider.api_key || selectedProvider.endpoint)) {
        adapter = new GeminiAdapter(
            selectedProvider.api_key || process.env.API_KEY || '',
            selectedProvider.endpoint
        );
    }

    // 3. Process AI Response
    if (mode === 'IMAGE') {
      try {
        const placeholderMsg = await chatService.addMessage({
          conversation_id: convId,
          role: 'assistant',
          content: 'Generating image...'
        });
        setMessages(prev => [...prev, placeholderMsg]);

        const imageUrl = await adapter.generateImage(text, modelName);
        
        const imgMsg = await chatService.addMessage({
           conversation_id: convId,
           role: 'assistant',
           content: `Here is your image for: "${text}"`,
           image_url: imageUrl
        });
        setMessages(prev => prev.map(m => m.id === placeholderMsg.id ? imgMsg : m));

      } catch (err: any) {
        console.error(err);
        await chatService.addMessage({
          conversation_id: convId,
          role: 'assistant',
          content: `Failed to generate image. Error: ${err.message}`
        });
        loadMessages(convId);
      } finally {
        setIsLoading(false);
      }
    } else {
      // CHAT STREAM
      let streamContent = '';
      
      const assistantMsgId = crypto.randomUUID(); 
      const optimisticMsg: Message = {
        id: assistantMsgId,
        conversation_id: convId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, optimisticMsg]);

      // All messages context
      const contextMessages = [...messages, userMsg];

      await adapter.chatStream(
        contextMessages,
        modelName,
        (chunk) => {
          streamContent += chunk;
          setMessages(prev => prev.map(m => 
            m.id === assistantMsgId ? { ...m, content: streamContent } : m
          ));
        },
        async () => {
          await chatService.addMessage({
            conversation_id: convId!,
            role: 'assistant',
            content: streamContent
          });
          loadMessages(convId!);
          setIsLoading(false);
        },
        (err) => {
           console.error(err);
           setIsLoading(false);
           setMessages(prev => prev.map(m => 
            m.id === assistantMsgId ? { ...m, content: streamContent + `\n\n[Error: ${err.message || 'Check configuration'}]` } : m
          ));
        },
        attachmentPreview // Pass base64 for Gemini processing
      );
    }
  };

  if (!session) {
    return <AuthPage />;
  }

  // Construct UserProfile from session
  const userProfile: UserProfile = {
    id: session.user.id,
    email: session.user.email || 'User',
    full_name: session.user.user_metadata?.full_name,
    role: session.user.email === ADMIN_EMAIL ? 'admin' : 'user'
  };

  // Determine current bot name based on selected provider
  const currentBotName = providers.find(p => p.id === selectedProviderId)?.name;

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden text-foreground font-sans transition-colors duration-300">
      <Sidebar 
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={(id) => {
          setCurrentConversationId(id);
          setShowAdmin(false);
          setShowSettings(false);
          if (window.location.pathname.includes('admin')) {
              window.history.pushState({}, '', '/');
          }
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        userProfile={userProfile}
        onOpenAdmin={() => {
            loadProviders(session.user.id);
            setShowAdmin(true);
            setShowSettings(false);
        }}
        onOpenSettings={() => setShowSettings(true)}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        toggleOpen={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 flex flex-col h-full relative w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-border bg-background z-10 justify-between shrink-0">
           <div className="flex items-center">
             <button onClick={() => setSidebarOpen(true)} className="mr-3 text-foreground p-1 hover:bg-secondary rounded-lg">
               <Menu size={24} />
             </button>
             <div className="flex items-center gap-2 font-semibold text-foreground">
               <BrainCircuit className="h-5 w-5 text-primary" />
               PlasmaMind Chat
             </div>
           </div>
           
           <button onClick={handleNewChat} className="text-zinc-500 hover:text-foreground p-1 hover:bg-secondary rounded-lg">
             <Plus size={24} />
           </button>
        </div>

        {showAdmin ? (
          <AdminPanel onClose={() => {
              setShowAdmin(false);
              window.history.pushState({}, '', '/');
              loadProviders(session.user.id); // Reload in case admin changed things
          }} user={userProfile} />
        ) : showSettings ? (
            <SettingsModal 
                onClose={() => setShowSettings(false)} 
                user={userProfile} 
                theme={theme}
                toggleTheme={toggleTheme}
            />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto scroll-smooth">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/10 animate-fade-in">
                    <BrainCircuit className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">PlasmaMind Chat</h2>
                  {providers.length === 0 ? (
                      <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-500 max-w-sm">
                          <p className="font-semibold mb-2">No AI Models Configured</p>
                          <p className="text-sm mb-3">Please go to the Admin panel to add your Gemini API Key and configure models.</p>
                          <button 
                            onClick={() => setShowAdmin(true)}
                            className="text-sm bg-yellow-500 text-white px-3 py-1.5 rounded-md hover:bg-yellow-600 transition-colors"
                          >
                            Open Admin Panel
                          </button>
                      </div>
                  ) : (
                    <p className="max-w-md">Your advanced AI assistant. Select a model below to start.</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col pb-4">
                  {messages.map((msg, i) => (
                    <MessageItem 
                        key={msg.id || i} 
                        message={msg} 
                        botName={currentBotName}
                        onDelete={handleDeleteMessage}
                    />
                  ))}
                </div>
              )}
            </div>

            <InputArea 
              onSend={handleSendMessage}
              isLoading={isLoading}
              onStop={() => {
                setIsLoading(false);
              }}
              providers={providers}
              selectedProviderId={selectedProviderId}
              onSelectProvider={setSelectedProviderId}
            />
          </>
        )}
      </main>
    </div>
  );
}