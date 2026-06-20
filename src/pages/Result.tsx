import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Share2, RotateCcw, FileText, History } from 'lucide-react';
import { RadarChart } from '@/components/RadarChart';
import { DomainCard } from '@/components/DomainCard';
import { FacetAccordion } from '@/components/FacetAccordion';
import { useAppStore } from '@/store/useAppStore';
import { DOMAINS, type Domain } from '@/data/questions';
import { OVERVIEW_ADVICE } from '@/data/descriptions';
import { exportElementToImage, exportElementToPDF, shareElementImage } from '@/utils/export';

const DOMAIN_ORDER: Domain[] = ['O', 'C', 'E', 'A', 'N'];

export function Result() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { history, clearCurrentAnswers } = useAppStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const record = id
    ? history.find((r) => r.id === id)
    : history[0];

  useEffect(() => {
    if (!record) {
      navigate('/');
    }
  }, [record, navigate]);

  if (!record) return null;

  const scores = record.scores;
  const scoresMap: Record<Domain, number> = {
    O: scores.openness,
    C: scores.conscientiousness,
    E: scores.extraversion,
    A: scores.agreeableness,
    N: scores.neuroticism,
  };

  const dateStr = new Date(record.createdAt).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    await exportElementToImage(reportRef.current, `bfi2-result-${record.id.slice(0, 8)}`);
    setExporting(false);
  };

  const handleShare = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    await shareElementImage(reportRef.current, `bfi2-result-${record.id.slice(0, 8)}`);
    setExporting(false);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    await exportElementToPDF(reportRef.current, `bfi2-result-${record.id.slice(0, 8)}`);
    setExporting(false);
  };

  const handleRetake = () => {
    clearCurrentAnswers();
    navigate('/quiz');
  };

  return (
    <main className="animate-fade-in-up px-6 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Report Card for Export */}
        <div ref={reportRef} className="bg-[var(--bg-primary)] p-6 sm:p-10">
          <div className="bauhaus-card p-8 sm:p-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  BFI-2 测试报告
                </p>
                <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight sm:text-5xl">
                  人格画像
                </h1>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  测试时间：{dateStr}
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center border-2 border-[var(--border-color)] bg-[var(--accent-yellow)]">
                <span className="font-display text-2xl font-bold">BFI</span>
              </div>
            </div>

            <div className="mt-10 grid items-center gap-10 lg:grid-cols-2">
              <div className="flex justify-center">
                <RadarChart scores={scoresMap} size={320} />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                  五维度分数
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {DOMAIN_ORDER.map((domain) => (
                    <DomainCard
                      key={domain}
                      domain={domain}
                      score={scoresMap[domain]}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 border-t-2 border-[var(--border-color)] pt-8">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                结果解读
              </h2>
              <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
                {OVERVIEW_ADVICE.intro}
              </p>
              <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
                {OVERVIEW_ADVICE.note}
              </p>
            </div>

            <div className="mt-10 grid gap-5">
              {DOMAIN_ORDER.map((domain) => (
                <FacetAccordion key={domain} domain={domain} scores={scores} />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={handleExportImage}
            disabled={exporting}
            className="bauhaus-btn-secondary flex items-center justify-center gap-2 px-5 py-3 disabled:opacity-50"
          >
            <Download size={18} />
            保存图片
          </button>
          <button
            onClick={handleShare}
            disabled={exporting}
            className="bauhaus-btn-secondary flex items-center justify-center gap-2 px-5 py-3 disabled:opacity-50"
          >
            <Share2 size={18} />
            分享
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="bauhaus-btn-secondary flex items-center justify-center gap-2 px-5 py-3 disabled:opacity-50"
          >
            <FileText size={18} />
            导出 PDF
          </button>
          <button
            onClick={handleRetake}
            className="bauhaus-btn flex items-center justify-center gap-2 px-5 py-3"
          >
            <RotateCcw size={18} />
            再测一次
          </button>
        </div>

        <div className="no-print mt-6 text-center">
          <button
            onClick={() => navigate('/history')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--text-primary)]"
          >
            <History size={18} />
            查看历史记录
          </button>
        </div>
      </div>
    </main>
  );
}
