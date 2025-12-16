import React from 'react';
import { Message } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';
import { Bot, User, Trash2, FileText, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

interface MessageItemProps {
  message: Message;
  botName?: string;
  onDelete: (id: string) => void;
}

const isImage = (url: string) => {
    // Check for data URI image
    if (url.startsWith('data:image')) return true;
    if (url.startsWith('data:')) return false; 
    
    // Check for common image extensions
    const ext = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff'].includes(ext || '');
};

const getFileName = (url: string) => {
    if (url.startsWith('data:')) {
        // Try to guess from mime type if available
        const mime = url.substring(5, url.indexOf(';'));
        const ext = mime.split('/')[1] || 'file';
        return `file.${ext}`;
    }
    const name = url.split('/').pop()?.split('?')[0];
    return decodeURIComponent(name || 'Attachment');
};

export const MessageItem: React.FC<MessageItemProps> = ({ message, botName, onDelete }) => {
  const isUser = message.role === 'user';
  
  // Use provided botName or fallback to company default
  const displayName = isUser ? 'You' : (botName || 'PlasmaMind AI');

  return (
    <div
      className={clsx(
        "group w-full text-foreground border-b border-border relative",
        isUser ? "bg-transparent" : "bg-transparent"
      )}
    >
      <div className="max-w-3xl mx-auto px-4 py-8 flex gap-4 md:gap-6">
        <div className="flex-shrink-0 flex flex-col relative items-end">
          <div className={clsx(
            "w-8 h-8 rounded-full flex items-center justify-center border",
            isUser ? "bg-accent border-zinc-500/30" : "bg-primary border-blue-500"
          )}>
            {isUser ? <User size={18} /> : <Bot size={18} className="text-white" />}
          </div>
        </div>
        
        <div className="relative flex-1 overflow-hidden">
          <div className="flex justify-between items-start mb-1">
            <div className="font-semibold text-sm opacity-90 flex items-center gap-2">
                <span className={isUser ? "text-zinc-500 dark:text-zinc-400" : "text-primary"}>
                {displayName}
                </span>
            </div>
            
            {/* Delete Button - Visible on Hover */}
            <button 
                onClick={() => onDelete(message.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded"
                title="Delete message"
            >
                <Trash2 size={14} />
            </button>
          </div>
          
          {/* Attachments (Images & Files) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4 mt-1">
              {message.attachments.map((att, idx) => (
                isImage(att) ? (
                    <div key={idx} className="relative group/image">
                         <img 
                            src={att} 
                            alt="Attachment" 
                            className="rounded-lg h-40 w-auto border border-border shadow-sm object-cover bg-secondary" 
                        />
                    </div>
                ) : (
                    <a 
                        key={idx} 
                        href={att} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all group/file max-w-sm"
                    >
                        <div className="p-2.5 bg-background rounded-lg text-primary shadow-sm">
                            <FileText size={24} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                                {getFileName(att)}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase font-mono">
                                FILE
                            </span>
                        </div>
                        <ExternalLink size={16} className="text-zinc-400 opacity-0 group-hover/file:opacity-100 transition-opacity ml-1" />
                    </a>
                )
              ))}
            </div>
          )}
          
          {/* Assistant Generated Image */}
          {message.image_url && (
            <div className="mb-4">
              <img 
                src={message.image_url} 
                alt="Generated" 
                className="rounded-lg max-w-sm border border-border shadow-lg" 
              />
            </div>
          )}

          <div className="min-h-[20px]">
             <MarkdownRenderer content={message.content || ((message.image_url || message.attachments) ? '' : 'Thinking...')} />
          </div>
        </div>
      </div>
    </div>
  );
};