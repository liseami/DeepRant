/**
 * [INPUT]: 依赖 Cromma UI Panel/动效、Pika 键盘图标、翻译快捷键设置和共享录制器
 * [OUTPUT]: 提供游戏内翻译快捷键卡片，沿用点击录制和 Rust 注册事务
 * [POS]: 主页输入入口；按键位置、暂停注册及冲突检查在共享录制器和原生后端
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Panel, PanelHeader, motion, MOTION } from 'cromma-ui';
import { KeyboardWired } from 'cromma-ui/pika';
import { useStore } from '../../../components/StoreProvider';
import HotkeyRecorder from '../../../components/HotkeyRecorder';

export default function HotkeyCard() {
  const { settings, runCommand, locale, t } = useStore();
  return <motion.div className="min-w-0 h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={MOTION.base}>
    <Panel className="h-full">
      <PanelHeader title={<span className="inline-flex items-center gap-2"><KeyboardWired size={18} aria-hidden="true" />{t('hotkey')}</span>} />
      <div className="flex-1 min-h-[260px] flex flex-col justify-between gap-6 p-5">
        <div className="text-sm text-muted-foreground leading-relaxed">
          <p>{locale === 'en' ? 'Click to set a shortcut' : '点击设置快捷键'}</p>
          <p className="mt-2">{locale === 'en' ? 'Press a new key combination. Esc cancels.' : '按下新的快捷键组合，Esc 可取消。'}</p>
        </div>
        <div className="self-start">
          <HotkeyRecorder hotkey={settings.trans_hotkey} label={t('hotkey')}
            onSave={keys => runCommand('update_translator_shortcut', { keys })} />
        </div>
      </div>
    </Panel>
  </motion.div>;
}
