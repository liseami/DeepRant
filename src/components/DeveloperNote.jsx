import { Coffee, SocialX, Macbook } from '../icons';

export default function DeveloperNote() {
    return (
        <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm">
            <div className="flex items-center gap-3 text-sm text-zinc-500 mb-6">
                <Coffee className="w-6 h-6 stroke-zinc-500" />
                开发者说
            </div>
            <div className="flex flex-col gap-4">
                <div className="text-lg font-medium text-zinc-900 dark:text-white">
                    你好，我是赵纯想
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    DeepRant 是我的一个实验性项目，主要目的：1、在国际服游戏骂战中保证语言优势。2、测试目前尚不流行的Tauri2框架。
                    目前这个软件是免费的，我暂时为所有Api调用支付费用。
                </p>
                <a
                    href="https://x.com/liseami1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-600 dark:text-zinc-400"
                >
                    <SocialX className="w-4 h-4 stroke-zinc-500" />
                    在 X 上关注纯想
                </a>
                <a
                    href="https://chunxiang.space"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-600 dark:text-zinc-400"
                >
                    <Macbook className="w-4 h-4 stroke-zinc-500" />
                    纯想0基础全栈开发课程
                </a>
            </div>
        </div>
    );
} 