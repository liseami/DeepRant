import { createContext, useContext, useState, useEffect } from 'react';
import { Store } from '@tauri-apps/plugin-store';

const StoreContext = createContext(null);

// 创建默认设置
const DEFAULT_SETTINGS = {
    translation_from: 'zh',
    translation_to: 'en',
    translation_mode: 'auto',
    game_scene: 'lol',
    daily_mode: false,
    phrases: [],
    custom_model: {
        auth: '',
        api_url: '',
        model_name: ''
    }
};

// 检查是否在 Tauri 环境中
const isTauri = window.__TAURI__ !== undefined;

export function StoreProvider({ children }) {
    const [store, setStore] = useState(null);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initStore = async () => {
            try {
                if (isTauri) {
                    // Tauri 环境：使用 Store API
                    const storeInstance = new Store('.settings.dat');
                    setStore(storeInstance);

                    try {
                        const storedSettings = await storeInstance.get('settings');
                        if (storedSettings) {
                            setSettings(storedSettings);
                        } else {
                            await storeInstance.set('settings', DEFAULT_SETTINGS);
                            await storeInstance.save();
                        }
                    } catch (error) {
                        console.warn('读取 Tauri Store 失败，使用默认设置:', error);
                    }
                } else {
                    // 浏览器环境：使用 localStorage
                    const storedSettings = localStorage.getItem('settings');
                    if (storedSettings) {
                        setSettings(JSON.parse(storedSettings));
                    } else {
                        localStorage.setItem('settings', JSON.stringify(DEFAULT_SETTINGS));
                    }
                }
            } catch (error) {
                console.error('初始化存储失败:', error);
            } finally {
                setLoading(false);
            }
        };

        initStore();
    }, []);

    const updateSettings = async (newSettings) => {
        try {
            const updatedSettings = { ...settings, ...newSettings };
            setSettings(updatedSettings);

            if (isTauri && store) {
                // Tauri 环境：保存到 Store
                await store.set('settings', updatedSettings);
                await store.save();
            } else {
                // 浏览器环境：保存到 localStorage
                localStorage.setItem('settings', JSON.stringify(updatedSettings));
            }
        } catch (error) {
            console.error('更新设置失败:', error);
            setSettings(settings); // 回滚状态
            throw error;
        }
    };

    return (
        <StoreContext.Provider value={{ store, settings, updateSettings, loading }}>
            {children}
        </StoreContext.Provider>
    );
}

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore 必须在 StoreProvider 内部使用');
    }
    return context;
}; 