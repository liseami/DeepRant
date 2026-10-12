/**
 * [INPUT]: 依赖 react-hot-toast 统一展示桌面命令的反馈
 * [OUTPUT]: 提供 showSuccess、showError、errorMessage，兼容 Rust 字符串与 JS Error
 * [POS]: 页面与后台事件的共同错误出口，避免散落控制台报错或未处理 Promise
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import toast from 'react-hot-toast';

export function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export function showSuccess(message) {
  toast.success(message, { duration: 2500 });
}

export function showError(error) {
  toast.error(errorMessage(error), { duration: 6000 });
}
