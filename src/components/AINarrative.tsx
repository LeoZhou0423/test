import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { streamAIAnalysis } from '@/utils/ai';
import type { DomainScores } from '@/utils/scoring';
import { cn } from '@/lib/utils';

interface AINarrativeProps {
  scores: DomainScores;
  className?: string;
}

export function AINarrative({ scores, className }: AINarrativeProps) {
  const { settings } = useAppStore();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startStream = useCallback(async () => {
    if (!settings.mimoApiKey) {
      setError('请先在设置中配置 Mimo API Key');
      return;
    }

    setIsLoading(true);
    setError(null);
    setContent('');

    await streamAIAnalysis(scores, {
      apiKey: settings.mimoApiKey,
      baseUrl: settings.mimoBaseUrl || 'https://api.mimo.ai/v1',
      onToken: (token) => {
        setContent((prev) => prev + token);
      },
      onComplete: () => {
        setIsComplete(true);
        setIsLoading(false);
      },
      onError: (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    });
  }, [scores, settings.mimoApiKey, settings.mimoBaseUrl]);

  // Auto-start if API key is configured
  useEffect(() => {
    if (settings.mimoApiKey && !content && !isLoading && !error) {
      startStream();
    }
  }, [settings.mimoApiKey, content, isLoading, error, startStream]);

  // Parse markdown content
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-1 my-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-sm leading-relaxed sm:text-base">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const renderInline = (line: string) => {
      // Handle bold, italic, and inline code
      const parts: React.ReactNode[] = [];
      let remaining = line;
      let key = 0;

      while (remaining.length > 0) {
        // Bold: **text**
        const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)/s);
        if (boldMatch) {
          if (boldMatch[1]) parts.push(boldMatch[1]);
          parts.push(
            <strong key={key++} className="font-semibold text-[var(--text-primary)]">
              {boldMatch[2]}
            </strong>
          );
          remaining = boldMatch[3];
          continue;
        }

        // Italic: *text*
        const italicMatch = remaining.match(/^(.*?)\*(.*?)\*(.*)/s);
        if (italicMatch) {
          if (italicMatch[1]) parts.push(italicMatch[1]);
          parts.push(
            <em key={key++} className="italic">{italicMatch[2]}</em>
          );
          remaining = italicMatch[3];
          continue;
        }

        // No more formatting
        parts.push(remaining);
        break;
      }

      return parts.length === 1 ? parts[0] : parts;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line
      if (trimmed === '') {
        flushList();
        continue;
      }

      // Header: ## text
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h3
            key={`h3-${i}`}
            className="font-display text-lg font-bold uppercase tracking-wide mt-6 first:mt-0 mb-2 sm:text-xl"
          >
            {trimmed.slice(3)}
          </h3>
        );
        continue;
      }

      // Subheader: ### text
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h4
            key={`h4-${i}`}
            className="font-display text-base font-bold uppercase tracking-wide mt-4 mb-1 sm:text-lg"
          >
            {trimmed.slice(4)}
          </h4>
        );
        continue;
      }

      // List item: - text or * text
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        currentList.push(trimmed.slice(2));
        continue;
      }

      // Numbered list: 1. text
      const numberedListMatch = trimmed.match(/^\d+\.\s+(.*)/);
      if (numberedListMatch) {
        currentList.push(numberedListMatch[1]);
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={`p-${i}`} className="text-sm leading-relaxed sm:text-base my-2">
          {renderInline(trimmed)}
        </p>
      );
    }

    flushList(); // Flush any remaining list items
    return elements;
  };

  if (!settings.mimoApiKey) {
    return (
      <div className={cn('bauhaus-card-sm p-5 sm:p-6', className)}>
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          AI 深度解读
        </p>
        <div className="mt-4 text-center py-8">
          <p className="text-sm text-[var(--text-secondary)]">
            配置 Mimo API Key 后即可启用 AI 深度解读
          </p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            前往 设置 → AI 配置 填写 API Key
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bauhaus-card-sm p-5 sm:p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            AI 深度解读
          </p>
          <h2 className="font-display text-xl font-bold uppercase tracking-wide sm:text-2xl">
            人格侧写
          </h2>
        </div>
        {isLoading && (
          <Loader2 size={20} className="animate-spin text-[var(--accent-blue)]" />
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 border-2 border-[var(--accent-red)] bg-red-50 dark:bg-red-950/20">
          <p className="text-sm text-[var(--accent-red)]">{error}</p>
          <button
            onClick={startStream}
            className="mt-2 text-xs font-medium underline text-[var(--accent-red)]"
          >
            重试
          </button>
        </div>
      )}

      <div className="space-y-2 text-[var(--text-secondary)]">
        {renderContent(content)}
        {isLoading && (
          <span className="inline-block w-[2px] h-[1em] bg-[var(--accent-blue)] animate-pulse ml-[1px] align-text-bottom" />
        )}
      </div>

      {isComplete && (
        <div className="mt-6 pt-4 border-t-2 border-[var(--border-color)]">
          <button
            onClick={startStream}
            className="text-xs font-medium text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--text-primary)]"
          >
            重新生成
          </button>
        </div>
      )}
    </div>
  );
}
