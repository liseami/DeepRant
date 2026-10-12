/**
 * [INPUT]: 依赖原图标与 DeveloperNote、版本命令、统一更新请求和系统 URL 打开能力
 * [OUTPUT]: 提供游戏产品介绍、作者 / 游戏 / 多语言三卡、版本更新和隐私权限说明
 * [POS]: 关于页保留原游戏软件定位；更新检查汇入常驻 UpdateManager，安装由用户触发
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion';
import { GamingPad, Globe, AT } from '../icons';
import DeveloperNote from '../components/DeveloperNote';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useStore } from '../components/StoreProvider';
import { requestUpdateCheck } from '../utils/updater';
import { showError } from '../utils/toast';

const cardClassName = 'flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm';

export default function About() {
    const { t, locale } = useStore();
    const [version, setVersion] = useState('');
    const chinese = locale === 'zh';
    useEffect(() => {
        let closed = false;
        invoke('get_version').then(value => { if (!closed) setVersion(value); }).catch(error => { if (!closed) showError(error); });
        return () => { closed = true; };
    }, []);

    return (
        <div className="h-full flex flex-col gap-6">
            <motion.div className={`w-full ${cardClassName}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('aboutTitle')}</h1>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <AT className="w-4 h-4 stroke-zinc-500" />
                        <span className="text-sm text-zinc-500">{t('version')} {version || '—'}</span>
                        <button type="button" onClick={requestUpdateCheck} className="px-3 py-1 rounded-full text-xs flex items-center gap-1 bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">{t('checkUpdates')}</button>
                    </div>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">{chinese ? 'DeepRant 是一款专为国际服游戏玩家打造的实时翻译工具，致力于打破语言壁垒，让全球玩家畅享跨语言交流的乐趣。' : 'DeepRant is a real-time translation tool for international game players, helping players around the world communicate across languages.'}</p>
            </motion.div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><DeveloperNote /></motion.div>
                <motion.div className={cardClassName} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="flex items-center gap-3 text-sm text-zinc-500"><GamingPad className="w-6 h-6 stroke-zinc-500" />{chinese ? '游戏场景优化' : 'Built for game chat'}</div>
                    <p className="mt-4 text-sm text-zinc-400">{chinese ? '针对不同游戏类型定制翻译策略，准确理解游戏术语和表达方式，让交流更加自然顺畅。' : 'Game-specific context helps translate terminology and expressions for natural, effective communication.'}</p>
                </motion.div>
                <motion.div className={cardClassName} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="flex items-center gap-3 text-sm text-zinc-500"><Globe className="w-6 h-6 stroke-zinc-500" />{chinese ? '全球语言支持' : 'Global language support'}</div>
                    <p className="mt-4 text-sm text-zinc-400">{chinese ? '支持多种语言之间的互译，让来自世界各地的玩家都能无障碍交流。' : 'Translate between languages so players from around the world can communicate.'}</p>
                    <button type="button" onClick={() => openUrl('https://github.com/liseami/DeepRant/releases').catch(showError)} className="self-start mt-6 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">{t('project')}</button>
                </motion.div>
            </div>
            <details className={cardClassName}>
                <summary className="cursor-pointer text-sm text-zinc-500">{t('privacy')} · {t('permissions')}</summary>
                <p className="mt-4 text-xs text-zinc-400 leading-relaxed">{t('privacyHelp')}</p>
                <p className="mt-3 text-xs text-zinc-400 leading-relaxed">{t('permissionsHelp')}</p>
                <p className="mt-3 text-xs text-zinc-400 leading-relaxed">{t('inputHelp')}</p>
            </details>
        </div>
    );
}
