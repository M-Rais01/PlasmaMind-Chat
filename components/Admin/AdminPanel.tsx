import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, RotateCcw, Key, Globe } from 'lucide-react';
import { AIProvider, UserProfile } from '../../types';
import { chatService } from '../../services/chatService';

interface AdminPanelProps {
  onClose: () => void;
  user: UserProfile;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, user }) => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadProviders();
  }, [user]);

  const loadProviders = async () => {
    setLoading(true);
    try {
        const data = await chatService.getProviders(user.id);
        setProviders(data);
    } catch (e) {
        console.error("Failed to load providers", e);
    } finally {
        setLoading(false);
    }
  };

  const handleUpdate = (id: string, field: keyof AIProvider, value: any) => {
    setProviders(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleAddNew = () => {
      const tempId = `temp-${Date.now()}`;
      setProviders([...providers, { 
          id: tempId, 
          name: 'New Custom Model', 
          model_name: 'gemini-2.5-flash', 
          category: 'CHAT', 
          is_active: false,
          api_key: '',
          endpoint: ''
      }]);
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('temp-')) {
        setProviders(prev => prev.filter(p => p.id !== id));
        return;
    }
    if (confirm("Delete this provider config?")) {
        try {
            await chatService.deleteProvider(id);
            setProviders(prev => prev.filter(p => p.id !== id));
        } catch (e) {
            alert("Error deleting provider");
        }
    }
  };

  const handleSaveAll = async () => {
    try {
        for (const p of providers) {
            // Convert empty strings to null for cleaner DB storage
            const providerToSave = {
                ...p,
                api_key: p.api_key || undefined,
                endpoint: p.endpoint || undefined
            };
            await chatService.saveProvider(providerToSave, user.id, p.id.startsWith('temp-') ? undefined : p.id);
        }
        await loadProviders(); // Reload to get real IDs
        alert("Configuration saved successfully!");
    } catch (e: any) {
        console.error("Save Error:", e);
        
        let errorMsg = "Unknown error";
        
        // Robust Error Extraction
        if (typeof e === 'string') {
            errorMsg = e;
        } else if (e instanceof Error) {
            errorMsg = e.message;
        } else if (typeof e === 'object' && e !== null) {
            // Supabase/Postgrest Error Object
            const msg = e.message || e.error_description || e.details;
            if (msg) {
                errorMsg = msg;
                if (e.code) errorMsg += ` (Code: ${e.code})`;
            } else {
                try {
                    errorMsg = JSON.stringify(e);
                    if (errorMsg === '{}') errorMsg = "Error object is empty or not serializable.";
                } catch {
                    errorMsg = "Unserializable Error Object";
                }
            }
        }

        if (errorMsg.toLowerCase().includes("relation") || errorMsg.toLowerCase().includes("does not exist") || errorMsg.includes("42P01")) {
             alert(
                 "Database Setup Required:\n\n" +
                 "The 'ai_providers' table is missing. You must run the SQL setup script in your Supabase Dashboard -> SQL Editor.\n\n" +
                 "Error: " + errorMsg
             );
        } else if (errorMsg.toLowerCase().includes("column") || errorMsg.includes("42703")) {
             alert(
                 "Database Schema Mismatch:\n\n" +
                 "The 'ai_providers' table is missing new columns (api_key/endpoint). Please update your table schema using the SQL Editor.\n\n" +
                 "Error: " + errorMsg
             );
        } else {
             alert(`Failed to save configuration:\n${errorMsg}`);
        }
    }
  };

  return (
    <div className="flex-1 bg-background h-full overflow-y-auto p-6 md:p-12 transition-colors">
      <div className="max-w-4xl mx-auto">
        <button onClick={onClose} className="flex items-center gap-2 text-zinc-500 hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back to Chat
        </button>

        <h1 className="text-3xl font-bold text-foreground mb-2">PlasmaMind Configuration</h1>
        <p className="text-zinc-500 mb-8">Configure your AI Models. Add custom Gemini models, API Keys, or compatible Endpoints.</p>

        <div className="bg-secondary/30 border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-sidebar">
            <h2 className="font-semibold text-foreground">AI Model Registry</h2>
            <div className="flex gap-2">
                <button 
                  onClick={loadProviders}
                  className="p-2 text-zinc-500 hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                  title="Reload"
                >
                  <RotateCcw size={16} />
                </button>
                <button 
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <Plus size={14} /> Add Model
                </button>
            </div>
          </div>

          <div className="divide-y divide-border">
            {loading ? (
                <div className="p-8 text-center text-zinc-500">Loading configurations...</div>
            ) : providers.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">No providers found. Add one to get started.</div>
            ) : (
                providers.map((p) => (
                <div key={p.id} className="p-6 hover:bg-accent/50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-4">
                        {/* Row 1: Basic Info */}
                        <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Display Name</label>
                            <input 
                            type="text" 
                            value={p.name}
                            onChange={(e) => handleUpdate(p.id, 'name', e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none transition-colors" 
                            placeholder="e.g. Gemini Pro"
                            />
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Model ID (API)</label>
                            <input 
                            type="text" 
                            value={p.model_name}
                            onChange={(e) => handleUpdate(p.id, 'model_name', e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none font-mono transition-colors" 
                            placeholder="gemini-2.5-flash"
                            />
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Category</label>
                            <select
                            value={p.category}
                            onChange={(e) => handleUpdate(p.id, 'category', e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none transition-colors"
                            >
                                <option value="CHAT">Chat (Text Generation)</option>
                                <option value="IMAGE">Image Generation</option>
                            </select>
                        </div>

                        {/* Row 2: Advanced (API Key & Endpoint) */}
                        <div className="md:col-span-6">
                            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1 flex items-center gap-1">
                                <Key size={10} /> Custom API Key (Optional)
                            </label>
                            <input 
                                type="password" 
                                value={p.api_key || ''}
                                onChange={(e) => handleUpdate(p.id, 'api_key', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none font-mono transition-colors" 
                                placeholder="Leave empty to use default"
                            />
                        </div>
                        <div className="md:col-span-6">
                            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1 flex items-center gap-1">
                                <Globe size={10} /> Endpoint URL (Optional)
                            </label>
                            <input 
                                type="text" 
                                value={p.endpoint || ''}
                                onChange={(e) => handleUpdate(p.id, 'endpoint', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none font-mono transition-colors" 
                                placeholder="https://generativelanguage.googleapis.com"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input 
                                type="checkbox" 
                                checked={p.is_active} 
                                onChange={(e) => handleUpdate(p.id, 'is_active', e.target.checked)}
                                className="w-4 h-4 rounded bg-background border-zinc-400 dark:border-zinc-600 text-primary focus:ring-0 transition-colors" 
                                />
                                <span className={p.is_active ? "text-sm text-green-600 dark:text-green-400 font-medium" : "text-sm text-zinc-500"}>
                                    {p.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <button 
                            onClick={() => handleDelete(p.id)}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete Provider"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
                ))
            )}
          </div>
          
          <div className="p-4 border-t border-border bg-sidebar flex justify-end">
             <button 
                onClick={handleSaveAll}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-md"
            >
                <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};