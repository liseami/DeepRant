import { motion } from 'framer-motion';
import { Translate, Repeat01, CheckTick, ArrowRight } from '../../../icons';
import { useState, useEffect } from 'react';
import { useStore } from '../../../components/StoreProvider';
import DropdownMenu from '../../../components/DropdownMenu';
import * as FlagIcons from 'country-flag-icons/react/3x2';
import { showError } from '../../../utils/toast';

const LANGUAGES = {
    zh: {
        name: '中文',
        code: 'CN'
    },
    'en-SEA': {
        name: '东南亚英语',
        code: 'SG'  // 使用新加坡国旗代码
    },
    ko: {
        name: '韩文',
        code: 'KR'
    },
    en: {
        name: '英文',
        code: 'US'
    },
    fr: {
        name: '法文',
        code: 'FR'
    },
    ru: {
        name: '俄文',
        code: 'RU'
    },
    es: {
        name: '西班牙文',
        code: 'ES'
    },
    ja: {
        name: '日文',
        code: 'JP'
    },
    de: {
        name: '德文',
        code: 'DE'
    }
};

export default function TranslationDirectionCard() {
    const [showFromMenu, setShowFromMenu] = useState(false);
    const [showToMenu, setShowToMenu] = useState(false);
    const { settings, updateSettings } = useStore();

    const from = settings?.translation_from || 'zh';
    const to = settings?.translation_to || 'en';

    const handleLanguageSelect = async (lang, isFrom) => {
        try {
            if (isFrom) {
                setShowFromMenu(false);
                await updateSettings({ translation_from: lang });
            } else {
                setShowToMenu(false);
                await updateSettings({ translation_to: lang });
            }
        } catch (error) {
            showError('更新翻译方向失败');
        }
    };

    const handleSwapDirection = async () => {
        try {
            await updateSettings({
                translation_from: to,
                translation_to: from
            });
        } catch (error) {
            console.error('切换翻译方向失败:', error);
            showError('切换翻译方向失败');
        }
    };

    const renderLanguageButton = (lang, onClick) => {
        const FlagIcon = FlagIcons[LANGUAGES[lang].code];
        return (
            <button
                onClick={onClick}
                className="px-4 py-1.5 rounded-lg bg-zinc-50 dark:bg-gray-700 hover:bg-[#EAEAEA] dark:hover:bg-gray-600 transition-colors flex items-center gap-2 shadow-sm dark:text-white"
            >
                <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                    <FlagIcon className="w-7 h-7 scale-[1.8]" />
                </div>
                {LANGUAGES[lang].name}
            </button>
        );
    };

    return (
        <motion.div
            className="relative h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl p-6 border border-zinc-200 dark:border-gray-700 hover:border-zinc-300 dark:hover:border-gray-600 transition-all duration-200 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-gray-400">
                    <Translate className="w-6 h-6 stroke-zinc-500 dark:stroke-gray-400" />
                    翻译模式
                </div>
                <button 
                    onClick={handleSwapDirection}
                    className="p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    type="button"
                >
                    <Repeat01 className="w-6 h-6 text-zinc-400 dark:text-gray-500 hover:text-zinc-600 dark:hover:text-gray-300 transition-colors" />
                </button>
            </div>
            <div className="flex-1 flex flex-col justify-between mt-4">
                <div>
                    <div className="text-sm text-zinc-400 dark:text-gray-400">
                        设置你的翻译方向
                    </div>
                    <div className="text-sm text-zinc-400 dark:text-gray-400 mt-2">
                        如果前后方向相同，也可以增强语气和语言战斗力。
                    </div>
                </div>
                <div className="flex items-center gap-3 text-2xl font-semibold text-zinc-900 dark:text-white">
                    <div className="relative">
                        {renderLanguageButton(from, () => setShowFromMenu(true))}
                        <DropdownMenu
                            options={Object.fromEntries(
                                Object.entries(LANGUAGES).map(([key, value]) => [key, value.name])
                            )}
                            onSelect={(lang) => handleLanguageSelect(lang, true)}
                            show={showFromMenu}
                            onClose={() => setShowFromMenu(false)}
                            currentValue={from}
                            renderOption={(key, value) => {
                                const FlagIcon = FlagIcons[LANGUAGES[key].code];
                                return (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                                            <FlagIcon className="w-6 h-6 scale-[1.8]" />
                                        </div>
                                        <span className="dark:text-white">{value}</span>
                                    </div>
                                );
                            }}
                        />
                    </div>
                    <ArrowRight className="dark:text-gray-400" />
                    <div className="relative">
                        {renderLanguageButton(to, () => setShowToMenu(true))}
                        <DropdownMenu
                            options={Object.fromEntries(
                                Object.entries(LANGUAGES).map(([key, value]) => [key, value.name])
                            )}
                            onSelect={(lang) => handleLanguageSelect(lang, false)}
                            show={showToMenu}
                            onClose={() => setShowToMenu(false)}
                            currentValue={to}
                            anchorPosition="right-0"
                            renderOption={(key, value) => {
                                const FlagIcon = FlagIcons[LANGUAGES[key].code];
                                return (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                                            <FlagIcon className="w-6 h-6 scale-[1.8]" />
                                        </div>
                                        <span className="dark:text-white">{value}</span>
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
} 