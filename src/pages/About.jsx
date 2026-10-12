/**
 * [INPUT]: 依赖 Cromma UI / Pika、DeveloperNote、版本命令、更新请求与 Rust 固定发布链接命令
 * [OUTPUT]: 提供游戏产品介绍、作者 / 游戏 / 多语言卡片、版本更新与隐私权限说明
 * [POS]: 关于页保留游戏软件定位；更新交给 UpdateManager，业务页不建立第二条下载流程
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useState } from 'react';
import { Panel, PanelHeader, Button, motion, MOTION } from 'cromma-ui';
import { KeyboardWired, Globe, Refresh, Share01 } from 'cromma-ui/pika';
import DeveloperNote from '../components/DeveloperNote';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../components/StoreProvider';
import { requestUpdateCheck } from '../utils/updater';
import { showError } from '../utils/toast';

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
        <section className="min-w-0">
            <header className="workspace-title">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h1>{t('aboutTitle')}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground font-mono">v{version || '—'}</span>
                        <Button type="button" variant="secondary" size="small" leftIcon={<Refresh size={14} aria-hidden="true" />} onClick={requestUpdateCheck}>{t('checkUpdates')}</Button>
                    </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{chinese ? 'DeepRant 是一款专为国际服游戏玩家打造的实时翻译工具，致力于打破语言壁垒，让全球玩家畅享跨语言交流的乐趣。' : 'DeepRant is a real-time translation tool for international game players, helping players around the world communicate across languages.'}</p>
            </header>
            <motion.div className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MOTION.base}>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    <DeveloperNote />
                    <Panel>
                        <PanelHeader title={<span className="flex items-center gap-2"><KeyboardWired size={18} aria-hidden="true" />{chinese ? '游戏场景优化' : 'Built for game chat'}</span>} />
                        <p className="p-4 text-base text-muted-foreground leading-relaxed">{chinese ? '针对不同游戏类型定制翻译策略，准确理解游戏术语和表达方式，让交流更加自然顺畅。' : 'Game-specific context helps translate terminology and expressions for natural, effective communication.'}</p>
                    </Panel>
                    <Panel>
                        <PanelHeader title={<span className="flex items-center gap-2"><Globe size={18} aria-hidden="true" />{chinese ? '全球语言支持' : 'Global language support'}</span>} />
                        <div className="flex flex-1 flex-col gap-4 p-4">
                            <p className="text-base text-muted-foreground leading-relaxed">{chinese ? '支持多种语言之间的互译，让来自世界各地的玩家都能无障碍交流。' : 'Translate between languages so players from around the world can communicate.'}</p>
                            <Button type="button" variant="secondary" size="small" className="self-start mt-auto" leftIcon={<Share01 size={14} aria-hidden="true" />} onClick={() => invoke('open_external_link', { id: 'releases' }).catch(showError)}>{t('project')}</Button>
                        </div>
                    </Panel>
                </div>
                <Panel>
                    <details>
                        <summary className="cursor-pointer px-4 py-4 text-base font-medium">{t('privacy')} · {t('permissions')}</summary>
                        <div className="space-y-3 px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                            <p>{t('privacyHelp')}</p>
                            <p>{t('permissionsHelp')}</p>
                            <p>{t('inputHelp')}</p>
                        </div>
                    </details>
                </Panel>
            </motion.div>
        </section>
    );
}
