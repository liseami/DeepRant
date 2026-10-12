/**
 * [INPUT]: 依赖 StoreProvider 的公开模型状态、原 Dock 图标与 DeveloperNote 卡片
 * [OUTPUT]: 提供能量页面的模型访问状态和供应商额度说明
 * [POS]: 保留原能量双卡入口；DeepRant 不虚构免费次数或代替供应商计费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion';
import { Dock } from '../icons';
import DeveloperNote from '../components/DeveloperNote';
import { useStore } from '../components/StoreProvider';

const cardClassName = 'flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm';

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
        <div className="h-full flex flex-col gap-6">
            <motion.div className={`w-full ${cardClassName}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">{chinese ? '能量' : 'Energy'}</h1>
                <p className="text-zinc-600 dark:text-zinc-400">{chinese ? '管理您的使用额度和AI模型信息。' : 'Review your model access and usage quota.'}</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div className={cardClassName} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="flex items-center gap-3 text-sm text-zinc-500 mb-6"><Dock className="w-6 h-6 stroke-zinc-500" />{chinese ? '使用额度' : 'Usage quota'}</div>
                    <div className="flex-1 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                            <div><div className="text-sm text-zinc-400">{chinese ? '当前模型' : 'Current model'}</div><div className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white break-words">{model.model_name || (chinese ? '尚未配置' : 'Not configured')}</div></div>
                            <div><div className="text-sm text-zinc-400">{chinese ? '模型访问' : 'Model access'}</div><div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">{local ? (chinese ? '本地模型' : 'Local model') : t(model.has_api_key ? 'keySaved' : 'keyMissing')}</div></div>
                            <div><div className="text-sm text-zinc-400">{chinese ? '剩余额度' : 'Remaining quota'}</div><div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">{local ? (chinese ? '由本地服务管理' : 'Managed by your local service') : (chinese ? '由模型供应商管理' : 'Managed by your model provider')}</div></div>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{chinese ? 'DeepRant 免费开源。个人 API Key 在 AI模型页面配置，服务费用及剩余额度请在供应商后台查看。' : 'DeepRant is free and open source. Configure your personal key in AI models and check billing and quota with your provider.'}</p>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}><DeveloperNote /></motion.div>
            </div>
        </div>
    );
}
