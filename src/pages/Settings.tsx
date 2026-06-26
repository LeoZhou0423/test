import { useState, useRef, useCallback } from 'react';
import { Moon, Sun, Type, Download, Trash2, Key, Eye, EyeOff, Upload, RotateCcw, Globe } from 'lucide-react';
import { useAppStore, type TestRecord } from '@/store/useAppStore';
import { exportDataToJSON } from '@/utils/export';

export function Settings() {
  const { settings, updateSettings, history, clearHistory, importData } = useAppStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [proxyUrlInput, setProxyUrlInput] = useState(settings.proxyUrl);
  const [apiKeyInput, setApiKeyInput] = useState(settings.deepseekApiKey);
  const [corsProxyInput, setCorsProxyInput] = useState(settings.corsProxy);
  const [showLocalFallback, setShowLocalFallback] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasBuiltinKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEEPSEEK_API_KEY as string;

  const handleExportData = () => {
    exportDataToJSON(
      {
        exportedAt: Date.now(),
        history,
        settings,
      },
    );
  };

  const handleImportData = useCallback((file: File) => {
    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const data = JSON.parse(raw);

        // Validate structure
        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid format');
        }

        const importPayload: { history?: TestRecord[]; settings?: Partial<typeof settings> } = {};

        if (data.settings && typeof data.settings === 'object') {
          importPayload.settings = data.settings;
        }
        if (Array.isArray(data.history)) {
          importPayload.history = data.history;
        }

        importData(importPayload);
        setImportSuccess(true);
      } catch {
        setImportError('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
  }, [importData]);

  const handleResetDefaults = () => {
    updateSettings({
      darkMode: false,
      fontSize: 'medium',
      proxyUrl: '',
      deepseekApiKey: '',
      corsProxy: '',
    });
    setProxyUrlInput('');
    setApiKeyInput('');
    setCorsProxyInput('');
    setResetConfirm(false);
  };

  const handleClearData = () => {
    clearHistory();
    updateSettings({ darkMode: false, fontSize: 'medium' });
    setClearConfirm(false);
  };

  return (
    <main className="animate-fade-in-up px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl lg:text-4xl">
          设置
        </h1>
        <p className="mt-2 text-xs text-[var(--text-secondary)] sm:text-sm">
          管理你的界面偏好与本地数据
        </p>

        {/* Appearance */}
        <section className="mt-8">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            界面设置
          </h2>
          <div className="mt-4 bauhaus-card-sm p-5 sm:p-6">
            {/* Dark mode toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                <div>
                  <p className="font-medium text-sm sm:text-base">深色模式</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    切换浅色 / 深色主题
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                className={`relative h-7 w-12 border-2 border-[var(--border-color)] transition-colors ${
                  settings.darkMode ? 'bg-[var(--bg-alt)]' : 'bg-[var(--bg-primary)]'
                }`}
                role="switch"
                aria-checked={settings.darkMode}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 border-2 border-[var(--border-color)] bg-[var(--bg-card)] transition-all ${
                    settings.darkMode ? 'left-[calc(100%-1.4rem)]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="mt-5 border-t-2 border-[var(--border-color)] pt-5">
              <div className="flex items-center gap-3">
                <Type size={18} />
                <div>
                  <p className="font-medium text-sm sm:text-base">字体大小</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    调整应用全局字体尺寸
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 sm:gap-3">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateSettings({ fontSize: size })}
                    className={`flex-1 border-2 py-2 text-xs font-medium transition-colors sm:text-sm ${
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

            <div className="mt-5 border-t-2 border-[var(--border-color)] pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RotateCcw size={18} />
                  <div>
                    <p className="font-medium text-sm sm:text-base">恢复默认</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      重置所有设置到默认值
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResetConfirm(true)}
                  className="bauhaus-btn-secondary px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                >
                  重置
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* AI API Configuration */}
        <section className="mt-8">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            AI 配置
          </h2>
          <div className="mt-4 bauhaus-card-sm p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Globe size={18} className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">Worker 代理（推荐）</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  API Key 存储在服务端，不暴露给浏览器
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={proxyUrlInput}
                    onChange={(e) => setProxyUrlInput(e.target.value)}
                    placeholder="https://self-ai-proxy.你的用户名.workers.dev"
                    className="flex-1 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs sm:text-sm"
                  />
                  <button
                    onClick={() => updateSettings({ proxyUrl: proxyUrlInput })}
                    className="bauhaus-btn-secondary px-3 py-2 text-xs sm:px-4 sm:text-sm"
                  >
                    保存
                  </button>
                </div>

                {/* Local dev fallback — collapsed by default */}
                <button
                  onClick={() => setShowLocalFallback(!showLocalFallback)}
                  className="mt-3 flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <Key size={12} />
                  {showLocalFallback ? '收起本地开发备用配置' : '本地开发备用（API Key 直连）'}
                </button>

                {showLocalFallback && (
                  <div className="mt-3 p-3 border-2 border-dashed border-[var(--border-color)]">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder="输入 DeepSeek API Key"
                          className="w-full border-2 border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 pr-10 text-xs sm:text-sm"
                        />
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        onClick={() => updateSettings({ deepseekApiKey: apiKeyInput })}
                        className="bauhaus-btn-secondary px-3 py-2 text-xs sm:px-4 sm:text-sm"
                      >
                        保存
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      API Key 仅保存在内存中，刷新页面后需重新输入
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-xs text-[var(--text-secondary)]">CORS 代理（解决跨域问题）</p>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={corsProxyInput}
                      onChange={(e) => setCorsProxyInput(e.target.value)}
                      placeholder="https://corsproxy.io/?"
                      className="flex-1 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs sm:text-sm"
                    />
                    <button
                      onClick={() => updateSettings({ corsProxy: corsProxyInput })}
                      className="bauhaus-btn-secondary px-3 py-2 text-xs sm:px-4 sm:text-sm"
                    >
                      保存
                    </button>
                  </div>
                </div>

                {(settings.proxyUrl || settings.deepseekApiKey || hasBuiltinKey) && (
                  <p className="mt-3 text-xs text-emerald-600">
                    ✓ AI 服务已配置
                    {hasBuiltinKey && !settings.proxyUrl && !settings.deepseekApiKey
                      ? '（内建 API Key，开箱即用）'
                      : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="mt-8">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            数据管理
          </h2>
          <div className="mt-4 bauhaus-card-sm p-5 sm:p-6">
            {/* Export */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Download size={18} />
                <div>
                  <p className="font-medium text-sm sm:text-base">导出数据</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    将历史记录与设置导出为 JSON 文件
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportData}
                className="bauhaus-btn-secondary px-4 py-2 text-xs sm:px-5 sm:text-sm"
              >
                导出 JSON
              </button>
            </div>

            {/* Import */}
            <div className="mt-5 flex flex-col gap-4 border-t-2 border-[var(--border-color)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Upload size={18} />
                <div>
                  <p className="font-medium text-sm sm:text-base">导入数据</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    从 JSON 文件恢复历史记录与设置
                  </p>
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bauhaus-btn-secondary px-4 py-2 text-xs sm:px-5 sm:text-sm"
              >
                选择文件
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportData(file);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </div>

            {importError && (
              <p className="mt-3 text-xs text-[var(--accent-red)]">{importError}</p>
            )}
            {importSuccess && (
              <p className="mt-3 text-xs text-emerald-600">导入成功，页面即将刷新</p>
            )}

            {/* Clear */}
            <div className="mt-5 flex flex-col gap-4 border-t-2 border-[var(--border-color)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Trash2 size={18} className="text-[var(--accent-red)]" />
                <div>
                  <p className="font-medium text-sm sm:text-base">清除所有数据</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    删除所有本地历史记录与设置
                  </p>
                </div>
              </div>
              <button
                onClick={() => setClearConfirm(true)}
                className="bauhaus-btn bauhaus-btn-red px-4 py-2 text-xs sm:px-5 sm:text-sm"
              >
                清除数据
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Reset Confirm Modal */}
      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setResetConfirm(false)} />
          <div className="relative bauhaus-card p-5 max-w-sm w-full sm:p-6">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide">恢复默认设置</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              确定要重置所有设置到默认值吗？此操作不会删除历史记录。
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setResetConfirm(false)} className="bauhaus-btn-secondary flex-1 px-4 py-2 text-sm">
                取消
              </button>
              <button onClick={handleResetDefaults} className="bauhaus-btn flex-1 px-4 py-2 text-sm">
                重置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirm Modal */}
      {clearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setClearConfirm(false)} />
          <div className="relative bauhaus-card p-5 max-w-sm w-full sm:p-6">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--accent-red)]">
              清除所有数据
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              确定要删除所有本地历史记录和设置吗？此操作无法撤销。
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setClearConfirm(false)} className="bauhaus-btn-secondary flex-1 px-4 py-2 text-sm">
                取消
              </button>
              <button onClick={handleClearData} className="bauhaus-btn bauhaus-btn-red flex-1 px-4 py-2 text-sm">
                清除
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
