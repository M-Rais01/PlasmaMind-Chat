import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Clipboard, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [copied, setCopied] = React.useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className="bg-zinc-200 dark:bg-zinc-800 text-foreground px-1 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-border bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-zinc-700 text-xs text-zinc-400">
        <span className="font-mono lowercase">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-zinc-100 transition-colors"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Clipboard size={14} />}
          <span>{copied ? 'Copied!' : 'Copy code'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      className="prose prose-zinc dark:prose-invert max-w-none leading-7"
      remarkPlugins={[remarkGfm]}
      components={{
        code: CodeBlock,
        a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" {...props} />,
        p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-4" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-4" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default memo(MarkdownRenderer);