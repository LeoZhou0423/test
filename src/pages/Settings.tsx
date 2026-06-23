import { useState } from 'react';
import { Moon, Sun, Type, Download, Trash2, BookOpen, Github, Key, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { REFERENCES } from '@/data/descriptions';
import { exportDataToJSON } from '@/utils/export';

export function Settings() {
  const { settings, updateSettings, history, clearHistory } = useAppStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(settings.mimoApiKey);
  const [baseUrlInput, setBaseUrlInput] = useState(settings.mimoBaseUrl);

  const handleExportData = () => {
    exportDataToJSON(
      {
        exportedAt: Date.now(),
        history,
        settings,
      },
      'big-five-backup'
    );
  };

  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <main className="animate-fade-in-up px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          设置
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          管理你的界面偏好与本地数据
        </p>

        {/* Appearance */}
        <section className="mt-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            界面设置
          </h2>
          <div className="mt-4 bauhaus-card-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.darkMode ? <Moon size={20} /> : <Sun size={20} />}
                <div>
                  <p className="font-medium">深色模式</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    切换浅色 / 深色主题
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                className={`relative h-8 w-14 border-2 border-[var(--border-color)] transition-colors ${
                  settings.darkMode ? 'bg-[var(--bg-alt)]' : 'bg-[var(--bg-primary)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 border-2 border-[var(--border-color)] bg-[var(--bg-card)] transition-all ${
                    settings.darkMode ? 'left-[calc(100%-1.6rem)]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="mt-6 border-t-2 border-[var(--border-color)] pt-6">
              <div className="flex items-center gap-3">
                <Type size={20} />
                <div>
                  <p className="font-medium">字体大小</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    调整应用全局字体尺寸
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateSettings({ fontSize: size })}
                    className={`flex-1 border-2 py-2 text-sm font-medium transition-colors ${
                      settings.fontSize === size
                        ? 'border-[var(--border-color)] bg-[var(--bg-alt)] text-[var(--text-inverse)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-primary)]'
                    }`}
                  >
                    {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI API Configuration */}
        <section className="mt-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            AI 配置
          </h2>
          <div className="mt-4 bauhaus-card-sm p-6">
            <div className="flex items-start gap-3">
              <Key size={20} className="mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Mimo API Key</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  用于 AI 深度解读功能，支持流式输出
                </p>
                <div className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="输入你的 Mimo API Key"
                      className="w-full border-2 border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 pr-10 text-sm"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    onClick={() => updateSettings({ mimoApiKey: apiKeyInput })}
                    className="bauhaus-btn-secondary px-4 py-2 text-sm"
                  >
                    保存
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-[var(--text-secondary)]">API Base URL</p>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={baseUrlInput}
                      onChange={(e) => setBaseUrlInput(e.target.value)}
                      placeholder="https://api.mimo.ai/v1"
                      className="flex-1 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => updateSettings({ mimoBaseUrl: baseUrlInput })}
                      className="bauhaus-btn-secondary px-4 py-2 text-sm"
                    >
                      保存
                    </button>
                  </div>
                </div>

                {settings.mimoApiKey && (
                  <p className="mt-3 text-xs text-emerald-600">
                    ✓ API Key 已配置，AI 深度解读功能可用
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="mt-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            数据管理
          </h2>
          <div className="mt-4 bauhaus-card-sm p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Download size={20} />
                <div>
                  <p className="font-medium">导出数据</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    将历史记录与设置导出为 JSON 文件
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportData}
                className="bauhaus-btn-secondary px-5 py-2 text-sm"
              >
                导出 JSON
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t-2 border-[var(--border-color)] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Trash2 size={20} className="text-[var(--accent-red)]" />
                <div>
                  <p className="font-medium">清除所有数据</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    删除所有本地历史记录与设置
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('确定清除所有本地数据吗？此操作无法撤销。')) {
                    clearHistory();
                    updateSettings({ darkMode: false, fontSize: 'medium' });
                  }
                }}
                className="bauhaus-btn bauhaus-btn-red px-5 py-2 text-sm"
              >
                清除数据
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="mt-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            关于
          </h2>
          <div className="mt-4 bauhaus-card-sm p-6">
            <div className="flex items-start gap-3">
              <BookOpen size={20} className="mt-0.5" />
              <div>
                <p className="font-medium">量表说明</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  本应用使用简化版 BFI-2（Big Five Inventory-2）60 题结构，包含五大人格维度与 15 个子维度。测试结果仅供自我认知与参考，不能替代专业心理诊断。
                </p>
              </div>
            </div>

            <div className="mt-6 border-t-2 border-[var(--border-color)] pt-6">
              <p className="font-medium">参考文献</p>
              <ul className="mt-3 space-y-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                {REFERENCES.map((ref, idx) => (
                  <li key={idx} className="pl-3 border-l-2 border-[var(--accent-blue)]">
                    {ref}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 border-t-2 border-[var(--border-color)] pt-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
              >
                <Github size={18} />
                开源声明
              </a>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                版本 1.0.0 · 数据本地存储 · 隐私优先
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
