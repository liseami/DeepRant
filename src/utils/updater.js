/**
 * [INPUT]: 依赖 Rust check_desktop_updates 意图命令与统一错误提示。
 * [OUTPUT]: 提供关于页主动检查入口；托盘直接调用相同 Rust 命令。
 * [POS]: 只提交检查意图；更新资源和生命周期不在浏览器建立第二份权威。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { invoke } from '@tauri-apps/api/core';
import { showError } from './toast';

export function requestUpdateCheck() {
  return invoke('check_desktop_updates').catch(showError);
}
