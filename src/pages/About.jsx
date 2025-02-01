import { motion } from 'framer-motion';
import { GamingPad, Globe, Translate, Github, AT } from '../icons';
import DeveloperNote from '../components/DeveloperNote';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useStore } from '../components/StoreProvider';
import { showSuccess, showError } from '../utils/toast';
import { useState } from 'react';

export default function About() {
    const [updateStatus, setUpdateStatus] = useState('idle');
    const [currentVersion, setCurrentVersion] = useState('1.0.4');

    const checkUpdate = async () => {
        try {
            setUpdateStatus('checking');
            const update = await check();

            if (update) {
                setUpdateStatus('downloading');
                await update.downloadAndInstall((progress) => {
                    if (progress.event === 'Started') {
                        showSuccess(`开始下载 ${progress.data.contentLength} 字节`);
                    } else if (progress.event === 'Progress') {
                        const percent = (progress.data.chunkLength / progress.data.contentLength * 100).toFixed(1);
                        showSuccess(`下载进度: ${percent}%`, { duration: 1000 });
                    }
                });
                setUpdateStatus('installed');
                await relaunch();
            } else {
                showSuccess('当前已是最新版本');
                setUpdateStatus('idle');
            }
        } catch (error) {
            showError(`更新失败: ${error.message}`);
            setUpdateStatus('error');
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* 头部介绍区域 */}
            <motion.div
                className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">关于 DeepRant</h1>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <AT className="w-4 h-4 stroke-zinc-500" />
                        <span className="text-sm text-zinc-500">版本 {currentVersion}</span>
                        {updateStatus === 'available' && (
                            <button
                                onClick={checkUpdate}
                                className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs"
                            >
                                立即更新
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                    DeepRant 是一款专为国际服游戏玩家打造的实时翻译工具，致力于打破语言壁垒，让全球玩家畅享跨语言交流的乐趣。
                </p>
            </motion.div>

            {/* 特性卡片网格 */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 开发者说 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <DeveloperNote />
                </motion.div>

                {/* 游戏场景优化 */}
                <motion.div
                    className="flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                        <GamingPad className="w-6 h-6 stroke-zinc-500" />
                        游戏场景优化
                    </div>
                    <div className="mt-4 text-sm text-zinc-400">
                        针对不同游戏类型定制翻译策略，准确理解游戏术语和表达方式，让交流更加自然顺畅。
                    </div>
                </motion.div>

                {/* 多语言支持 */}
                <motion.div
                    className="flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                        <Globe className="w-6 h-6 stroke-zinc-500" />
                        全球语言支持
                    </div>
                    <div className="mt-4 text-sm text-zinc-400">
                        支持多种语言之间的互译，让来自世界各地的玩家都能无障碍交流。
                    </div>
                </motion.div>
            </div>
        </div>
    );
} 