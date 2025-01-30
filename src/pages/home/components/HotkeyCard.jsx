import { motion } from 'framer-motion';
import { KeyboardAlt, Spinner } from '../../../icons';
import { useState, useEffect } from 'react';
import { useStore } from '../../../components/StoreProvider';
import { invoke } from '@tauri-apps/api/core'
import { showSuccess, showError } from '../../../utils/toast';
import { log, logError } from '../../../utils/log';

const isMac = () => {
    return navigator.userAgent.toLowerCase().includes('mac');
};

// 格式化修饰键显示
const formatModifier = (key) => {
    const modifierMap = {
        'Control': isMac() ? '⌃' : 'Ctrl',
        'Alt': isMac() ? '⌥' : 'Alt',
        'Shift': '⇧',
        'Meta': isMac() ? '⌘' : 'Win',
    };
    return modifierMap[key] || key;
};

// 获取按键的标准名称
const getKeyName = (e) => {
    // 处理修饰键
    if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') {
        return e.code;
    }
    // 处理普通键
    return e.code;
};

export default function HotkeyCard() {
    const [isRecording, setIsRecording] = useState(false);
    const [pressedKeys, setPressedKeys] = useState([]);
    const { settings, updateSettings } = useStore();

    // 初始化热键
    const hotkey = settings?.trans_hotkey?.shortcut;

    // 用户按下键时
    const handleKeyDown = (e) => {
        e.preventDefault();
        const keyName = getKeyName(e);
        log('按键按下，keyName:', keyName);
        // 修复:使用数组存储按键,而不是字符串拼接
        setPressedKeys(prev => {
            const newKeys = !prev.includes(keyName) ? [...prev, keyName] : prev;
            log('当前记录的按键数组:', newKeys);
            return newKeys;
        });
    };

    // 用户松开键时
    const handleKeyUp = async (e) => {
        e.preventDefault();
        log('键盘松开事件触发');

        // 使用函数来获取最新的状态值，并且只调用一次update_translator_shortcut
        const keys = await new Promise(resolve => {
            setPressedKeys(currentKeys => {
                log('当前记录的按键数组:', currentKeys);

                if (currentKeys.length === 0) {
                    log('没有有效的按键组合，退出');
                    // 清理事件监听和状态
                    window.removeEventListener('keydown', handleKeyDown);
                    window.removeEventListener('keyup', handleKeyUp);
                    setIsRecording(false);
                    resolve([]);
                    return currentKeys;
                }
                resolve([...currentKeys]);
                return currentKeys;
            });
        });

        if (keys.length > 0) {
            try {
                showSuccess('更新快捷键...');
                log('正在更新系统快捷键...');
                log('准备调用 update_translator_shortcut，参数:', keys);
                await invoke('update_translator_shortcut', {
                    keys
                });
                // 更新成功后，重新获取最新的settings
                const updatedSettings = await invoke('get_settings');
                updateSettings(updatedSettings);
                showSuccess('翻译快捷键设置成功');
                log('快捷键更新成功');
            } catch (err) {
                logError('快捷键更新失败:', err);
                showError('翻译快捷键设置失败: ' + err);
            } finally {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
                setIsRecording(false);
                setPressedKeys([]);
            }
        }
    };

    // 开始录制
    const startRecording = () => {
        setIsRecording(true);
        setPressedKeys([]);
    };

    // 开始录制时添加事件监听
    useEffect(() => {
        if (isRecording) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
            };
        }
    }, [isRecording]);

    // 获取当前显示的快捷键文本
    const getCurrentHotkeyDisplay = () => {
        if (isRecording) {
            if (pressedKeys.length === 0) {
                return (
                    <motion.div
                        className="flex items-center justify-center"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                    >
                        <Spinner className="w-6 h-6 text-zinc-400" />
                    </motion.div>
                );
            }
            return pressedKeys.map(key => {
                if (key.includes('Control') || key.includes('Alt') || key.includes('Shift') || key.includes('Meta')) {
                    return formatModifier(key.replace('Left', '').replace('Right', ''));
                }
                return key.replace('Key', '').replace('Digit', '');
            }).join(' + ');
        }
        let hotkey = settings?.trans_hotkey?.shortcut;
        return hotkey || '未设置';
    };

    return (
        <motion.button
            onClick={startRecording}
            className="h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="flex items-center gap-3 text-sm text-zinc-500">
                <KeyboardAlt className="w-6 h-6 stroke-zinc-500" />
                翻译快捷键
            </div>
            <div className="flex-1 flex flex-col justify-between mt-4">
                <div className="text-sm text-zinc-400">
                    {isRecording ? '请按下新的快捷键组合，松开任意按键完成设置' : '点击设置快捷键'}
                </div>
                <div className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    {getCurrentHotkeyDisplay()}
                </div>
            </div>
        </motion.button>
    );
} 