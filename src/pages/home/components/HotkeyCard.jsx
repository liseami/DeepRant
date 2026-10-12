/**
 * [INPUT]: 依赖 StoreProvider 的翻译快捷键与专用更新命令、HotkeyRecorder
 * [OUTPUT]: 提供翻译快捷键录制和平台输入权限说明
 * [POS]: 主页输入能力入口；录制与实际全局注册分属 WebView 和 Rust
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useStore } from '../../../components/StoreProvider';
import HotkeyRecorder from '../../../components/HotkeyRecorder';

export default function HotkeyCard() {
  const { settings, runCommand, t } = useStore();
  return <section className="card">
    <h2>{t('hotkey')}</h2>
    <HotkeyRecorder hotkey={settings.trans_hotkey} onSave={keys => runCommand('update_translator_shortcut', { keys })} />
    <small>{t('hotkeyHelp')}</small>
    <p className="note" style={{ marginTop: 16 }}>{t('inputHelp')}</p>
  </section>;
}
