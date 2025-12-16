import React, { useState } from 'react';
import { Message } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';
import { Bot, User, Trash2, FileText, ExternalLink, Download, Copy, Check } from 'lucide-react';
import clsx from 'clsx';

interface MessageItemProps {
  message: Message;
  botName?: string;
  onDelete: (id: string) => void;
}

const isImage = (url: string) => {
    if (url.startsWith('data:image')) return true;
    if (url.startsWith('data:')) return false; 
    const ext = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff'].includes(ext || '');
};

const getFileName = (url: string) => {
    if (url.startsWith('data:')) {
        const mime = url.substring(5, url.indexOf(';'));
        const ext = mime.split('/')[1] || 'file';
        return `file.${ext}`;
    }
    const name = url.split('/').pop()?.split('?')[0];
    return decodeURIComponent(name || 'Attachment');
};

export const MessageItem: React.FC<MessageItemProps> = ({ message, botName, onDelete }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  
  const displayName = isUser ? 'You' : (botName || 'PlasmaMind AI');

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `plasmamind-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={clsx(
        "group w-full text-foreground border-b border-border relative transition-colors",
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
        
        <div className="relative flex-1 overflow-hidden min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div className="font-semibold text-sm opacity-90 flex items-center gap-2">
                <span className={isUser ? "text-zinc-500 dark:text-zinc-400" : "text-primary"}>
                {displayName}
                </span>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Copy Text Button - Available for both User and AI */}
                {!message.image_url && message.content && (
                   <button 
                      onClick={handleCopy}
                      className="p-1.5 text-zinc-400 hover:text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                      title="Copy message"
                   >
                       {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14} />}
                   </button>
                )}

                {/* Delete Button */}
                <button 
                    onClick={() => onDelete(message.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                    title="Delete message"
                >
                    <Trash2 size={14} />
                </button>
            </div>
          </div>
          
          {/* User Attachments */}
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
          
          {/* AI Generated Image */}
          {message.image_url && (
            <div className="mb-4 mt-2 relative group/gen-image inline-block">
              <img 
                src={message.image_url} 
                alt="Generated" 
                className="rounded-lg max-w-md w-full border border-border shadow-lg" 
              />
              <button
                onClick={() => handleDownload(message.image_url!)}
                className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-lg opacity-0 group-hover/gen-image:opacity-100 transition-opacity hover:bg-black/80 shadow-sm backdrop-blur-sm"
                title="Download Image"
              >
                <Download size={18} />
              </button>
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