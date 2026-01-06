'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'light'
            ? 'bg-[var(--primary)] text-white'
            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
        }`}
        title="Light Mode"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'dark'
            ? 'bg-[var(--primary)] text-white'
            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
        }`}
        title="Dark Mode"
      >
        <Moon size={16} />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'system'
            ? 'bg-[var(--primary)] text-white'
            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
        }`}
        title="System Theme"
      >
        <Monitor size={16} />
      </button>
    </div>
  );
}
