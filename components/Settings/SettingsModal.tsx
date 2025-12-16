import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { supabase } from '../../lib/supabase';
import { X, User, Mail, Moon, Sun, Save, Loader2, Check } from 'lucide-react';
import clsx from 'clsx';

interface SettingsModalProps {
  onClose: () => void;
  user: UserProfile;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, user, theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'appearance'>('profile');
  const [fullName, setFullName] = useState(user.full_name || '');
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email || email === user.email) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        email: email
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Check your new email for a confirmation link.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-secondary rounded-xl border border-border shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[80vh]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-sidebar border-b md:border-b-0 md:border-r border-border p-4 flex flex-col gap-2">
           <h2 className="text-lg font-bold text-foreground px-2 mb-4">Settings</h2>
           
           <button 
             onClick={() => setActiveTab('profile')}
             className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === 'profile' ? "bg-primary text-white" : "text-zinc-500 hover:bg-zinc-800/10 dark:hover:bg-zinc-800"
             )}
           >
             <User size={18} /> Profile
           </button>
           
           <button 
             onClick={() => setActiveTab('account')}
             className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === 'account' ? "bg-primary text-white" : "text-zinc-500 hover:bg-zinc-800/10 dark:hover:bg-zinc-800"
             )}
           >
             <Mail size={18} /> Account
           </button>

           <button 
             onClick={() => setActiveTab('appearance')}
             className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === 'appearance' ? "bg-primary text-white" : "text-zinc-500 hover:bg-zinc-800/10 dark:hover:bg-zinc-800"
             )}
           >
             {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} Appearance
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-background">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-foreground capitalize">{activeTab}</h3>
              <button onClick={onClose} className="text-zinc-500 hover:text-foreground">
                 <X size={24} />
              </button>
           </div>

           {message && (
             <div className={clsx(
               "mb-4 p-3 rounded-lg text-sm flex items-center gap-2",
               message.type === 'success' ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
             )}>
                {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
                {message.text}
             </div>
           )}

           {activeTab === 'profile' && (
             <div className="space-y-6">
               <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Enter your name"
                  />
               </div>
               <button 
                 onClick={handleUpdateProfile}
                 disabled={loading}
                 className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
               >
                 {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                 Save Changes
               </button>
             </div>
           )}

           {activeTab === 'account' && (
             <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    Changing your email will require confirmation on the new address.
                  </p>
               </div>
               <button 
                 onClick={handleUpdateEmail}
                 disabled={loading || email === user.email}
                 className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
               >
                 {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                 Update Email
               </button>
             </div>
           )}

           {activeTab === 'appearance' && (
             <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border">
                    <div>
                       <div className="font-medium text-foreground">Dark Mode</div>
                       <div className="text-sm text-zinc-500">Toggle application theme</div>
                    </div>
                    <button 
                      onClick={toggleTheme}
                      className={clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        theme === 'dark' ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"
                      )}
                    >
                      <span className={clsx(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        theme === 'dark' ? "translate-x-6" : "translate-x-1"
                      )}/>
                    </button>
                </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};