/**
 * [INPUT]: 依赖原图标目录、StoreProvider 的界面语言与系统 URL 打开能力
 * [OUTPUT]: 提供开发者介绍、社交链接和课程链接卡片
 * [POS]: About 与 Mana 共用的作者信息；模型服务由用户配置，更新统一交给 UpdateManager
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Coffee, SocialX, Macbook } from '../icons';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useStore } from './StoreProvider';
import { showError } from '../utils/toast';

export default function DeveloperNote() {
    const { locale } = useStore();
    const chinese = locale === 'zh';
    const openLink = url => openUrl(url).catch(showError);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm">
            <div className="flex items-center gap-3 text-sm text-zinc-500 mb-6">
                <Coffee className="w-6 h-6 stroke-zinc-500" />
                {chinese ? '开发者说' : 'A note from the developer'}
            </div>
            <div className="flex flex-col gap-4">
                <div className="text-lg font-medium text-zinc-900 dark:text-white">{chinese ? '你好，我是赵纯想' : "Hi, I'm Zhao Chunxiang"}</div>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {chinese ? 'DeepRant 是我的一个实验性项目，主要目的：在国际服游戏交流中保证语言优势。软件免费开源，您可以连接自己的模型与 API Key，模型调用费用和额度由供应商管理。' : 'DeepRant is my experimental project for giving players a language advantage in international game chat. The app is free and open source. Connect your own model and API key; your provider manages API costs and quotas.'}
                </p>
                <button type="button" onClick={() => openLink('https://x.com/liseami1')}
                    className="self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-600 dark:text-zinc-400">
                    <SocialX className="w-4 h-4 stroke-zinc-500" />
                    {chinese ? '在 X 上关注纯想' : 'Follow Chunxiang on X'}
                </button>
                <button type="button" onClick={() => openLink('https://www.xiaohongshu.com/user/profile/597898e15e87e727f19b1003')}
                    className="self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-600 dark:text-zinc-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-zinc-500"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M8 16V8l4 4 4-4v8" /></svg>
                    {chinese ? '在小红书上关注纯想' : 'Follow Chunxiang on Xiaohongshu'}
                </button>
                <button type="button" onClick={() => openLink('https://chunxiang.space')}
                    className="self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-950 to-emerald-900 hover:from-emerald-900 hover:to-emerald-800 transition-all hover:scale-105 text-sm text-white shadow-lg ring-2 ring-white/50 ring-offset-2 ring-offset-emerald-950 hover:ring-white/80">
                    <Macbook className="w-4 h-4 stroke-white" />
                    {chinese ? '纯想0基础全栈开发课程' : "Chunxiang's full-stack course"}
                </button>
            </div>
        </div>
    );
}
