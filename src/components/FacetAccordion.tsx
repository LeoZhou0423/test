import { FACETS, DOMAINS, type Domain } from '@/data/questions';
import { DOMAIN_ADVICE, DOMAIN_EXAMPLES } from '@/data/descriptions';
import { getDomainScore, getFacetScore, type DomainScores } from '@/utils/scoring';

interface FacetDetailProps {
  domain: Domain;
  scores: DomainScores;
}

export function FacetAccordion({ domain, scores }: FacetDetailProps) {
  const info = DOMAINS[domain];
  const score = getDomainScore(scores, domain);
  const advice = DOMAIN_ADVICE[domain];
  const examples = DOMAIN_EXAMPLES[domain];
  const isHigh = score >= 50;

  return (
    <div className="bauhaus-card-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 sm:p-5 sm:gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center font-display text-lg font-bold text-white sm:h-12 sm:w-12 sm:text-xl"
          style={{ backgroundColor: info.color }}
        >
          {domain}
        </div>
        <div>
          <h3 className="font-display text-base font-bold uppercase tracking-wide sm:text-lg">
            {info.name}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] sm:text-sm">
            得分 {score} · {isHigh ? '较高' : '较低'}
          </p>
        </div>
      </div>

      {/* Content - Always visible */}
      <div className="border-t-2 border-[var(--border-color)] p-4 sm:p-5">
        <p className="text-sm leading-relaxed sm:text-base">
          {isHigh ? advice.high : advice.low}
        </p>

        <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 sm:grid-cols-2">
          <div className="bg-[var(--bg-primary)] p-3 sm:p-4">
            <h4 className="font-display text-xs font-bold uppercase sm:text-sm">典型表现</h4>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[var(--text-secondary)] sm:text-sm">
              {(isHigh ? examples.high : examples.low).map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          </div>
          <div className="bg-[var(--bg-primary)] p-3 sm:p-4">
            <h4 className="font-display text-xs font-bold uppercase sm:text-sm">发展建议</h4>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
              {advice.growth}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2">
          <div className="border-2 border-[var(--border-color)] p-3 sm:p-4">
            <h4 className="font-display text-xs font-bold uppercase text-[var(--accent-blue)] sm:text-sm">
              职业建议
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
              {advice.career}
            </p>
          </div>
          <div className="border-2 border-[var(--border-color)] p-3 sm:p-4">
            <h4 className="font-display text-xs font-bold uppercase text-[var(--accent-red)] sm:text-sm">
              人际建议
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
              {advice.relationship}
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-5">
          <h4 className="font-display text-xs font-bold uppercase sm:text-sm">子维度得分</h4>
          <div className="mt-3 grid gap-3">
            {FACETS[domain].map((facet) => {
              const facetScore = getFacetScore(scores, facet.key);
              return (
                <div key={facet.key}>
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="font-medium">{facet.name}</span>
                    <span className="font-display shrink-0 font-bold">{facetScore}</span>
                  </div>
                  <div className="mt-1 h-2 w-full border-2 border-[var(--border-color)] bg-[var(--bg-primary)] sm:h-3">
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
    </div>
  );
}
