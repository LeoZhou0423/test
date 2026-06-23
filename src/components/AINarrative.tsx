import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAppStore } from '@/store/useAppStore';
import { streamAIAnalysis, analyzeScores } from '@/utils/ai';
import type { DomainScores } from '@/utils/scoring';
import { cn } from '@/lib/utils';

interface AINarrativeProps {
  scores: DomainScores;
  recordId?: string; // 历史记录 ID，用于保存解读结果
  savedNarrative?: string; // 已保存的解读结果
  className?: string;
}

export function AINarrative({ scores, recordId, savedNarrative, className }: AINarrativeProps) {
  const { settings, saveNarrative } = useAppStore();
  const [content, setContent] = useState(savedNarrative || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(!!savedNarrative);
  const [error, setError] = useState<string | null>(null);

  const analysis = useMemo(() => analyzeScores(scores), [scores]);

  const startStream = useCallback(async () => {
    if (!settings.mimoApiKey) {
      setError('请先在设置中配置 Mimo API Key');
      return;
    }

    setIsLoading(true);
    setError(null);
    setContent('');
    setIsComplete(false);

    let fullContent = '';

    await streamAIAnalysis(scores, {
      apiKey: settings.mimoApiKey,
      baseUrl: settings.mimoBaseUrl || 'https://token-plan-cn.xiaomimimo.com/v1',
      corsProxy: settings.corsProxy || undefined,
      onToken: (token) => {
        fullContent += token;
        setContent(fullContent);
      },
      onComplete: () => {
        setIsComplete(true);
        setIsLoading(false);
        // 保存解读结果到历史记录
        if (recordId && fullContent) {
          saveNarrative(recordId, fullContent);
        }
      },
      onError: (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    });
  }, [scores, settings.mimoApiKey, settings.mimoBaseUrl, settings.corsProxy, recordId, saveNarrative]);

  // 如果有已保存的解读，不自动开始
  useEffect(() => {
    if (settings.mimoApiKey && !content && !isLoading && !error && !savedNarrative) {
      startStream();
    }
  }, [settings.mimoApiKey, content, isLoading, error, savedNarrative, startStream]);

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
      {/* Retest warning */}
      {analysis.retestMessage && !savedNarrative && (
        <div className={cn(
          'mb-4 p-4 border-2',
          analysis.hasRetestAdvice
            ? 'border-[var(--accent-yellow)] bg-yellow-50 dark:bg-yellow-950/20'
            : 'border-[var(--accent-blue)] bg-blue-50 dark:bg-blue-950/20'
        )}>
          <div className="flex items-start gap-2">
            <AlertTriangle
              size={18}
              className={cn(
                'mt-0.5 shrink-0',
                analysis.hasRetestAdvice ? 'text-[var(--accent-yellow)]' : 'text-[var(--accent-blue)]'
              )}
            />
            <p className="text-sm leading-relaxed text-[var(--text-primary)]">
              {analysis.retestMessage}
            </p>
          </div>
        </div>
      )}

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

      <div className="prose prose-sm max-w-none dark:prose-invert
        prose-headings:font-display prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-wide
        prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2
        prose-h3:text-base prose-h3:mt-4 prose-h3:mb-1
        prose-p:text-sm prose-p:leading-relaxed prose-p:my-2
        prose-strong:font-semibold prose-strong:text-[var(--text-primary)]
        prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
        prose-ol:my-2
        prose-li:text-sm prose-li:leading-relaxed
        text-[var(--text-secondary)]
      ">
        <ReactMarkdown>{content}</ReactMarkdown>
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
