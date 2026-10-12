/**
 * [INPUT]: 依赖 LANGUAGES from data/languages；依赖 country-flag-icons；依赖 I18N；依赖 useStore 的 translation_from / translation_to
 * [OUTPUT]: 提供翻译方向选择与互换。en-GB 走 GB 国旗。
 * [POS]: 首页三卡之一。只读 languages.js，不维护本地名单。
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { motion } from 'framer-motion';
import { Translate, Repeat01, ArrowRight } from '../../../icons';
import { useState } from 'react';
import { useStore } from '../../../components/StoreProvider';
import DropdownMenu from '../../../components/DropdownMenu';
import * as FlagIcons from 'country-flag-icons/react/3x2';
import { LANGUAGES } from '../../../data/languages.js';
import { I18N, uiLocale } from '../../../data/i18n.js';

function languageMeta(lang) {
    return LANGUAGES[lang] || LANGUAGES.en;
}

function FlagBadge({ lang, size = 'sm' }) {
    const meta = languageMeta(lang);
    const FlagIcon = FlagIcons[meta.code];
    const box = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    const icon = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';
    return (
        <div className={`${box} rounded-full overflow-hidden flex items-center justify-center bg-gray-100`}>
            {FlagIcon ? <FlagIcon className={`${icon} scale-[1.8]`} /> : null}
        </div>
    );
}

export default function TranslationDirectionCard() {
    const [showFromMenu, setShowFromMenu] = useState(false);
    const [showToMenu, setShowToMenu] = useState(false);
    const { settings, updateSettings } = useStore();

    const from = settings?.translation_from || 'zh';
    const to = settings?.translation_to || 'en';
    const labels = I18N[uiLocale(settings?.ui_language)].card;

    const handleLanguageSelect = async (lang, isFrom) => {
        if (isFrom) {
            setShowFromMenu(false);
            await updateSettings({ translation_from: lang });
        } else {
            setShowToMenu(false);
            await updateSettings({ translation_to: lang });
        }
    };

    const handleSwapDirection = async () => {
        await updateSettings({
            translation_from: to,
            translation_to: from
        });
    };

    const renderLanguageButton = (lang, onClick) => {
        return (
            <button
                onClick={onClick}
                className="px-4 py-1.5 rounded-lg bg-zinc-50 hover:bg-[#EAEAEA] transition-colors flex items-center gap-2 shadow-sm"
            >
                <FlagBadge lang={lang} size="md" />
                {languageMeta(lang).name}
            </button>
        );
    };

    const languageOptions = Object.fromEntries(
        Object.entries(LANGUAGES).map(([key, value]) => [key, value.name])
    );

    const renderOption = (key, value) => (
        <div className="flex items-center gap-2">
            <FlagBadge lang={key} />
            {value}
        </div>
    );

    return (
        <motion.div
            className="relative h-full flex flex-col bg-white rounded-2xl p-6 border border-zinc-200 hover:border-zinc-300 transition-all duration-200 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                    <Translate className="w-6 h-6" />
                    {labels.translation_mode}
                </div>
                <button onClick={handleSwapDirection}>
                    <Repeat01 className="w-6 h-6 text-zinc-400 hover:text-zinc-600 transition-colors" />
                </button>
            </div>
            <div className="flex-1 flex flex-col justify-between mt-4">
                <div>
                    <div className="text-sm text-zinc-400">
                        设置你的翻译方向
                    </div>
                    <div className="text-sm text-zinc-400 mt-2">
                        如果前后方向相同，也可以增强语气和语言战斗力。
                    </div>
                </div>
                <div className="flex items-center gap-3 text-2xl font-semibold text-zinc-900">
                    <div className="relative">
                        {renderLanguageButton(from, () => setShowFromMenu(true))}
                        <DropdownMenu
                            options={languageOptions}
                            onSelect={(lang) => handleLanguageSelect(lang, true)}
                            show={showFromMenu}
                            onClose={() => setShowFromMenu(false)}
                            currentValue={from}
                            renderOption={renderOption}
                        />
                    </div>
                    <ArrowRight />
                    <div className="relative">
                        {renderLanguageButton(to, () => setShowToMenu(true))}
                        <DropdownMenu
                            options={languageOptions}
                            onSelect={(lang) => handleLanguageSelect(lang, false)}
                            show={showToMenu}
                            onClose={() => setShowToMenu(false)}
                            currentValue={to}
                            anchorPosition="right-0"
                            renderOption={renderOption}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
