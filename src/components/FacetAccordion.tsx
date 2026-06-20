import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FACETS, DOMAINS, type Domain } from '@/data/questions';
import { DOMAIN_ADVICE, DOMAIN_EXAMPLES } from '@/data/descriptions';
import { getDomainScore, getFacetScore, type DomainScores } from '@/utils/scoring';

interface FacetAccordionProps {
  domain: Domain;
  scores: DomainScores;
}

export function FacetAccordion({ domain, scores }: FacetAccordionProps) {
  const [open, setOpen] = useState(false);
  const info = DOMAINS[domain];
  const score = getDomainScore(scores, domain);
  const advice = DOMAIN_ADVICE[domain];
  const examples = DOMAIN_EXAMPLES[domain];
  const isHigh = score >= 50;

  return (
    <div className="bauhaus-card-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center font-display text-xl font-bold text-white"
            style={{ backgroundColor: info.color }}
          >
            {domain}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold uppercase tracking-wide">
              {info.name}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              得分 {score} · {isHigh ? '较高' : '较低'}
            </p>
          </div>
        </div>
        <ChevronDown
          size={24}
          className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t-2 border-[var(--border-color)] p-5 animate-fade-in-up">
          <p className="text-base leading-relaxed">
            {isHigh ? advice.high : advice.low}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="bg-[var(--bg-primary)] p-4">
              <h4 className="font-display text-sm font-bold uppercase">典型表现</h4>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[var(--text-secondary)]">
                {(isHigh ? examples.high : examples.low).map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>
            <div className="bg-[var(--bg-primary)] p-4">
              <h4 className="font-display text-sm font-bold uppercase">发展建议</h4>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {advice.growth}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="border-2 border-[var(--border-color)] p-4">
              <h4 className="font-display text-sm font-bold uppercase text-[var(--accent-blue)]">
                职业建议
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {advice.career}
              </p>
            </div>
            <div className="border-2 border-[var(--border-color)] p-4">
              <h4 className="font-display text-sm font-bold uppercase text-[var(--accent-red)]">
                人际建议
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {advice.relationship}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <h4 className="font-display text-sm font-bold uppercase">子维度得分</h4>
            <div className="mt-3 grid gap-3">
              {FACETS[domain].map((facet) => {
                const facetScore = getFacetScore(scores, facet.key);
                return (
                  <div key={facet.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{facet.name}</span>
                      <span className="font-display font-bold">{facetScore}</span>
                    </div>
                    <div className="mt-1 h-3 w-full border-2 border-[var(--border-color)] bg-[var(--bg-primary)]">
                      <div
                        className="h-full bg-[var(--bg-alt)] transition-all duration-500"
                        style={{ width: `${facetScore}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {facet.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
