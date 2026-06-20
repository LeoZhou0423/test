import { Link } from 'react-router-dom';
import { Shield, Clock, Brain } from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'BFI-2 量表',
    desc: '基于 60 题大五人格量表，覆盖五维度与 15 个子维度。',
  },
  {
    icon: Shield,
    title: '本地存储',
    desc: '所有答案与结果仅保存在你的设备上，不上传服务器。',
  },
  {
    icon: Clock,
    title: '约 10 分钟',
    desc: '认真作答约需 10-15 分钟，结果可随时回看与导出。',
  },
];

export function Welcome() {
  return (
    <main className="animate-fade-in-up">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            {/* Bauhaus decorative shapes */}
            <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[var(--accent-red)] sm:h-32 sm:w-32" />
            <div className="absolute top-24 -left-12 h-16 w-16 bg-[var(--accent-yellow)] sm:top-32" />
            <div className="absolute bottom-0 right-12 h-0 w-0 border-l-[30px] border-r-[30px] border-b-[52px] border-l-transparent border-r-transparent border-b-[var(--accent-blue)]" />

            <div className="bauhaus-card relative p-8 sm:p-12">
              <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Big Five Inventory-2
              </p>
              <h1 className="mt-4 font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl">
                大五人格
                <br />
                <span className="text-[var(--accent-blue)]">测试</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-[var(--text-secondary)]">
                通过 60 道标准化题目，探索你在开放性、尽责性、外向性、宜人性和神经质五个维度上的人格画像。
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/quiz"
                  className="bauhaus-btn inline-block px-8 py-4 text-center"
                >
                  开始测试
                </Link>
                <Link
                  to="/settings"
                  className="bauhaus-btn-secondary inline-block px-8 py-4 text-center"
                >
                  了解更多
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bauhaus-card-sm p-6 transition-transform hover:-translate-x-1 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center border-2 border-[var(--border-color)] bg-[var(--bg-primary)]">
                  <Icon size={24} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Big Five Intro */}
      <section className="border-t-[3px] border-[var(--border-color)] bg-[var(--bg-card)] px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
            什么是大五人格？
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
            大五人格（Big Five）是当代心理学中最具影响力的人格模型之一，将人格特质归纳为五个核心维度。它不是把人分为几种类型，而是描述你在连续谱上的位置。
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: '开放性', color: 'bg-[var(--accent-yellow)]' },
              { label: '尽责性', color: 'bg-[var(--accent-blue)]' },
              { label: '外向性', color: 'bg-[var(--accent-red)]' },
              { label: '宜人性', color: 'bg-emerald-500' },
              { label: '神经质', color: 'bg-violet-500' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 border-2 border-[var(--border-color)] p-3"
              >
                <div className={`h-6 w-6 ${item.color}`} />
                <span className="font-display font-bold uppercase tracking-wide">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
