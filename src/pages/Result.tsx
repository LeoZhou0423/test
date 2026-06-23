import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Share2, RotateCcw, FileText, History, Zap } from 'lucide-react';
import { RadarChart } from '@/components/RadarChart';
import { DomainCard } from '@/components/DomainCard';
import { FacetAccordion } from '@/components/FacetAccordion';
import { ArchetypeCard } from '@/components/ArchetypeCard';
import { AINarrative } from '@/components/AINarrative';
import { FeedbackButton } from '@/components/FeedbackButton';
import { useAppStore } from '@/store/useAppStore';
import { DOMAINS, type Domain } from '@/data/questions';
import { OVERVIEW_ADVICE } from '@/data/descriptions';
import { matchArchetype } from '@/data/archetypes';
import { detectTensions } from '@/utils/tension';
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

  const archetype = matchArchetype(scoresMap);
  const tensions = detectTensions(scoresMap);

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

  const handleScrollToFacets = () => {
    document.getElementById('facet-details')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="animate-fade-in-up px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        {/* Report Card for Export */}
        <div ref={reportRef} className="bg-[var(--bg-primary)] p-3 sm:p-6 lg:p-10">
          <div className="bauhaus-card p-5 sm:p-8 lg:p-12">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  BFI-2 测试报告
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl sm:mt-3 lg:text-5xl">
                  人格画像
                </h1>
                <p className="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm sm:mt-2">
                  测试时间：{dateStr}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[var(--border-color)] bg-[var(--accent-yellow)] sm:h-16 sm:w-16">
                <span className="font-display text-xl font-bold sm:text-2xl">BFI</span>
              </div>
            </div>

            {/* Archetype */}
            <div className="mt-6 sm:mt-10">
              <ArchetypeCard archetype={archetype} />
            </div>

            {/* AI Narrative - Streaming */}
            <div className="mt-5 sm:mt-6">
              <AINarrative scores={scores} recordId={record.id} savedNarrative={record.aiNarrative} />
            </div>

            {/* Feedback Button */}
            <div className="mt-5 sm:mt-6">
              <FeedbackButton onScrollToFacets={handleScrollToFacets} />
            </div>

            {/* Radar + Domain Scores */}
            <div className="mt-6 grid items-center gap-6 sm:mt-10 sm:gap-8 lg:grid-cols-2 lg:gap-10">
              <div className="flex justify-center">
                <RadarChart scores={scoresMap} size={280} className="sm:hidden" />
                <RadarChart scores={scoresMap} size={320} className="hidden sm:block lg:hidden" />
                <RadarChart scores={scoresMap} size={360} className="hidden lg:block" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-wide sm:text-xl">
                  五维度分数
                </h2>
                <div className="mt-4 grid gap-2 sm:gap-3 sm:grid-cols-2">
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

            {/* Overview Advice */}
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

            {/* Facet Accordions */}
            <div id="facet-details" className="mt-10 grid gap-5">
              {DOMAIN_ORDER.map((domain) => (
                <FacetAccordion key={domain} domain={domain} scores={scores} />
              ))}
            </div>

            {/* Tension Insights */}
            {tensions.length > 0 && (
              <div className="mt-10 border-t-2 border-[var(--border-color)] pt-8">
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-[var(--accent-yellow)]" />
                  <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                    内在张力
                  </h2>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  以下是你的人格维度中检测到的内在张力，了解它们有助于更好地理解自己的行为模式。
                </p>
                <div className="mt-5 grid gap-4 sm:mt-6">
                  {tensions.map((tension) => (
                    <div key={tension.pattern.id} className="bauhaus-card-sm p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-display text-base font-bold uppercase tracking-wide sm:text-lg">
                          {tension.pattern.name}
                        </h3>
                        <span className="shrink-0 border-2 border-[var(--border-color)] px-2 py-1 text-xs font-bold uppercase">
                          {tension.severity === 'strong' ? '显著' : tension.severity === 'moderate' ? '中等' : '轻微'}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                        {tension.pattern.description}
                      </p>
                      <div className="mt-4 border-l-2 border-[var(--accent-yellow)] pl-4 sm:mt-5 sm:pl-5">
                        <h4 className="font-display text-xs font-bold uppercase text-[var(--accent-yellow)] sm:text-sm">
                          内在体验
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                          {tension.pattern.innerExperience}
                        </p>
                      </div>
                      <div className="mt-4 border-l-2 border-[var(--accent-blue)] pl-4 sm:mt-5 sm:pl-5">
                        <h4 className="font-display text-xs font-bold uppercase text-[var(--accent-blue)] sm:text-sm">
                          成长策略
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                          {tension.pattern.growthStrategy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print mt-6 grid gap-2 sm:mt-8 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={handleExportImage}
            disabled={exporting}
            className="bauhaus-btn-secondary flex items-center justify-center gap-2 px-4 py-2.5 text-sm sm:px-5 sm:py-3 sm:text-base disabled:opacity-50"
          >
            <Download size={16} className="sm:hidden" />
            <Download size={18} className="hidden sm:block" />
            保存图片
          </button>
          <button
            onClick={handleShare}
            disabled={exporting}
            className="bauhaus-btn-secondary flex items-center justify-center gap-2 px-4 py-2.5 text-sm sm:px-5 sm:py-3 sm:text-base disabled:opacity-50"
          >
            <Share2 size={16} className="sm:hidden" />
            <Share2 size={18} className="hidden sm:block" />
            分享
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="bauhaus-btn-secondary flex items-center justify-center gap-2 px-4 py-2.5 text-sm sm:px-5 sm:py-3 sm:text-base disabled:opacity-50"
          >
            <FileText size={16} className="sm:hidden" />
            <FileText size={18} className="hidden sm:block" />
            导出 PDF
          </button>
          <button
            onClick={handleRetake}
            className="bauhaus-btn flex items-center justify-center gap-2 px-4 py-2.5 text-sm sm:px-5 sm:py-3 sm:text-base"
          >
            <RotateCcw size={16} className="sm:hidden" />
            <RotateCcw size={18} className="hidden sm:block" />
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
