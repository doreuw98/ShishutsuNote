import type { AppLanguage, ViewId } from '../domain/types';
import { t } from '../i18n/messages';

type AppNavigationProps = {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  language: AppLanguage;
};

const items: { id: ViewId; label: string; icon: 'home' | 'history' | 'analysis' | 'settings' }[] = [
  { id: 'home', label: 'ホーム', icon: 'home' },
  { id: 'history', label: '履歴', icon: 'history' },
  { id: 'analysis', label: '分析', icon: 'analysis' },
  { id: 'settings', label: '設定', icon: 'settings' },
];

function NavIcon({ name }: { name: (typeof items)[number]['icon'] }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="nav-icon">
      {name === 'home' && <g {...common}><path d="m3.5 10 8.5-7 8.5 7" /><path d="M5.5 9.5V21h13V9.5" /><path d="M9 21v-6h6v6" /></g>}
      {name === 'history' && <g {...common}><path d="M4.5 7.5h15v13h-15z" /><path d="M8 4.5h12v13" /><path d="M8 11h8M8 15h6" /></g>}
      {name === 'analysis' && <g {...common}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></g>}
      {name === 'settings' && <g {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 2.9-.2-.1a1.7 1.7 0 0 0-1.9.3l-.1.1h-3.4l-.1-.2a1.7 1.7 0 0 0-1.6-1.1 1.7 1.7 0 0 0-.9.3l-.2.1L7 17.5l.1-.2a1.7 1.7 0 0 0-.3-1.9l-.1-.1v-3.4l.2-.1a1.7 1.7 0 0 0 1.1-1.6 1.7 1.7 0 0 0-.3-.9l-.1-.2L9 6.2l.2.1a1.7 1.7 0 0 0 1.9-.3l.1-.1h3.4l.1.2a1.7 1.7 0 0 0 1.6 1.1 1.7 1.7 0 0 0 .9-.3l.2-.1 2.9 1.7-.1.2a1.7 1.7 0 0 0 .3 1.9l.1.1v3.4z" transform="translate(-1 -1) scale(1.08)" /></g>}
    </svg>
  );
}

export function AppNavigation({ activeView, onNavigate, language }: AppNavigationProps) {
  const labels = { home: t(language, 'home'), history: t(language, 'history'), analysis: t(language, 'analysis'), settings: t(language, 'settings') };
  return (
    <>
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); onNavigate('home'); }}>
          <span className="brand-mark" aria-hidden="true">支</span>
          <span><strong>支出ノート</strong><small>{t(language, 'tagline')}</small></span>
        </a>
        <nav aria-label={language === 'ja' ? 'メインメニュー' : 'Main menu'} className="sidebar-nav">
          {items.map((item) => (
            <button
              aria-current={activeView === item.id ? 'page' : undefined}
              className={`nav-item${activeView === item.id ? ' is-active' : ''}`}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <NavIcon name={item.icon} />
              <span>{labels[item.id]}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="storage-dot" aria-hidden="true" />
          <span>{language === 'ja' ? '記録はこのブラウザーに保存' : language === 'en' ? 'Records are saved in this browser' : 'Catatan tersimpan di browser ini'}</span>
        </div>
      </aside>
      <nav aria-label={language === 'ja' ? 'メインメニュー' : 'Main menu'} className="mobile-nav">
        {items.map((item) => (
          <button
            aria-current={activeView === item.id ? 'page' : undefined}
            className={`mobile-nav-item${activeView === item.id ? ' is-active' : ''}`}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <NavIcon name={item.icon} />
            <span>{labels[item.id]}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
