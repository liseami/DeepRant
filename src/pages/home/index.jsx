/**
 * [INPUT]: 依赖原版游戏演示视频与语言、游戏场景、快捷键三张卡片
 * [OUTPUT]: 提供原版横排三卡的游戏内翻译准备界面
 * [POS]: 主页专注游戏翻译配置；表达模式交给模式页，演示离屏时暂停
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import TranslationDirectionCard from './components/TranslationDirectionCard';
import GameSceneCard from './components/GameSceneCard';
import HotkeyCard from './components/HotkeyCard';
// 导入视频文件
import demoVideo from '../../assets/demovideo.mp4';

export default function Home() {
    const videoRef = useRef(null);

    useEffect(() => {
        // -------- 演示在可见时播放，离屏暂停以保留游戏资源 --------
        const video = videoRef.current;
        if (video) {
            video.playbackRate = 1.0;
            video.defaultPlaybackRate = 1.0;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            video.play().catch(() => {});
                        } else {
                            video.pause();
                        }
                    });
                },
                { threshold: 0.5 }
            );

            observer.observe(video);

            return () => {
                observer.disconnect();
                video.pause();
            };
        }
    }, []);

    return (
        <div className="h-full flex flex-col gap-6">
            {/* 演示视频区域 */}
            <motion.div
                className="w-full bg-white rounded-2xl overflow-hidden border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="relative w-full" style={{ paddingTop: 'calc(100% / 5.5)' }}>
                    <video
                        ref={videoRef}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="none"
                    >
                        <source src={demoVideo} type="video/mp4" />
                    </video>
                </div>
            </motion.div>

            {/* 卡片网格 */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                <TranslationDirectionCard />
                <GameSceneCard />
                <HotkeyCard />
            </div>
        </div>
    );
} 