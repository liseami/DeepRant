import { motion } from 'framer-motion';
import { Server, Crown, Sparkles, Cube } from '../icons';
import { useState, useEffect } from 'react';
import { useStore } from '../components/StoreProvider';

export default function Settings() {
    const { settings, updateSettings } = useStore();
    const [activeModel, setActiveModel] = useState(settings?.model_type || 'deepseek');

    useEffect(() => {
        if (settings?.model_type) {
            setActiveModel(settings.model_type);
        }
    }, [settings?.model_type]);

    const handleModelChange = async (model) => {
        setActiveModel(model);
        await updateSettings({ model_type: model });
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* 头部介绍区域 */}
            <motion.div
                className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">AI模型设置</h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    管理您的API配置和订阅信息。
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 模型选择卡片 */}
                <motion.div
                    className="flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-3 text-sm text-zinc-500 mb-6">
                        <Crown className="w-5 h-5 stroke-zinc-500" />
                        模型选择
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={() => handleModelChange('deepseek')}
                            className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">DeepSeek</span>
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                    <Cube className="w-3.5 h-3.5 stroke-zinc-500" />
                                    <span className="text-xs text-zinc-500">deepseek-chat</span>
                                </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border transition-all ${activeModel === 'deepseek'
                                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_1px_2px_0_rgba(255,255,255,0.1)]'
                                : 'border-zinc-300 dark:border-zinc-600'
                                }`} />
                        </button>

                        <button
                            onClick={() => handleModelChange('stepfun')}
                            className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">

                                <span className="text-sm text-zinc-700 dark:text-zinc-300">阶跃星辰</span>
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                    <Cube className="w-3.5 h-3.5 stroke-zinc-500" />
                                    <span className="text-xs text-zinc-500">step-2</span>
                                </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border transition-all ${activeModel === 'stepfun'
                                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_1px_2px_0_rgba(255,255,255,0.1)]'
                                : 'border-zinc-300 dark:border-zinc-600'
                                }`} />
                        </button>
                    </div>
                </motion.div>

                {/* 自定义API配置卡片 */}
                <motion.div
                    className="flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-3 text-sm text-zinc-500 mb-6">
                        <Server className="w-5 h-5 stroke-zinc-500" />
                        自定义API配置
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-500 mb-2">API Key</label>
                            <input
                                type="text"
                                disabled
                                value="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-500 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-500 mb-2">Base URL</label>
                            <input
                                type="text"
                                disabled
                                value="https://api.deepseek.com/v1/"
                                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-500 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-500 mb-2">Model Name</label>
                            <input
                                type="text"
                                disabled
                                value="deepseek-chat"
                                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-500 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="pt-2">
                            <p className="text-xs text-zinc-400">
                                当前暂不支持自定义模型配置
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
} 