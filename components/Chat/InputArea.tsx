import React, { useState, useRef, useEffect } from 'react';
import { Send, StopCircle, Clock, Paperclip, X, ChevronDown, Sparkles, Image as ImageIcon, FileText } from 'lucide-react';
import clsx from 'clsx';
import { AIProvider } from '../../types';

interface InputAreaProps {
  onSend: (text: string, providerId: string, attachmentFile?: File, attachmentPreview?: string) => void;
  isLoading: boolean;
  onStop: () => void;
  providers: AIProvider[];
  selectedProviderId: string;
  onSelectProvider: (id: string) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ 
  onSend, 
  isLoading, 
  onStop, 
  providers, 
  selectedProviderId, 
  onSelectProvider 
}) => {
  const [input, setInput] = useState('');
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [timer, setTimer] = useState(0);

  // Derive current mode from selected provider
  const selectedProvider = providers.find(p => p.id === selectedProviderId) || providers[0];
  const isImageMode = selectedProvider?.category === 'IMAGE';

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      setTimer(0);
      interval = setInterval(() => setTimer(t => t + 0.1), 100);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setAttachmentPreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if ((!input.trim() && !attachmentFile) || isLoading) return;
    
    // Pass the selected provider ID
    onSend(input, selectedProviderId, attachmentFile || undefined, attachmentPreview || undefined);
    
    setInput('');
    setAttachmentPreview(null);
    setAttachmentFile(null);
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isImageFile = attachmentFile?.type.startsWith('image/');

  return (
    <div className="w-full bg-background pt-2 pb-6 px-4 transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex flex-col w-full p-3 bg-secondary rounded-2xl border border-border focus-within:ring-1 focus-within:ring-primary transition-all shadow-lg">
          
          {/* Attachment Preview */}
          {attachmentPreview && (
            <div className="relative mb-2 w-fit group">
              {isImageFile ? (
                <img 
                  src={attachmentPreview} 
                  alt="Attachment" 
                  className="h-16 w-16 object-cover rounded-lg border border-border"
                />
              ) : (
                <div className="h-16 w-20 flex flex-col items-center justify-center bg-background rounded-lg border border-border p-1">
                  <FileText size={20} className="text-primary mb-1" />
                  <span className="text-[9px] text-zinc-500 truncate w-full text-center">
                    {attachmentFile?.name}
                  </span>
                  <span className="text-[8px] text-zinc-400 uppercase">
                    {attachmentFile?.name.split('.').pop()}
                  </span>
                </div>
              )}
              
              <button 
                onClick={() => {
                  setAttachmentPreview(null);
                  setAttachmentFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-0.5 border border-zinc-600 text-zinc-400 hover:text-red-400 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={isImageMode ? "Describe the image you want generated..." : `Message ${selectedProvider?.name || 'PlasmaMind'}...`}
            className="w-full bg-transparent border-0 focus:ring-0 resize-none max-h-[200px] py-2 pr-10 pl-2 text-base text-foreground placeholder:text-zinc-500"
          />

          <div className="flex justify-between items-center mt-2 pl-1">
            <div className="flex items-center gap-2">
              
              {/* Model Selector Dropdown */}
              <div className="relative group">
                <select 
                    value={selectedProviderId} 
                    onChange={(e) => onSelectProvider(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                    {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background text-foreground hover:bg-accent transition-colors border border-border shadow-sm">
                    {isImageMode ? <ImageIcon size={14} className="text-purple-400" /> : <Sparkles size={14} className="text-primary" />}
                    <span className="text-xs font-medium max-w-[120px] truncate">
                        {selectedProvider?.name || 'Select Model'}
                    </span>
                    <ChevronDown size={12} className="text-zinc-500" />
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                // Accept all files
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-zinc-500 hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                title="Attach file"
              >
                <Paperclip size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {isLoading ? (
                 <div className="flex items-center gap-2">
                   <div className="flex items-center gap-1 text-zinc-500 text-xs font-mono">
                     <Clock size={12} />
                     {timer.toFixed(1)}s
                   </div>
                   <button onClick={onStop} className="p-2 bg-zinc-200 dark:bg-zinc-800 text-foreground rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                     <StopCircle size={16} />
                   </button>
                 </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() && !attachmentFile}
                  className={clsx(
                    "p-2 rounded-lg transition-colors",
                    (input.trim() || attachmentFile) 
                      ? "bg-primary text-white hover:bg-blue-600 shadow-lg shadow-blue-900/20" 
                      : "bg-accent text-zinc-500 cursor-not-allowed"
                  )}
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-zinc-500 mt-3">
          PlasmaMind AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};