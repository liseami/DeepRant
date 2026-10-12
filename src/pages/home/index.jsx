/**
 * [INPUT]: 依赖 Tauri 随包 media 资源的 Range 协议、原演示预览图、Cromma UI 和三个设置卡片
 * [OUTPUT]: 提供游戏内翻译主页和可重试的录屏横幅，未播放时立即展示原预览图
 * [POS]: App 常驻首页复用同一播放器；仅当前页、可见窗口与可见视口播放，字节读取留给原生资源协议
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { convertFileSrc, isTauri } from '@tauri-apps/api/core';
import { resolveResource } from '@tauri-apps/api/path';
import { Button, Panel, motion, MOTION } from 'cromma-ui';
import TranslationDirectionCard from './components/TranslationDirectionCard';
import GameSceneCard from './components/GameSceneCard';
import HotkeyCard from './components/HotkeyCard';
import { useStore } from '../../components/StoreProvider';
import preview from '../../assets/preview.png';

export default function Home({ active }) {
  const videoRef = useRef(null);
  const visibleRef = useRef(false);
  const [videoSource, setVideoSource] = useState();
  const [videoError, setVideoError] = useState(false);
  const { locale } = useStore();

  const loadVideo = useCallback(async () => {
    setVideoError(false);
    try {
      // -------- 原生资源按需读取；Vite 开发服务直接提供源文件，避免嵌入第二份录屏 --------
      const source = isTauri()
        ? convertFileSrc(await resolveResource('media/demovideo.mp4'))
        : '/src/assets/demovideo.mp4';
      if (videoRef.current) setVideoSource(source);
    } catch {
      if (videoRef.current) setVideoError(true);
    }
  }, []);

  const playback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && visibleRef.current && !document.hidden && video.hasAttribute('src')) video.play().catch(() => {});
    else video.pause();
  }, [active]);

  useEffect(() => { loadVideo(); }, [loadVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        visibleRef.current = entry.isIntersecting;
        playback();
      });
    }, { threshold: 0.5 });
    observer.observe(video);
    document.addEventListener('visibilitychange', playback);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', playback);
      visibleRef.current = false;
      video.pause();
    };
  }, [playback]);

  const retryVideo = () => {
    if (!videoSource) { loadVideo(); return; }
    setVideoError(false);
    videoRef.current?.load();
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-5">
      <header className="workspace-title shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{locale === 'en' ? 'In-game translation' : '游戏内翻译'}</h1>
        <p className="text-sm text-muted-foreground">{locale === 'en' ? 'Open chat, type your message, and press your translation shortcut.' : '打开聊天框，输入内容，按下翻译快捷键。'}</p>
      </header>
      <motion.div className="shrink-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={MOTION.base}>
        <Panel aria-label={locale === 'en' ? 'In-game translation demo' : '游戏内翻译演示'}>
          <div className="relative w-full" style={{ paddingTop: 'calc(100% / 5.5)' }}>
            <video ref={videoRef} src={videoSource} poster={preview} className="absolute inset-0 w-full h-full object-cover"
              loop muted playsInline preload="metadata" onCanPlay={playback} onError={() => setVideoError(true)} />
            {videoError && <Button className="absolute bottom-3 right-3" size="small" variant="secondary" onClick={retryVideo}>
              {locale === 'en' ? 'Retry demo video' : '重新加载演示视频'}
            </Button>}
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
