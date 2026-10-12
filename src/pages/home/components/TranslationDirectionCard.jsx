/**
 * [INPUT]: 依赖原版 SVG/下拉菜单、语言目录、国旗与 Rust 翻译方向设置
 * [OUTPUT]: 提供原版国旗语言按钮、浮动菜单与翻译方向交换
 * [POS]: 主页语言卡片保持游戏翻译交互；语言名称共享目录，允许相同语言增强表达
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion';
import { Translate, Repeat01, ArrowRight } from '../../../icons';
import { useState } from 'react';
import { useStore } from '../../../components/StoreProvider';
import DropdownMenu from '../../../components/DropdownMenu';
import * as FlagIcons from 'country-flag-icons/react/3x2';
import { LANGUAGES, languageName } from '../../../data/languages';
import { showError } from '../../../utils/toast';

const FLAG_CODES = { zh: 'CN', en: 'US', 'en-GB': 'GB', 'en-SEA': 'SG', ko: 'KR', ja: 'JP', ru: 'RU', fr: 'FR', es: 'ES', de: 'DE', pt: 'PT' };

export default function TranslationDirectionCard() {
    const [showFromMenu, setShowFromMenu] = useState(false);
    const [showToMenu, setShowToMenu] = useState(false);
    const { settings, updateSettings, locale } = useStore();

    const from = settings?.translation_from || 'zh';
    const to = settings?.translation_to || 'en';

    const handleLanguageSelect = async (lang, isFrom) => {
        if (isFrom) {
            setShowFromMenu(false);
            await updateSettings({ translation_from: lang }).catch(showError);
        } else {
            setShowToMenu(false);
            await updateSettings({ translation_to: lang }).catch(showError);
        }
    };

    const handleSwapDirection = async () => {
        await updateSettings({
            translation_from: to,
            translation_to: from
        }).catch(showError);
    };

    const renderLanguageButton = (lang, onClick) => {
        const FlagIcon = FlagIcons[FLAG_CODES[lang]];
        return (
            <button
                type="button"
                onClick={onClick}
                className="px-4 py-1.5 rounded-lg bg-zinc-50 hover:bg-[#EAEAEA] transition-colors flex items-center gap-2 shadow-sm"
            >
                <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                    <FlagIcon className="w-7 h-7 scale-[1.8]" />
                </div>
                {languageName(lang, locale)}
            </button>
        );
    };

    return (
        <motion.div
            className="relative h-full flex flex-col bg-white rounded-2xl p-6 border border-zinc-200 hover:border-zinc-300 transition-all duration-200 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                    <Translate className="w-6 h-6" />
                    {locale === 'en' ? 'Translation mode' : '翻译模式'}
                </div>
                <button type="button" aria-label={locale === 'en' ? 'Swap languages' : '交换语言'} onClick={handleSwapDirection}>
                    <Repeat01 className="w-6 h-6 text-zinc-400 hover:text-zinc-600 transition-colors" />
                </button>
            </div>
            <div className="flex-1 flex flex-col justify-between mt-4">
                <div>
                    <div className="text-sm text-zinc-400">
                        {locale === 'en' ? 'Choose your translation direction' : '设置你的翻译方向'}
                    </div>
                    <div className="text-sm text-zinc-400 mt-2">
                        {locale === 'en' ? 'Matching languages can strengthen your tone and your words.' : '如果前后方向相同，也可以增强语气和语言战斗力。'}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-2xl font-semibold text-zinc-900">
                    <div className="relative">
                        {renderLanguageButton(from, () => setShowFromMenu(true))}
                        <DropdownMenu
                            options={Object.fromEntries(
                                Object.keys(LANGUAGES).map(key => [key, languageName(key, locale)])
                            )}
                            onSelect={(lang) => handleLanguageSelect(lang, true)}
                            show={showFromMenu}
                            onClose={() => setShowFromMenu(false)}
                            currentValue={from}
                            renderOption={(key, value) => {
                                const FlagIcon = FlagIcons[FLAG_CODES[key]];
                                return (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                                            <FlagIcon className="w-6 h-6 scale-[1.8]" />
                                        </div>
                                        {value}
                                    </div>
                                );
                            }}
                        />
                    </div>
                    <ArrowRight />
                    <div className="relative">
                        {renderLanguageButton(to, () => setShowToMenu(true))}
                        <DropdownMenu
                            options={Object.fromEntries(
                                Object.keys(LANGUAGES).map(key => [key, languageName(key, locale)])
                            )}
                            onSelect={(lang) => handleLanguageSelect(lang, false)}
                            show={showToMenu}
                            onClose={() => setShowToMenu(false)}
                            currentValue={to}
                            anchorPosition="right-0"
                            renderOption={(key, value) => {
                                const FlagIcon = FlagIcons[FLAG_CODES[key]];
                                return (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                                            <FlagIcon className="w-6 h-6 scale-[1.8]" />
                                        </div>
                                        {value}
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