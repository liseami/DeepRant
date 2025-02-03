import { motion } from 'framer-motion';
import { Dock, Sparkles, Coffee, Macbook, SocialX } from '../icons';
import DeveloperNote from '../components/DeveloperNote';

export default function Mana() {
    return (
        <div className="h-full flex flex-col gap-6">
            {/* 头部介绍区域 */}
            <motion.div
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-6 border border-zinc-200 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">AI模型设置</h1>
                <p className="text-zinc-600 dark:text-gray-400">
                    管理您的使用额度和AI模型信息。
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 使用额度卡片 */}
                <motion.div
                    className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl p-6 border border-zinc-200 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-3 text-sm text-zinc-500 mb-6">
                        <Dock className="w-6 h-6 stroke-zinc-500" />
                        使用额度
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-zinc-400">剩余免费次数</div>
                                <div className="text-2xl font-semibold text-zinc-900 dark:text-white">
                                    无限 次
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-zinc-400">当前计划</div>
                                <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                                    免费版
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 开发者说卡片 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <DeveloperNote />
                </motion.div>
            </div>
        </div>
    );
} 