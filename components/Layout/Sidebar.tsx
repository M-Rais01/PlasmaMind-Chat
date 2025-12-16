import React, { useState } from 'react';
import { Conversation, UserProfile } from '../../types';
import { Plus, MessageSquare, Trash2, Pencil, Check, X, BrainCircuit, Settings, LogOut } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  userProfile?: UserProfile;
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  isOpen: boolean;
  toggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  userProfile,
  onOpenAdmin,
  onOpenSettings,
  onSignOut,
  isOpen,
  toggleOpen
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const saveEditing = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle);
    }
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
        onDeleteConversation(id);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={clsx(
          "fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity backdrop-blur-sm",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleOpen}
      />

      <aside 
        className={clsx(
          "fixed md:static inset-y-0 left-0 z-30 w-[280px] bg-sidebar flex flex-col transition-transform duration-300 transform md:transform-none border-r border-border shadow-2xl md:shadow-none h-full",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 flex items-center gap-2 font-bold text-lg text-primary border-b border-border/50">
             <BrainCircuit className="h-6 w-6" />
             PlasmaMind Chat
        </div>

        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) toggleOpen();
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-border bg-background text-sm text-foreground hover:bg-secondary transition-colors text-left shadow-sm"
          >
            <div className="bg-foreground text-background p-0.5 rounded-sm">
               <Plus size={14} />
            </div>
            <span>New chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
          <div className="text-xs font-semibold text-zinc-500 px-3 mb-2 uppercase tracking-wider">Recent</div>
          {conversations.length === 0 && (
              <div className="px-3 py-4 text-xs text-zinc-500 text-center italic">
                  No conversations yet.
              </div>
          )}
          {conversations.map(conv => (
            <div
                key={conv.id}
                onClick={() => {
                    onSelectConversation(conv.id);
                    if (window.innerWidth < 768) toggleOpen();
                }}
                className={clsx(
                    "group relative w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors cursor-pointer mb-1",
                    currentConversationId === conv.id 
                    ? "bg-secondary text-foreground font-medium" 
                    : "text-zinc-500 hover:bg-secondary/50 hover:text-foreground"
                )}
            >
              <MessageSquare size={16} className="flex-shrink-0" />
              
              {editingId === conv.id ? (
                <div className="flex-1 flex items-center gap-1 z-10" onClick={e => e.stopPropagation()}>
                    <input 
                        type="text" 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-background border border-primary rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-primary outline-none text-foreground"
                        autoFocus
                    />
                    <button onClick={(e) => saveEditing(e, conv.id)} className="text-green-500 hover:text-green-400 p-0.5"><Check size={14}/></button>
                    <button onClick={cancelEditing} className="text-red-500 hover:text-red-400 p-0.5"><X size={14}/></button>
                </div>
              ) : (
                <>
                    <span className="truncate flex-1">{conv.title}</span>
                    {/* Hover Actions */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary/80 backdrop-blur-sm rounded">
                        <button 
                            onClick={(e) => startEditing(e, conv)} 
                            className="p-1 text-zinc-500 hover:text-foreground rounded"
                            title="Rename"
                        >
                            <Pencil size={12} />
                        </button>
                        <button 
                            onClick={(e) => handleDelete(e, conv.id)} 
                            className="p-1 text-zinc-500 hover:text-red-400 rounded"
                            title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-border mt-auto">
          <div className="flex items-center gap-2 w-full px-2 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/80 transition-colors cursor-default group border border-transparent hover:border-border">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
              {userProfile?.full_name ? userProfile.full_name[0].toUpperCase() : (userProfile?.email?.[0].toUpperCase() || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {userProfile?.full_name || 'User'}
              </div>
              <div className="text-xs text-zinc-500 truncate">
                {userProfile?.email}
              </div>
            </div>
            
            <div className="flex gap-1">
                <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenSettings();
                }}
                className="p-1.5 text-zinc-500 hover:text-primary hover:bg-background rounded-md transition-colors"
                title="Settings"
                >
                <Settings size={16} />
                </button>
                <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onSignOut();
                }}
                className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-background rounded-md transition-colors"
                title="Log Out"
                >
                <LogOut size={16} />
                </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};