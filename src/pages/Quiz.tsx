import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OPTIONS, QUESTIONS } from '@/data/questions';
import { useAppStore } from '@/store/useAppStore';
import { isComplete } from '@/utils/scoring';

export function Quiz() {
  const navigate = useNavigate();
  const { currentAnswers, setAnswer, clearCurrentAnswers, submitTest } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  const question = QUESTIONS[currentIndex];
  const selected = currentAnswers[question.id];
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '5') {
        setAnswer(question.id, parseInt(e.key, 10));
        setShowWarning(false);
        if (currentIndex < QUESTIONS.length - 1) {
          setTimeout(() => {
            setDirection(1);
            setCurrentIndex((i) => i + 1);
          }, 200);
        }
      } else if (e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question.id, currentIndex, currentAnswers]);

  const handleSelect = (value: number) => {
    setAnswer(question.id, value);
    setShowWarning(false);
    if (currentIndex < QUESTIONS.length - 1) {
      setTimeout(() => {
        setDirection(1);
        setCurrentIndex((i) => i + 1);
      }, 250);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    if (selected === undefined) {
      setShowWarning(true);
      return;
    }
    if (currentIndex < QUESTIONS.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    if (!isComplete(currentAnswers)) {
      setShowWarning(true);
      return;
    }
    const record = submitTest();
    if (record) {
      navigate(`/result/${record.id}`);
    }
  };

  const handleRestart = () => {
    clearCurrentAnswers();
    setCurrentIndex(0);
    setDirection(0);
  };

  return (
    <main className="animate-fade-in-up px-6 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between font-display text-sm font-bold uppercase tracking-wide">
            <span>
              第 {currentIndex + 1} / {QUESTIONS.length} 题
            </span>
            <span className="text-[var(--text-secondary)]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="mt-3 h-4 w-full border-2 border-[var(--border-color)] bg-[var(--bg-card)]">
            <div
              className="h-full bg-[var(--accent-blue)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div
          className={`bauhaus-card p-8 sm:p-12 ${
            direction > 0 ? 'animate-slide-in-right' : direction < 0 ? 'animate-slide-in-left' : ''
          }`}
          onAnimationEnd={() => setDirection(0)}
        >
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            BFI-2 量表
          </p>
          <h2 className="mt-6 font-display text-2xl font-bold leading-snug sm:text-3xl">
            {question.text}
          </h2>

          <div className="mt-10 grid gap-3">
            {OPTIONS.map((option) => {
              const active = selected === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center justify-between border-2 p-4 text-left transition-all ${
                    active
                      ? 'border-[var(--border-color)] bg-[var(--bg-alt)] text-[var(--text-inverse)]'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:-translate-x-1 hover:-translate-y-1'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  <span
                    className={`font-display text-sm font-bold ${
                      active ? 'text-[var(--text-inverse)]' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {option.value}
                  </span>
                </button>
              );
            })}
          </div>

          {showWarning && (
            <p className="mt-4 text-sm font-medium text-[var(--accent-red)] animate-fade-in-up">
              请先选择一个选项，或使用键盘数字键 1-5 作答。
            </p>
          )}

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between border-t-2 border-[var(--border-color)] pt-6">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="bauhaus-btn-secondary flex items-center gap-2 px-5 py-3 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
              上一题
            </button>

            <button
              onClick={handleRestart}
              className="text-sm font-medium text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--text-primary)]"
            >
              重新开始
            </button>

            {currentIndex < QUESTIONS.length - 1 ? (
              <button
                onClick={handleNext}
                className="bauhaus-btn flex items-center gap-2 px-5 py-3"
              >
                下一题
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={finishTest}
                className="bauhaus-btn bauhaus-btn-yellow flex items-center gap-2 px-5 py-3"
              >
                查看结果
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          提示：可使用键盘 1-5 选择答案，Enter 进入下一题
        </p>
      </div>
    </main>
  );
}
