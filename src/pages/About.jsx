import { motion } from 'framer-motion';
import { GamingPad, Globe, Translate, Github, AT } from '../icons';
import DeveloperNote from '../components/DeveloperNote';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useStore } from '../components/StoreProvider';
import { showSuccess, showError } from '../utils/toast';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function About() {
    const [updateStatus, setUpdateStatus] = useState('idle');
    const [currentVersion, setCurrentVersion] = useState('');

    useEffect(() => {
        invoke('get_version')
            .then(version => {
                setCurrentVersion(version);
            })
            .catch(error => {
                console.error('获取版本号失败:', error);
            });
    }, []);

    const checkUpdate = async () => {
        try {
            setUpdateStatus('checking');
            const update = await check();

            if (update) {
                setUpdateStatus('downloading');
                let downloaded = 0;
                let contentLength = 0;

                await update.downloadAndInstall((progress) => {
                    if (progress.event === 'Started') {
                        contentLength = progress.data.contentLength;
                        showSuccess(`开始下载更新包 ${(contentLength / 1024 / 1024).toFixed(2)}MB`);
                    } else if (progress.event === 'Progress') {
                        downloaded = progress.data.chunkLength;
                        const percent = ((downloaded / contentLength) * 100).toFixed(1);
                        showSuccess(`下载进度: ${percent}%`, { duration: 1000 });
                    } else if (progress.event === 'Finished') {
                        showSuccess('下载完成，准备安装');
                    }
                });

                setUpdateStatus('installed');
                showSuccess('更新已完成，即将重启应用');
                await relaunch();
            } else {
                showSuccess('当前已是最新版本');
                setUpdateStatus('idle');
            }
        } catch (error) {
            console.error('Update error:', error);
            showError(`更新失败: ${error.message}`);
            setUpdateStatus('error');
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* 头部介绍区域 */}
            <motion.div
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-6 border border-zinc-200 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">关于 DeepRant</h1>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-gray-700">
                        <AT className="w-4 h-4 stroke-zinc-500 dark:stroke-gray-400" />
                        <span className="text-sm text-zinc-500 dark:text-gray-400">版本 {currentVersion}</span>
                        <button
                            onClick={checkUpdate}
                            disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                            className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
                                updateStatus === 'checking' || updateStatus === 'downloading'
                                    ? 'bg-zinc-200 dark:bg-gray-600 text-zinc-500 dark:text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800'
                            }`}
                        >
                            {updateStatus === 'checking' && '检查更新中...'}
                            {updateStatus === 'downloading' && '下载更新中...'}
                            {updateStatus === 'idle' && '检查更新'}
                            {updateStatus === 'error' && '重试更新'}
                        </button>
                    </div>
                </div>
                <p className="text-zinc-600 dark:text-gray-400">
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
                    className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl p-6 border border-zinc-200 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-gray-400">
                        <GamingPad className="w-6 h-6 stroke-zinc-500 dark:stroke-gray-400" />
                        游戏场景优化
                    </div>
                    <div className="mt-4 text-sm text-zinc-400 dark:text-gray-400">
                        针对不同游戏类型定制翻译策略，准确理解游戏术语和表达方式，让交流更加自然顺畅。
                    </div>
                </motion.div>

                {/* 多语言支持 */}
                <motion.div
                    className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl p-6 border border-zinc-200 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-gray-400">
                        <Globe className="w-6 h-6 stroke-zinc-500 dark:stroke-gray-400" />
                        全球语言支持
                    </div>
                    <div className="mt-4 text-sm text-zinc-400 dark:text-gray-400">
                        支持多种语言之间的互译，让来自世界各地的玩家都能无障碍交流。
                    </div>
                </motion.div>
            </div>
        </div>
    );
} 