/**
 * [INPUT]: 依赖 cromma-ui / Pika、StoreProvider 公开模型状态与 DeveloperNote 卡片
 * [OUTPUT]: 提供能量页面的当前模型、凭据状态和供应商额度说明
 * [POS]: 保留能量双面板入口；DeepRant 不虚构免费次数或代替供应商计费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Panel, PanelHeader, motion, MOTION } from 'cromma-ui';
import { Server, ShieldCheck } from 'cromma-ui/pika';
import DeveloperNote from '../components/DeveloperNote';
import { useStore } from '../components/StoreProvider';

export default function Mana() {
    const { settings, locale, t } = useStore();
    const chinese = locale === 'zh';
    const model = settings.custom_model;
    let local = false;
    try {
        const host = new URL(model.api_url).hostname;
        local = host === 'localhost' || host === '[::1]' || /^127\./.test(host);
    } catch { /* -------- 未配置的模型保持待配置状态 -------- */ }

    return (
        <section className="min-w-0">
            <header className="workspace-title">
                <h1>{chinese ? '能量' : 'Energy'}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{chinese ? '管理您的使用额度和AI模型信息。' : 'Review your model access and usage quota.'}</p>
            </header>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MOTION.base}>
                <Panel>
                    <PanelHeader title={<span className="flex items-center gap-2"><Server size={18} aria-hidden="true" />{chinese ? '使用额度' : 'Usage quota'}</span>} />
                    <div className="flex flex-1 flex-col gap-6 p-4">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">{chinese ? '当前模型' : 'Current model'}</p>
                            <p className="text-2xl font-semibold break-words">{model.model_name || (chinese ? '尚未配置' : 'Not configured')}</p>
                        </div>
                        <dl className="divide-y divide-panel-outline text-base">
                            <div className="flex items-start justify-between gap-4 py-4">
                                <dt className="text-muted-foreground shrink-0">{chinese ? '模型访问' : 'Model access'}</dt>
                                <dd className="flex items-center justify-end gap-2 text-right"><ShieldCheck size={18} aria-hidden="true" className="shrink-0" />{local ? (chinese ? '本地模型' : 'Local model') : t(model.has_api_key ? 'keySaved' : 'keyMissing')}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-4 py-4">
                                <dt className="text-muted-foreground shrink-0">{chinese ? '剩余额度' : 'Remaining quota'}</dt>
                                <dd className="text-right">{local ? (chinese ? '由本地服务管理' : 'Managed by your local service') : (chinese ? '由模型供应商管理' : 'Managed by your model provider')}</dd>
                            </div>
                        </dl>
                        <p className="mt-auto text-sm text-muted-foreground leading-relaxed">{chinese ? 'DeepRant 免费开源。个人 API Key 在 AI模型页面配置，服务费用及剩余额度请在供应商后台查看。' : 'DeepRant is free and open source. Configure your personal key in AI models and check billing and quota with your provider.'}</p>
                    </div>
                </Panel>
                <DeveloperNote />
            </motion.div>
        </section>
    );
}
