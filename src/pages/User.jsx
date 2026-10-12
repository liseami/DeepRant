/**
 * [INPUT]: 依赖 StoreProvider 的界面语言，不访问账号或认证服务
 * [OUTPUT]: 提供原用户信息入口的未登录说明
 * [POS]: 保留原隐藏账号页位置；原登录从未启用，游戏内翻译无需账号
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useStore } from '../components/StoreProvider';

export default function User() {
    const { locale } = useStore();
    const chinese = locale === 'zh';
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">{chinese ? '用户信息' : 'User information'}</h2>
            <p className="text-gray-600 dark:text-zinc-400">{chinese ? '当前未登录。使用自己的 API Key 即可进行游戏内翻译，无需注册账号。' : 'You are not signed in. Use your own API key for in-game translation; no account is required.'}</p>
        </div>
    );
}
