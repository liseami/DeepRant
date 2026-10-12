/**
 * [INPUT]: 依赖原版 SVG、应用图标、导航状态和界面语言设置
 * [OUTPUT]: 提供原版侧栏视觉、菜单动画及中英界面切换
 * [POS]: Layout 的游戏翻译导航边界，页面与 Rust 设置契约分别交给 App 和 StoreProvider
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { HomeHLine, Settings02, Translate, InfoCircle, GodlyWebsite } from '../icons';
import appIcon from '../assets/app-icon.png';
import { useStore } from './StoreProvider';
import { showError } from '../utils/toast';

const sidebarItems = [
  { name: '主页', english: 'Home', icon: HomeHLine, id: 'home' },
  { name: '模式', english: 'Modes', icon: Translate, id: 'translate' },
  { name: '常用语', english: 'Phrases', icon: InfoCircle, id: 'phrases' },
  { name: '能量', english: 'Energy', icon: GodlyWebsite, id: 'mana' },
  { name: 'AI模型', english: 'AI models', icon: Settings02, id: 'settings' },
  { name: '关于', english: 'About', icon: InfoCircle, id: 'about' },
];

export default function Sidebar({ activeItem, setActiveItem }) {
  const { locale, updateSettings, settings } = useStore();
  return (
    <div className="h-full flex flex-col bg-[#F9F9F9]">
      <div className="px-5 py-5">
        <div className="flex items-center space-x-2">
          <div className="rounded-xl flex items-center justify-center overflow-hidden w-[46px] h-[46px] min-w-[46px] border-2 border-white">
            <img src={appIcon} alt="DeepRant Logo" width="46" height="46" className="object-cover w-[46px] h-[46px]" />
          </div>
          <h3 className="text-[20px] font-semibold text-[#1a1a1a]">DeepRant</h3>
        </div>
      </div>
      <nav className="flex-1 px-2 py-2" aria-label={locale === 'en' ? 'Main navigation' : '主导航'}>
        {sidebarItems.map(item => {
          const isActive = activeItem === item.id;
          return <button type="button" key={item.id} onClick={() => setActiveItem(item.id)}
            aria-current={isActive ? 'page' : undefined} className="relative block w-full text-left">
            {isActive && <motion.div layoutId="activeTab"
              className="absolute inset-0 bg-white rounded-lg shadow-[0_4px_8px_-2px_rgba(0,0,0,0.08)]"
              initial={false} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
            <div className={twMerge('flex items-center px-3.5 py-2.5 cursor-pointer', 'text-[14px] font-medium relative z-10',
              isActive ? 'text-[#1a1a1a] font-semibold' : 'text-[#666666] hover:text-[#1a1a1a]')}>
              <item.icon className={twMerge('w-[18px] h-[18px] mr-3', isActive ? 'stroke-[#1a1a1a]' : 'stroke-[#666666]')} />
              {locale === 'en' ? item.english : item.name}
            </div>
          </button>;
        })}
      </nav>
      <div className="flex gap-1 px-5 pb-4" aria-label="Interface language">
        {['zh', 'en'].map(lang => <button type="button" key={lang} disabled={!settings} aria-pressed={locale === lang}
          className={`px-2 py-1 rounded-md text-xs transition-colors ${locale === lang ? 'bg-white text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
          onClick={() => updateSettings({ ui_language: lang }).catch(showError)}>{lang === 'zh' ? '中文' : 'English'}</button>)}
      </div>
    </div>
  );
}
