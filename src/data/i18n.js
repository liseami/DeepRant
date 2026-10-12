/**
 * [INPUT]: 无运行时依赖。键名对齐 Sidebar 的 id 与首页卡片标题。
 * [OUTPUT]: 提供 I18N 词典。仅覆盖侧栏与少量卡片标题。
 * [POS]: 轻量 UI 文案来源。不是全站 i18n 框架。
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

export const I18N = {
  zh: {
    sidebar: {
      home: '主页',
      translate: '模式',
      phrases: '常用语',
      mana: '能量',
      settings: 'AI模型',
      about: '关于',
    },
    card: {
      hotkey: '翻译快捷键',
      game_mode: '游戏模式',
      daily_mode: '日常模式',
      translation_mode: '翻译模式',
    },
  },
  en: {
    sidebar: {
      home: 'Home',
      translate: 'Mode',
      phrases: 'Phrases',
      mana: 'Mana',
      settings: 'AI Model',
      about: 'About',
    },
    card: {
      hotkey: 'Hotkey',
      game_mode: 'Game Mode',
      daily_mode: 'Daily Mode',
      translation_mode: 'Translate',
    },
  },
};

export function uiLocale(lang) {
  return lang === 'en' ? 'en' : 'zh';
}
