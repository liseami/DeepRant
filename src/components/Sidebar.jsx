/**
 * [INPUT]: 依赖 Cromma UI NavButton/Button、Pika 图标、应用品牌图、界面语言与外观设置
 * [OUTPUT]: 提供主页、模式、常用语、模型、关于导航及界面语言、外观切换；外观经 Rust 设置下发原生主题
 * [POS]: Layout 的游戏翻译导航边界，控件皮肤与图标只从 Cromma UI 取得
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Fragment } from 'react';
import { NavButton, Button } from 'cromma-ui';
import { HomeDefault, Translate, MessageDefault, Settings01, MegaphoneAnnouncementShout } from 'cromma-ui/pika';
import appIcon from '../assets/app-icon.png';
import { useStore } from './StoreProvider';
import { showError } from '../utils/toast';

const appearances = [
  { id: 'system', name: '系统', english: 'Auto' },
  { id: 'light', name: '浅色', english: 'Light' },
  { id: 'dark', name: '深色', english: 'Dark' },
];

const sidebarItems = [
  { name: '主页', english: 'Home', icon: HomeDefault, id: 'home' },
  { name: '模式', english: 'Modes', icon: Translate, id: 'translate' },
  { name: '常用语', english: 'Phrases', icon: MessageDefault, id: 'phrases' },
  { name: 'AI模型', english: 'AI models', icon: Settings01, id: 'settings' },
  { name: '关于', english: 'About', icon: MegaphoneAnnouncementShout, id: 'about' },
];

export default function Sidebar({ activeItem, setActiveItem }) {
  const { locale, updateSettings, settings } = useStore();
  return (
    <aside className="app-sidebar">
      <div className="app-brand">
        <img src={appIcon} alt="DeepRant" width="36" height="36" draggable={false} />
        <strong>DeepRant</strong>
      </div>
      <nav aria-label={locale === 'en' ? 'Main navigation' : '主导航'}>
        {sidebarItems.map(item => <Fragment key={item.id}>
          {item.id === 'translate' && <hr className="nav-divider" />}
          <NavButton className="workspace-nav" active={activeItem === item.id}
            aria-current={activeItem === item.id ? 'page' : undefined}
            icon={<item.icon size={18} aria-hidden="true" />} onClick={() => setActiveItem(item.id)}>
            {locale === 'en' ? item.english : item.name}
          </NavButton>
        </Fragment>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="flex gap-1 px-3 pt-3" role="group" aria-label="Interface language">
          {['zh', 'en'].map(lang => <Button key={lang} size="small" variant={locale === lang ? 'selected' : 'ghost'}
            disabled={!settings} aria-pressed={locale === lang}
            onClick={() => updateSettings({ ui_language: lang }).catch(showError)}>{lang === 'zh' ? '中文' : 'English'}</Button>)}
        </div>
        <div className="flex gap-1 px-3 pt-1" role="group" aria-label={locale === 'en' ? 'Appearance' : '外观'}>
          {appearances.map(item => <Button key={item.id} size="small" variant={settings?.appearance === item.id ? 'selected' : 'ghost'}
            disabled={!settings} aria-pressed={settings?.appearance === item.id}
            onClick={() => updateSettings({ appearance: item.id }).catch(showError)}>{locale === 'en' ? item.english : item.name}</Button>)}
        </div>
      </div>
    </aside>
  );
}
