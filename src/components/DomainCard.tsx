import { DOMAINS, type Domain } from '@/data/questions';
import { AnimatedNumber } from './AnimatedNumber';

interface DomainCardProps {
  domain: Domain;
  score: number;
  onClick?: () => void;
}

const DOMAIN_COLORS: Record<Domain, string> = {
  O: 'bg-[var(--accent-yellow)]',
  C: 'bg-[var(--accent-blue)]',
  E: 'bg-[var(--accent-red)]',
  A: 'bg-emerald-500',
  N: 'bg-violet-500',
};

export function DomainCard({ domain, score, onClick }: DomainCardProps) {
  const info = DOMAINS[domain];

  return (
    <button
      onClick={onClick}
      className="bauhaus-card-sm group relative overflow-hidden p-5 text-left transition-transform hover:-translate-x-1 hover:-translate-y-1"
    >
      <div
        className={`absolute left-0 top-0 h-full w-2 ${DOMAIN_COLORS[domain]}`}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wide">
            {info.name}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{info.en}</p>
        </div>
        <div className="font-display text-3xl font-bold">
          <AnimatedNumber value={score} />
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        {info.description}
      </p>
    </button>
  );
}
