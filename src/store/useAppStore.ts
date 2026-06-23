import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateScores, type DomainScores } from '@/utils/scoring';

export interface TestRecord {
  id: string;
  createdAt: number;
  answers: Record<number, number>;
  scores: DomainScores;
}

export interface AppSettings {
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  mimoApiKey: string;
  mimoBaseUrl: string;
}

interface AppState {
  currentAnswers: Record<number, number>;
  history: TestRecord[];
  settings: AppSettings;

  setAnswer: (questionId: number, value: number) => void;
  clearCurrentAnswers: () => void;
  submitTest: () => TestRecord | null;
  deleteRecord: (id: string) => void;
  clearHistory: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const STORAGE_KEY = 'big-five-test-storage';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentAnswers: {},
      history: [],
      settings: {
        darkMode: false,
        fontSize: 'medium',
        mimoApiKey: '',
        mimoBaseUrl: 'https://api.mimo.ai/v1',
      },

      setAnswer: (questionId, value) =>
        set((state) => ({
          currentAnswers: { ...state.currentAnswers, [questionId]: value },
        })),

      clearCurrentAnswers: () => set({ currentAnswers: {} }),

      submitTest: () => {
        const answers = get().currentAnswers;
        const scores = calculateScores(answers);
        const record: TestRecord = {
          id: generateId(),
          createdAt: Date.now(),
          answers,
          scores,
        };
        set((state) => ({
          history: [record, ...state.history],
          currentAnswers: {},
        }));
        return record;
      },

      deleteRecord: (id) =>
        set((state) => ({
          history: state.history.filter((r) => r.id !== id),
        })),

      clearHistory: () => set({ history: [] }),

      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        history: state.history,
        settings: state.settings,
      }),
    }
  )
);
