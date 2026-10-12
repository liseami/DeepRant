/**
 * [INPUT]: 依赖原游戏演示视频、Cromma UI Panel/动效和三个核心设置卡片
 * [OUTPUT]: 提供游戏内翻译主页，保留视频横幅和横排语言/游戏/快捷键配置
 * [POS]: CCBaga 同款视觉包裹 DeepRant 原操作骨架，表达模式仍在独立模式页
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useRef } from 'react';
import { Panel, motion, MOTION } from 'cromma-ui';
import TranslationDirectionCard from './components/TranslationDirectionCard';
import GameSceneCard from './components/GameSceneCard';
import HotkeyCard from './components/HotkeyCard';
import { useStore } from '../../components/StoreProvider';
import demoVideo from '../../assets/demovideo.mp4';

export default function Home() {
  const videoRef = useRef(null);
  const { locale } = useStore();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let visible = false;
    const playback = () => {
      if (visible && !document.hidden) video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        visible = entry.isIntersecting;
        playback();
      });
    }, { threshold: 0.5 });
    observer.observe(video);
    document.addEventListener('visibilitychange', playback);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', playback); video.pause(); };
  }, []);

  return (
    <div className="h-full min-h-0 flex flex-col gap-5">
      <header className="workspace-title shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{locale === 'en' ? 'In-game translation' : '游戏内翻译'}</h1>
        <p className="text-sm text-muted-foreground">{locale === 'en' ? 'Open chat, type your message, and press your translation shortcut.' : '打开聊天框，输入内容，按下翻译快捷键。'}</p>
      </header>
      <motion.div className="shrink-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={MOTION.base}>
        <Panel aria-label={locale === 'en' ? 'In-game translation demo' : '游戏内翻译演示'}>
          <div className="relative w-full" style={{ paddingTop: 'calc(100% / 5.5)' }}>
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline preload="none">
              <source src={demoVideo} type="video/mp4" />
            </video>
          </div>
        </Panel>
      </motion.div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-1">
        <TranslationDirectionCard />
        <GameSceneCard />
        <HotkeyCard />
      </div>
    </div>
  );
}
