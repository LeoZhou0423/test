import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Welcome } from '@/pages/Welcome';
import { Quiz } from '@/pages/Quiz';
import { Result } from '@/pages/Result';
import { History } from '@/pages/History';
import { Settings } from '@/pages/Settings';
import { useAppStore } from '@/store/useAppStore';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { darkMode, fontSize } = useAppStore((state) => state.settings);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.fontSize = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
  }, [darkMode, fontSize]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
          <Header />
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/result" element={<Result />} />
            <Route path="/result/:id" element={<Result />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
}
