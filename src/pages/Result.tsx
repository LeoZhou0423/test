import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Share2, RotateCcw, FileText, History, Briefcase, Heart, Target, Sparkles, TrendingUp, ChevronDown } from 'lucide-react';
import { RadarChart } from '@/components/RadarChart';
import { DomainCard } from '@/components/DomainCard';
import { useAppStore } from '@/store/useAppStore';
import { DOMAINS, FACETS, type Domain } from '@/data/questions';
import { buildPersonalityModel, type PersonalityModel, type FacetProfile } from '@/utils/scoring';
import { exportElementToImage, exportElementToPDF, shareElementImage } from '@/utils/export';

const DOMAIN_ORDER: Domain[] = ['O', 'C', 'E', 'A', 'N'];

const LEVEL_LABELS: Record<string, string> = {
  very_low: '极低', low: '偏低', average: '中等', high: '偏高', very_high: '极高',
};

const LEVEL_COLORS: Record<string, string> = {
  very_low: 'bg-red-100 text-red-700',
  low: 'bg-orange-100 text-orange-700',
  average: 'bg-gray-100 text-[var(--text-secondary)]',
  high: 'bg-blue-100 text-blue-700',
  very_high: 'bg-purple-100 text-purple-700',
};

function FacetBar({ profile }: { profile: FacetProfile }) {
  const [expanded, setExpanded] = useState(false);
  const barColor = profile.score >= 65 ? 'bg-[var(--accent-blue)]' : profile.score <= 35 ? 'bg-[var(--accent-red)]' : 'bg-[var(--bg-alt)]';

  return (
    <div className="border-b border-[var(--border-color)] last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{profile.name}</span>
            <div className="flex items-center gap-2">
              <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${LEVEL_COLORS[profile.level]}`}>
                {LEVEL_LABELS[profile.level]}
              </span>
              <span className="font-display text-sm font-bold">{profile.score}</span>
            </div>
          </div>
          <div className="mt-1.5 h-2 w-full border-2 border-[var(--border-color)] bg-[var(--bg-primary)]">
            <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${profile.score}%` }} />
          </div>
        </div>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <p className="pb-3 text-xs leading-relaxed text-[var(--text-secondary)] animate-fade-in-up">
          {profile.interpretation}
        </p>
      )}
    </div>
  );
}

export function Result() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { history, clearCurrentAnswers } = useAppStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'career' | 'relationship' | 'growth'>('career');

  const record = id
    ? history.find((r) => r.id === id)
    : history[0];

  useEffect(() => {
    if (!record) {
      navigate('/');
    }
  }, [record, navigate]);

  if (!record) return null;

  const model: PersonalityModel = buildPersonalityModel(record.scores);
  const scoresMap: Record<Domain, number> = {
    O: record.scores.openness,
    C: record.scores.conscientiousness,
    E: record.scores.extraversion,
    A: record.scores.agreeableness,
    N: record.scores.neuroticism,
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
    <main className="animate-fade-in-up px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div ref={reportRef} className="bg-[var(--bg-primary)] p-3 sm:p-6 lg:p-10">
          <div className="bauhaus-card p-5 sm:p-8 lg:p-12">
            {/* ── 人格原型 ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  BFI-2 人格建模报告
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl lg:text-5xl">
                  {model.archetype.name}
                </h1>
                <p className="mt-1 text-sm italic text-[var(--text-secondary)] sm:text-base">
                  「{model.archetype.tagline}」
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm sm:mt-2">
                  测试时间：{dateStr}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[var(--border-color)] bg-[var(--accent-yellow)] sm:h-16 sm:w-16">
                <span className="font-display text-xl font-bold sm:text-2xl">BFI</span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed sm:text-base sm:mt-6">
              {model.archetype.description}
            </p>

            {/* 优势与注意 */}
            <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2">
              <div className="border-2 border-[var(--accent-blue)] p-3 sm:p-4">
                <h3 className="flex items-center gap-2 font-display text-xs font-bold uppercase text-[var(--accent-blue)] sm:text-sm">
                  <Sparkles size={14} /> 核心优势
                </h3>
                <ul className="mt-2 space-y-1">
                  {model.archetype.strengths.map((s) => (
                    <li key={s} className="text-xs sm:text-sm">+ {s}</li>
                  ))}
                </ul>
              </div>
              <div className="border-2 border-[var(--accent-red)] p-3 sm:p-4">
                <h3 className="flex items-center gap-2 font-display text-xs font-bold uppercase text-[var(--accent-red)] sm:text-sm">
                  <Target size={14} /> 需要注意
                </h3>
                <ul className="mt-2 space-y-1">
                  {model.archetype.watchouts.map((w) => (
                    <li key={w} className="text-xs text-[var(--text-secondary)] sm:text-sm">! {w}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 主导特质标签 */}
            <div className="mt-4 sm:mt-6">
              <h3 className="font-display text-xs font-bold uppercase sm:text-sm">你的突出特质</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {model.dominantTraits.map((t) => (
                  <span key={t} className="border-2 border-[var(--border-color)] bg-[var(--bg-alt)] px-3 py-1 font-display text-xs font-bold uppercase sm:text-sm">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* ── 雷达图 + 维度分数 ── */}
            <div className="mt-6 grid items-center gap-6 sm:mt-10 sm:gap-8 lg:grid-cols-2 lg:gap-10">
              <div className="flex justify-center">
                <RadarChart scores={scoresMap} size={280} className="sm:hidden" />
                <RadarChart scores={scoresMap} size={320} className="hidden sm:block lg:hidden" />
                <RadarChart scores={scoresMap} size={360} className="hidden lg:block" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-wide sm:text-xl">
                  五维度百分位分数
                </h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  分数基于 BFI-2 常模转换为百分位，表示你在人群中的相对位置
                </p>
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

            {/* ── 子维度剖面 ── */}
            <div className="mt-8 border-t-2 border-[var(--border-color)] pt-6 sm:mt-10 sm:pt-8">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide sm:text-xl">
                15 子维度剖面分析
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                每个维度包含3个子维度，点击查看详细解读
              </p>
              <div className="mt-4">
                {DOMAIN_ORDER.map((domain) => {
                  const info = DOMAINS[domain];
                  const facetKeys = FACETS[domain].map((f) => f.key);
                  const domainProfiles = model.facetProfiles.filter((f) => facetKeys.includes(f.facet));

                  return (
                    <div key={domain} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="flex h-6 w-6 items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: info.color }}
                        >
                          {domain}
                        </div>
                        <span className="font-display text-sm font-bold uppercase">{info.name}</span>
                      </div>
                      <div className="pl-8">
                        {domainProfiles.map((profile) => (
                          <FacetBar key={profile.facet} profile={profile} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 深度分析标签页 ── */}
            <div className="mt-8 border-t-2 border-[var(--border-color)] pt-6 sm:mt-10 sm:pt-8">
              <div className="flex gap-1 border-b-2 border-[var(--border-color)]">
                {[
                  { key: 'career' as const, label: '职业匹配', icon: Briefcase },
                  { key: 'relationship' as const, label: '人际动力学', icon: Heart },
                  { key: 'growth' as const, label: '成长路径', icon: TrendingUp },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold uppercase transition-colors sm:text-sm ${
                      activeTab === key
                        ? 'border-[var(--accent-yellow)] text-[var(--text-primary)]'
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 sm:mt-6">
                {activeTab === 'career' && (
                  <div className="animate-fade-in-up">
                    <h3 className="font-display text-sm font-bold uppercase sm:text-base">职业匹配度排名</h3>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      基于你的人格剖面与职业理想剖面的匹配度计算
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {model.careerMatches.map((career, i) => (
                        <div key={career.title} className="bauhaus-card-sm p-3 sm:p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-display text-xs font-bold text-[var(--text-secondary)]">
                                #{i + 1}
                              </span>
                              <h4 className="font-display text-sm font-bold sm:text-base">
                                {career.title}
                              </h4>
                              <span className="text-[10px] text-[var(--text-secondary)] uppercase">
                                {career.category}
                              </span>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="font-display text-xl font-bold sm:text-2xl">
                                {career.matchScore}
                              </span>
                              <span className="text-xs text-[var(--text-secondary)]">%</span>
                            </div>
                          </div>
                          <div className="mt-2 h-2 w-full border-2 border-[var(--border-color)] bg-[var(--bg-primary)]">
                            <div
                              className="h-full bg-[var(--accent-yellow)] transition-all duration-500"
                              style={{ width: `${career.matchScore}%` }}
                            />
                          </div>
                          <p className="mt-2 text-[10px] leading-relaxed text-[var(--text-secondary)] sm:text-xs">
                            {career.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'relationship' && (
                  <div className="animate-fade-in-up">
                    <h3 className="font-display text-sm font-bold uppercase sm:text-base">
                      你的关系风格：{model.relationshipDynamics.style}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed">
                      {model.relationshipDynamics.description}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="border-2 border-green-300 bg-green-50 p-3 sm:p-4 dark:bg-green-950/20">
                        <h4 className="font-display text-xs font-bold uppercase text-green-700 sm:text-sm">最佳匹配</h4>
                        <ul className="mt-2 space-y-1">
                          {model.relationshipDynamics.bestMatch.map((m) => (
                            <li key={m} className="text-xs sm:text-sm">+ {m}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="border-2 border-orange-300 bg-orange-50 p-3 sm:p-4 dark:bg-orange-950/20">
                        <h4 className="font-display text-xs font-bold uppercase text-orange-700 sm:text-sm">挑战匹配</h4>
                        <ul className="mt-2 space-y-1">
                          {model.relationshipDynamics.challengeMatch.map((m) => (
                            <li key={m} className="text-xs text-[var(--text-secondary)] sm:text-sm">! {m}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 border-2 border-[var(--border-color)] p-3 sm:p-4">
                      <h4 className="font-display text-xs font-bold uppercase sm:text-sm">关系建议</h4>
                      <ul className="mt-2 space-y-2">
                        {model.relationshipDynamics.tips.map((tip) => (
                          <li key={tip} className="text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                            &rarr; {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'growth' && (
                  <div className="animate-fade-in-up">
                    <div className="border-2 border-[var(--accent-yellow)] bg-[var(--accent-yellow)]/5 p-4 sm:p-6">
                      <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase sm:text-base">
                        <TrendingUp size={16} /> 成长边缘
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed sm:text-base">
                        {model.growthEdge}
                      </p>
                    </div>

                    <div className="mt-4 sm:mt-6">
                      <h3 className="font-display text-sm font-bold uppercase sm:text-base">各维度发展建议</h3>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        基于你的子维度剖面，针对每个维度最需要发展的子维度给出具体建议
                      </p>
                      <div className="mt-3 grid gap-3">
                        {DOMAIN_ORDER.map((domain) => {
                          const info = DOMAINS[domain];
                          const score = scoresMap[domain];
                          const facetKeys = FACETS[domain].map((f) => f.key);
                          const domainProfiles = model.facetProfiles.filter((f) => facetKeys.includes(f.facet));
                          const weakest = [...domainProfiles].sort((a, b) => a.score - b.score)[0];
                          const strongest = [...domainProfiles].sort((a, b) => b.score - a.score)[0];

                          return (
                            <div key={domain} className="bauhaus-card-sm p-3 sm:p-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex h-8 w-8 items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: info.color }}
                                >
                                  {domain}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-display text-sm font-bold uppercase">{info.name}</h4>
                                  <p className="text-[10px] text-[var(--text-secondary)]">
                                    百分位 {score}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <div className="border-l-2 border-[var(--accent-red)] pl-2">
                                  <p className="text-[10px] font-bold uppercase text-[var(--accent-red)]">发展空间</p>
                                  <p className="text-xs font-medium">{weakest?.name} ({weakest?.score})</p>
                                  <p className="text-[10px] leading-relaxed text-[var(--text-secondary)] mt-0.5">{weakest?.interpretation}</p>
                                </div>
                                <div className="border-l-2 border-[var(--accent-blue)] pl-2">
                                  <p className="text-[10px] font-bold uppercase text-[var(--accent-blue)]">核心优势</p>
                                  <p className="text-xs font-medium">{strongest?.name} ({strongest?.score})</p>
                                  <p className="text-[10px] leading-relaxed text-[var(--text-secondary)] mt-0.5">{strongest?.interpretation}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 方法论说明 ── */}
            <div className="mt-8 border-t-2 border-[var(--border-color)] pt-6 sm:mt-10 sm:pt-8">
              <h2 className="font-display text-sm font-bold uppercase sm:text-base">方法论说明</h2>
              <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)] sm:text-sm">
                <li>分数基于 BFI-2 常模（Soto & John, 2017）通过正态 CDF 转换为百分位，表示你在人群中的相对位置</li>
                <li>人格原型基于五维度组合模式识别，共10种原型</li>
                <li>职业匹配基于理想剖面与容差算法，匹配度越高说明你的人格特质与该职业的典型从业者越相似</li>
                <li>人格具有相对稳定性，但也会随年龄、经历和情境而变化。测试结果仅供参考，不构成临床诊断</li>
              </ul>
            </div>
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
