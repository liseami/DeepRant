/**
 * [INPUT]: 依赖 cromma-ui / Pika 与 StoreProvider 界面语言，不访问认证服务
 * [OUTPUT]: 提供原用户信息入口的未登录说明
 * [POS]: 保留隐藏账号页位置；原登录从未启用，游戏内翻译无需账号
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Panel, PanelHeader } from 'cromma-ui';
import { UserRectangle } from 'cromma-ui/pika';
import { useStore } from '../components/StoreProvider';

export default function User() {
    const { locale } = useStore();
    const chinese = locale === 'zh';
    return (
        <section className="min-w-0">
            <header className="workspace-title"><h1>{chinese ? '用户信息' : 'User information'}</h1></header>
            <Panel>
                <PanelHeader title={<span className="flex items-center gap-2"><UserRectangle size={18} aria-hidden="true" />{chinese ? '未登录' : 'Not signed in'}</span>} />
                <p className="p-4 text-base text-muted-foreground leading-relaxed">{chinese ? '使用自己的 API Key 即可进行游戏内翻译，无需注册账号。' : 'Use your own API key for in-game translation; no account is required.'}</p>
            </Panel>
        </section>
    );
}
