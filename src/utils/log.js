import { invoke } from '@tauri-apps/api/core';

/**
 * 统一的日志工具函数
 * 将日志同时输出到浏览器控制台和后端
 * @param {...any} args - 要记录的参数
 */
export const log = async (...args) => {
    const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    console.log(...args); // 保持浏览器控制台的输出
    await invoke('log_to_backend', { message }); // 发送到后端
};

/**
 * 错误日志工具函数
 * @param {...any} args - 要记录的参数
 */
export const logError = async (...args) => {
    const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    console.error(...args); // 保持浏览器控制台的输出
    await invoke('log_to_backend', { message: `[ERROR] ${message}` }); // 发送到后端
}; 