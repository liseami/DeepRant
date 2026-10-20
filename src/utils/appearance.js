/**
 * [INPUT]: 依赖 WebView 的 prefers-color-scheme；该值由 Rust desktop_services::apply_appearance 经原生主题驱动
 * [OUTPUT]: 提供 bindDarkClass，让 html.dark 跟随当前窗口的有效深浅色
 * [POS]: html.dark 的唯一拨动处；main.jsx 在每个窗口渲染前调用一次，用户偏好只存 Rust 设置，前端不另存
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export function bindDarkClass() {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const sync = () => document.documentElement.classList.toggle('dark', media.matches);
  sync();
  media.addEventListener('change', sync);
  return () => media.removeEventListener('change', sync);
}
