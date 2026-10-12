/**
 * [INPUT]: 依赖 GAMES from data/scenes；依赖 I18N；依赖 useStore 的 game_scene / daily_mode / custom_scene_*
 * [OUTPUT]: 提供游戏场景选择、日常模式开关、自定义场景名称与提示词
 * [POS]: 首页三卡之一。只读 scenes.js，不维护本地名单。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GamingPad, Repeat01, IMac } from '../../../icons';
import { useStore } from '../../../components/StoreProvider';
import DropdownMenu from '../../../components/DropdownMenu';
import { GAMES } from '../../../data/scenes.js';
import { I18N, uiLocale } from '../../../data/i18n.js';

export default function GameSceneCard() {
    const [showMenu, setShowMenu] = useState(false);
    const [gameName, setGameName] = useState('');
    const { settings, updateSettings } = useStore();

    const gameId = settings?.game_scene || 'lol';
    const isDaily = settings?.daily_mode || false;
    const isCustom = gameId === 'custom';
    const labels = I18N[uiLocale(settings?.ui_language)].card;

    useEffect(() => {
        setGameName(GAMES[gameId] || GAMES.lol);
    }, [gameId]);

    const handleGameSelect = async (nextGameId) => {
        setShowMenu(false);
        await updateSettings({ game_scene: nextGameId });
    };

    const toggleDailyMode = async () => {
        await updateSettings({ daily_mode: !isDaily });
    };

    return (
        <motion.div
            className="relative h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                    {isDaily ? (
                        <IMac className="w-6 h-6 stroke-zinc-500" />
                    ) : (
                        <GamingPad className="w-6 h-6 stroke-zinc-500" />
                    )}
                    {isDaily ? labels.daily_mode : labels.game_mode}
                </div>
                <div className="flex flex-col items-end">
                    <button
                        onClick={toggleDailyMode}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${isDaily
                            ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                            }`}
                    >
                        <span> {isDaily ? labels.game_mode : labels.daily_mode}</span>
                        <Repeat01 className="w-4 h-4 text-zinc-600 hover:text-zinc-600 transition-colors" />
                    </button>
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-between mt-4">
                <div className="text-sm text-zinc-400">
                    {isDaily ? '划词翻译' : ' 合适的游戏场景选择，能保证翻译时更加符合游戏语境，如Moba类游戏中的推塔、gank，fps游戏中的rush等。'}

                </div>
                {!isDaily && (
                    <div className="relative space-y-3">
                        <button
                            onClick={() => setShowMenu(true)}
                            className="px-4 py-1.5 rounded-lg bg-zinc-50 hover:bg-[#EAEAEA] transition-colors text-2xl font-semibold text-zinc-900 dark:text-white"
                        >
                            {gameName}
                        </button>
                        <DropdownMenu
                            show={showMenu}
                            onClose={() => setShowMenu(false)}
                            options={GAMES}
                            currentValue={gameId}
                            onSelect={handleGameSelect}
                        />

                        {/* -------- 自定义场景 -------- */}
                        {isCustom && (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={settings?.custom_scene_name || ''}
                                    onChange={(e) => updateSettings({ custom_scene_name: e.target.value })}
                                    placeholder="场景名称，如 自定义二游"
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-700 dark:text-zinc-300"
                                />
                                <textarea
                                    value={settings?.custom_scene_prompt || ''}
                                    onChange={(e) => updateSettings({ custom_scene_prompt: e.target.value })}
                                    placeholder="语境/对照说明"
                                    rows={3}
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 resize-none"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
