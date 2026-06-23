import { useState, useEffect, useRef } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number; // ms per character
  className?: string;
  onComplete?: () => void;
}

export function StreamingText({
  text,
  speed = 30,
  className = '',
  onComplete,
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;

    if (!text) return;

    const animate = () => {
      if (indexRef.current < text.length) {
        // Add next character
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current++;

        // Variable speed: pause longer on punctuation
        const char = text[indexRef.current - 1];
        let delay = speed;
        if (char === '。' || char === '，' || char === '；' || char === '！' || char === '？') {
          delay = speed * 4; // Pause on Chinese punctuation
        } else if (char === '.' || char === ',' || char === ';' || char === '!' || char === '?') {
          delay = speed * 3;
        } else if (char === '\n') {
          delay = speed * 5;
        }

        timerRef.current = window.setTimeout(animate, delay);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };

    // Start with a small initial delay
    timerRef.current = window.setTimeout(animate, 200);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-[2px] h-[1em] bg-[var(--accent-blue)] animate-pulse ml-[1px] align-text-bottom" />
      )}
    </span>
  );
}
