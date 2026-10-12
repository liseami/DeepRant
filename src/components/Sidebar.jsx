/**
 * [INPUT]: 依赖 Cromma UI NavButton/Button、Pika 图标、应用品牌图和界面语言设置
 * [OUTPUT]: 提供 CCBaga 同款极简侧栏，保留 DeepRant 原菜单及未登录入口
 * [POS]: Layout 的游戏翻译导航边界，控件皮肤与图标只从 Cromma UI 取得
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Fragment } from 'react';
import { NavButton, Button } from 'cromma-ui';
import { HomeDefault, Translate, MessageDefault, LightningThunderElectricOn, Settings01, MegaphoneAnnouncementShout, UserRectangle } from 'cromma-ui/pika';
import appIcon from '../assets/app-icon.png';
import { useStore } from './StoreProvider';
import { showError } from '../utils/toast';

const sidebarItems = [
  { name: '主页', english: 'Home', icon: HomeDefault, id: 'home' },
  { name: '模式', english: 'Modes', icon: Translate, id: 'translate' },
  { name: '常用语', english: 'Phrases', icon: MessageDefault, id: 'phrases' },
  { name: '能量', english: 'Energy', icon: LightningThunderElectricOn, id: 'mana' },
  { name: 'AI模型', english: 'AI models', icon: Settings01, id: 'settings' },
  { name: '关于', english: 'About', icon: MegaphoneAnnouncementShout, id: 'about' },
];

export default function Sidebar({ activeItem, setActiveItem }) {
  const { locale, updateSettings, settings } = useStore();
  return (
    <aside className="app-sidebar">
      <div className="app-brand">
        <img src={appIcon} alt="DeepRant" width="36" height="36" draggable={false} className="rounded-xl" />
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
        <NavButton className="workspace-nav" active={activeItem === 'user'} icon={<UserRectangle size={18} aria-hidden="true" />}
          onClick={() => setActiveItem('user')}>{locale === 'en' ? 'Not signed in' : '未登录'}</NavButton>
        <div className="flex gap-1 px-3 pt-3" role="group" aria-label="Interface language">
          {['zh', 'en'].map(lang => <Button key={lang} size="small" variant={locale === lang ? 'selected' : 'ghost'}
            disabled={!settings} aria-pressed={locale === lang}
            onClick={() => updateSettings({ ui_language: lang }).catch(showError)}>{lang === 'zh' ? '中文' : 'English'}</Button>)}
        </div>
      </div>
    </aside>
  );
}
