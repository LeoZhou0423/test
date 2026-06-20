import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, GitCompare, X } from 'lucide-react';
import { RadarChart } from '@/components/RadarChart';
import { useAppStore, type TestRecord } from '@/store/useAppStore';
import { DOMAINS, type Domain } from '@/data/questions';

const DOMAIN_ORDER: Domain[] = ['O', 'C', 'E', 'A', 'N'];

function RecordCard({
  record,
  selected,
  onSelect,
  onView,
  onDelete,
}: {
  record: TestRecord;
  selected: boolean;
  onSelect: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const scoresMap: Record<Domain, number> = {
    O: record.scores.openness,
    C: record.scores.conscientiousness,
    E: record.scores.extraversion,
    A: record.scores.agreeableness,
    N: record.scores.neuroticism,
  };

  const dateStr = new Date(record.createdAt).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`bauhaus-card-sm p-5 transition-all ${
        selected ? 'ring-2 ring-[var(--accent-blue)]' : ''
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex justify-center sm:w-32">
          <RadarChart scores={scoresMap} size={120} animated={false} />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-[var(--text-secondary)]">
            {dateStr}
          </p>
          <div className="mt-2 grid grid-cols-5 gap-1 text-center">
            {DOMAIN_ORDER.map((d) => (
              <div key={d}>
                <div className="font-display text-xs font-bold">{DOMAINS[d].name.slice(0, 1)}</div>
                <div className="text-sm font-semibold">{scoresMap[d]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-col">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="h-5 w-5 accent-[var(--accent-blue)]"
            aria-label="选择对比"
          />
          <button
            onClick={onView}
            className="flex items-center gap-1 border-2 border-[var(--border-color)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--bg-primary)]"
          >
            <Eye size={14} />
            查看
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 border-2 border-[var(--border-color)] px-3 py-1.5 text-sm font-medium text-[var(--accent-red)] transition-colors hover:bg-[var(--bg-primary)]"
          >
            <Trash2 size={14} />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

function ComparisonView({
  records,
  onClose,
}: {
  records: TestRecord[];
  onClose: () => void;
}) {
  return (
    <div className="bauhaus-card p-6 animate-scale-in">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">
          结果对比
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-[var(--bg-primary)]">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-[var(--border-color)]">
              <th className="py-3 font-display uppercase">维度</th>
              {records.map((r) => (
                <th key={r.id} className="py-3 font-display uppercase">
                  {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DOMAIN_ORDER.map((domain) => (
              <tr key={domain} className="border-b border-[var(--border-color)]">
                <td className="py-3 font-medium">{DOMAINS[domain].name}</td>
                {records.map((r) => {
                  const score = {
                    O: r.scores.openness,
                    C: r.scores.conscientiousness,
                    E: r.scores.extraversion,
                    A: r.scores.agreeableness,
                    N: r.scores.neuroticism,
                  }[domain];
                  return (
                    <td key={r.id} className="py-3 font-display font-bold">
                      {score}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function History() {
  const navigate = useNavigate();
  const { history, deleteRecord, clearHistory } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedRecords = history.filter((r) => selectedIds.includes(r.id));

  return (
    <main className="animate-fade-in-up px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              历史记录
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              共 {history.length} 条测试记录，数据仅存储在本地
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`bauhaus-btn-secondary flex items-center gap-2 px-4 py-2 text-sm ${
                compareMode ? 'bg-[var(--bg-alt)] text-[var(--text-inverse)]' : ''
              }`}
            >
              <GitCompare size={16} />
              {compareMode ? '取消对比' : '对比'}
            </button>
            <button
              onClick={() => {
                if (confirm('确定要清空所有历史记录吗？此操作无法撤销。')) {
                  clearHistory();
                  setSelectedIds([]);
                }
              }}
              className="bauhaus-btn-secondary flex items-center gap-2 px-4 py-2 text-sm text-[var(--accent-red)]"
            >
              <Trash2 size={16} />
              清空
            </button>
          </div>
        </div>

        {compareMode && selectedRecords.length > 0 && (
          <div className="mb-8">
            <ComparisonView
              records={selectedRecords}
              onClose={() => setCompareMode(false)}
            />
          </div>
        )}

        {history.length === 0 ? (
          <div className="bauhaus-card p-12 text-center">
            <p className="text-[var(--text-secondary)]">暂无测试记录</p>
            <button
              onClick={() => navigate('/quiz')}
              className="bauhaus-btn mt-6 px-6 py-3"
            >
              开始第一次测试
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                selected={selectedIds.includes(record.id)}
                onSelect={() => toggleSelect(record.id)}
                onView={() => navigate(`/result/${record.id}`)}
                onDelete={() => {
                  if (confirm('确定删除这条记录吗？')) {
                    deleteRecord(record.id);
                    setSelectedIds((prev) => prev.filter((id) => id !== record.id));
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
