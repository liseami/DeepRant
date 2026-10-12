/**
 * [INPUT]: 依赖 cromma-ui / Pika、StoreProvider 界面语言与系统 URL 打开能力
 * [OUTPUT]: 提供同源面板内的开发者介绍、社交链接与课程入口
 * [POS]: About 与 Mana 共用作者信息；模型服务由用户配置，更新统一由 UpdateManager 管理
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Panel, PanelHeader, Button } from 'cromma-ui';
import { UserRectangle, Share01, Notebook } from 'cromma-ui/pika';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useStore } from './StoreProvider';
import { showError } from '../utils/toast';

export default function DeveloperNote() {
    const { locale } = useStore();
    const chinese = locale === 'zh';
    const openLink = url => openUrl(url).catch(showError);

    return (
        <Panel className="h-full">
            <PanelHeader title={<span className="flex items-center gap-2"><UserRectangle size={18} aria-hidden="true" />{chinese ? '开发者说' : 'Developer note'}</span>} />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <h3 className="text-xl font-semibold">{chinese ? '你好，我是赵纯想' : "Hi, I'm Zhao Chunxiang"}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                    {chinese ? 'DeepRant 是我的一个实验性项目，主要目的：在国际服游戏交流中保证语言优势。软件免费开源，您可以连接自己的模型与 API Key，模型调用费用和额度由供应商管理。' : 'DeepRant is my experimental project for giving players a language advantage in international game chat. The app is free and open source. Connect your own model and API key; your provider manages API costs and quotas.'}
                </p>
                <div className="flex flex-col items-start gap-2 mt-auto">
                    <Button type="button" variant="secondary" size="small" leftIcon={<Share01 size={14} aria-hidden="true" />} onClick={() => openLink('https://x.com/liseami1')}>{chinese ? '在 X 上关注纯想' : 'Follow Chunxiang on X'}</Button>
                    <Button type="button" variant="secondary" size="small" leftIcon={<Share01 size={14} aria-hidden="true" />} onClick={() => openLink('https://www.xiaohongshu.com/user/profile/597898e15e87e727f19b1003')}>{chinese ? '在小红书上关注纯想' : 'On Xiaohongshu'}</Button>
                    <Button type="button" variant="ink" size="small" leftIcon={<Notebook size={14} aria-hidden="true" />} onClick={() => openLink('https://chunxiang.space')}>{chinese ? '纯想0基础全栈开发课程' : "Chunxiang's course"}</Button>
                </div>
            </div>
        </Panel>
    );
}
