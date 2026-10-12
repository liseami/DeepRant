/**
 * [INPUT]: 依赖浏览器事件派发与常驻 UpdateManager
 * [OUTPUT]: 提供用户主动检查更新的入口与事件名
 * [POS]: 关于页和托盘更新请求共同汇入 UpdateManager，安装仍需用户点击
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const UPDATE_EVENT = 'deeprant-check-update';

export function requestUpdateCheck() {
  window.dispatchEvent(new Event(UPDATE_EVENT));
}
