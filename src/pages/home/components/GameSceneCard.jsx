import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GamingPad, Repeat01, SwitchArrowHorizontal, IMac } from '../../../icons';
import { useStore } from '../../../components/StoreProvider';
import DropdownMenu from '../../../components/DropdownMenu';

const GAMES = {
    lol: '英雄联盟',
    dota2: 'Dota 2',
    csgo: 'CS:GO',
    pubg: 'PUBG',
    apex: 'Apex Legends',
    overwatch: '守望先锋',
    valorant: 'Valorant',
    fortnite: 'Fortnite',
    minecraft: 'Minecraft',
    warzone: 'Warzone',
    wow: '魔兽世界'
};

export default function GameSceneCard() {
    const [showMenu, setShowMenu] = useState(false);
    const [gameName, setGameName] = useState('');
    const { settings, updateSettings } = useStore();

    const gameId = settings?.game_scene || 'lol';
    const isDaily = settings?.daily_mode || false;

    useEffect(() => {
        setGameName(GAMES[gameId]);
    }, [gameId]);

    const handleGameSelect = async (gameId) => {
        setShowMenu(false);
        await updateSettings({ game_scene: gameId });
    };

    const toggleDailyMode = async () => {
        await updateSettings({ daily_mode: !isDaily });
    };

    return (
        <motion.div
            className="relative h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl p-6 border border-zinc-200 dark:border-gray-700 hover:border-zinc-300 dark:hover:border-gray-600 transition-all duration-200 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-gray-400">
                    {isDaily ? (
                        <IMac className="w-6 h-6 stroke-zinc-500 dark:stroke-gray-400" />
                    ) : (
                        <GamingPad className="w-6 h-6 stroke-zinc-500 dark:stroke-gray-400" />
                    )}
                    {isDaily ? '日常模式' : '游戏模式'}
                </div>
                <div className="flex flex-col items-end">
                    <button
                        onClick={toggleDailyMode}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                            isDaily
                                ? 'bg-zinc-200 dark:bg-gray-700 text-zinc-700 dark:text-gray-200 hover:bg-zinc-300 dark:hover:bg-gray-600'
                                : 'bg-zinc-100 dark:bg-gray-700 text-zinc-500 dark:text-gray-300 hover:bg-zinc-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <span>{isDaily ? '游戏模式' : '日常模式'}</span>
                        <Repeat01 className="w-4 h-4 text-zinc-600 dark:text-gray-400 hover:text-zinc-600 dark:hover:text-gray-300 transition-colors" />
                    </button>
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-between mt-4">
                <div className="text-sm text-zinc-400 dark:text-gray-400">
                    {isDaily ? '划词翻译' : ' 合适的游戏场景选择，能保证翻译时更加符合游戏语境，如Moba类游戏中的推塔、gank，fps游戏中的rush等。'}
                </div>
                {!isDaily && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(true)}
                            className="px-4 py-1.5 rounded-lg bg-zinc-50 dark:bg-gray-700 hover:bg-[#EAEAEA] dark:hover:bg-gray-600 transition-colors text-2xl font-semibold text-zinc-900 dark:text-white"
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
                    </div>
                )}
            </div>
        </motion.div>
    );
} 