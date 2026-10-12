/**
 * [INPUT]: 依赖翻译快捷键设置、原版 SVG 与共享 HotkeyRecorder
 * [OUTPUT]: 提供原版整卡点击录制的翻译快捷键卡片
 * [POS]: 主页游戏内操作入口，快捷键暂停、录制和注册事务交给共享组件与 Rust
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion';
import { KeyboardAlt } from '../../../icons';
import { useStore } from '../../../components/StoreProvider';
import HotkeyRecorder from '../../../components/HotkeyRecorder';

export default function HotkeyCard() {
  const { settings, runCommand, locale, t } = useStore();
  return (
    <motion.div
      className="game-hotkey-card relative h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-3 text-sm text-zinc-500 pointer-events-none">
        <KeyboardAlt className="w-6 h-6 stroke-zinc-500" />
        {locale === 'en' ? 'Translation shortcut' : '翻译快捷键'}
      </div>
      <div className="flex-1 flex flex-col justify-between mt-4 pointer-events-none">
        <div className="text-sm text-zinc-400">{locale === 'en' ? 'Click to set a shortcut' : '点击设置快捷键'}</div>
      </div>
      <HotkeyRecorder hotkey={settings.trans_hotkey} label={t('hotkey')}
        onSave={keys => runCommand('update_translator_shortcut', { keys })} />
    </motion.div>
  );
}
