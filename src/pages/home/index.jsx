import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import TranslationDirectionCard from './components/TranslationDirectionCard';
import GameSceneCard from './components/GameSceneCard';
import HotkeyCard from './components/HotkeyCard';
// 导入视频文件
import demoVideo from '../../assets/demovideo.mp4';

export default function Home() {
    const [isSettingHotkey, setIsSettingHotkey] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        // 降低视频品质以提升性能
        if (videoRef.current) {
            videoRef.current.playbackRate = 1.0;
            videoRef.current.defaultPlaybackRate = 1.0;

            // 可选：检查视频是否在视口中
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            videoRef.current?.play();
                        } else {
                            videoRef.current?.pause();
                        }
                    });
                },
                { threshold: 0.5 }
            );

            if (videoRef.current) {
                observer.observe(videoRef.current);
            }

            return () => {
                if (videoRef.current) {
                    observer.unobserve(videoRef.current);
                }
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
                        loading="lazy"
                    >
                        <source src={demoVideo} type="video/mp4" />
                    </video>
                </div>
            </motion.div>

            {/* 卡片网格 */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                <TranslationDirectionCard />
                <GameSceneCard />
                <HotkeyCard
                    isSettingHotkey={isSettingHotkey}
                    onSetHotkey={() => setIsSettingHotkey(true)}
                />
            </div>
        </div>
    );
} 