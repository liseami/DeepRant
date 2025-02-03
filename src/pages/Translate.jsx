import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { GamingPad, ChatBubbleMessage, FaceOldFace, Whistle } from '../icons';
import { useStore } from '../components/StoreProvider';

export default function Translate() {
    const { settings, updateSettings } = useStore();
    const [activeMode, setActiveMode] = useState(settings?.translation_mode || 'auto');

    useEffect(() => {
        if (settings?.translation_mode) {
            setActiveMode(settings.translation_mode);
        }
    }, [settings?.translation_mode]);

    const handleModeChange = async (mode) => {
        const newMode = activeMode === mode ? 'auto' : mode;
        setActiveMode(newMode);
        await updateSettings({ translation_mode: newMode });
    };

    const getCardClassName = (isActive) => `
        flex flex-col bg-white dark:bg-gray-800 rounded-2xl p-6 border 
        cursor-pointer transition-all 
        ${isActive ? 'border-zinc-900 dark:border-gray-100 shadow-lg' : 'border-zinc-200 dark:border-gray-700'}
        shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] 
        backdrop-blur-sm
    `;

    return (
        <div className="p-4">
            <div className="h-full flex flex-col gap-6">
                {/* 头部说明区域 */}
                <motion.div
                    className="w-full bg-white dark:bg-gray-800 rounded-2xl p-6 border border-zinc-200 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">翻译模式</h1>
                    <p className="text-zinc-600 dark:text-gray-400">
                        选择一个翻译模式来适应不同的游戏场景。这些模式是互斥的，一次只能启用一个模式。
                    </p>
                </motion.div>

                {/* 模式选择卡片 */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 嘴臭模式 */}
                    <motion.div
                        className={getCardClassName(activeMode === 'toxic')}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => handleModeChange('toxic')}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-gray-400">
                                <Whistle className="w-6 h-6 stroke-zinc-500 dark:stroke-gray-400" />
                                嘴臭模式
                            </div>
                            <div className={`w-10 h-6 rounded-full transition-colors ${
                                activeMode === 'toxic' 
                                    ? 'bg-zinc-900 dark:bg-gray-700'
                                    : 'bg-zinc-200 dark:bg-gray-600'
                                } relative`}>
                                <div className={`absolute w-4 h-4 rounded-full bg-white dark:bg-gray-300 top-1 transition-all ${
                                    activeMode === 'toxic' ? 'left-5' : 'left-1'
                                }`} />
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-zinc-400 dark:text-gray-400">
                            将友好的对话转换为富有火药味的表达，适合竞技游戏的氛围。
                        </div>
                    </motion.div>

                    {/* 职业玩家模式 */}
                    <motion.div
                        className={getCardClassName(activeMode === 'pro')}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={() => handleModeChange('pro')}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-gray-400">
                                <GamingPad className="w-6 h-6 stroke-zinc-500 dark:stroke-gray-400" />
                                职业玩家模式
                            </div>
                            <div className={`w-10 h-6 rounded-full transition-colors ${
                                activeMode === 'pro' 
                                    ? 'bg-zinc-900 dark:bg-gray-700'
                                    : 'bg-zinc-200 dark:bg-gray-600'
                                } relative`}>
                                <div className={`absolute w-4 h-4 rounded-full bg-white dark:bg-gray-300 top-1 transition-all ${
                                    activeMode === 'pro' ? 'left-5' : 'left-1'
                                }`} />
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-zinc-400 dark:text-gray-400">
                            使用专业的游戏术语和简短指令，提高团队配合效率。
                        </div>
                    </motion.div>

                    {/* 自动模式 */}
                    <motion.div
                        className={getCardClassName(activeMode === 'auto')}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => handleModeChange('auto')}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-gray-400">
                                <FaceOldFace className="w-6 h-6 stroke-zinc-500 dark:stroke-gray-400" />
                                自动模式
                            </div>
                            <div className={`w-10 h-6 rounded-full transition-colors ${
                                activeMode === 'auto' 
                                    ? 'bg-zinc-900 dark:bg-gray-700'
                                    : 'bg-zinc-200 dark:bg-gray-600'
                                } relative`}>
                                <div className={`absolute w-4 h-4 rounded-full bg-white dark:bg-gray-300 top-1 transition-all ${
                                    activeMode === 'auto' ? 'left-5' : 'left-1'
                                }`} />
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-zinc-400 dark:text-gray-400">
                            智能识别场景，自动选择最适合的翻译模式。
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
} 