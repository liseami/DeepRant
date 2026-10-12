/**
 * [INPUT]: 依赖 StoreProvider 文案与语言设置、应用图标
 * [OUTPUT]: 提供页面导航和中文 / English 切换
 * [POS]: Layout 的导航边界，只呈现实际可用的本地功能
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import appIcon from '../assets/app-icon.png';
import { useStore } from './StoreProvider';
import { showError } from '../utils/toast';

const pages = ['home', 'translate', 'phrases', 'settings', 'about'];

export default function Sidebar({ activeItem, setActiveItem }) {
  const { t, locale, updateSettings, settings } = useStore();
  return <aside className="sidebar">
    <div className="brand"><img src={appIcon} alt="" width="40" height="40" /><strong>DeepRant</strong></div>
    <nav aria-label={locale === 'en' ? 'Main navigation' : '主导航'}>
      {pages.map(id => <button type="button" key={id} aria-current={activeItem === id ? 'page' : undefined}
        className={activeItem === id ? 'nav-active' : ''} onClick={() => setActiveItem(id)}>{t(id)}</button>)}
    </nav>
    <div className="language-switch" aria-label="Interface language">
      {['zh', 'en'].map(lang => <button key={lang} type="button" disabled={!settings}
        aria-pressed={locale === lang} onClick={() => updateSettings({ ui_language: lang }).catch(showError)}>
        {lang === 'zh' ? '中文' : 'English'}
      </button>)}
    </div>
  </aside>;
}
