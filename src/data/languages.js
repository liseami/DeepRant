/**
 * [INPUT]: 无运行时依赖。code 对应 country-flag-icons 的 3x2 国旗。
 * [OUTPUT]: 提供翻译方向语言表，含英式英语。
 * [POS]: TranslationDirectionCard 的唯一语言来源。
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

export const LANGUAGES = {
  zh: { name: '中文', code: 'CN' },
  en: { name: '英文', code: 'US' },
  'en-GB': { name: '英式英语', code: 'GB' },
  'en-SEA': { name: '东南亚英语', code: 'SG' },
  ko: { name: '韩文', code: 'KR' },
  ja: { name: '日文', code: 'JP' },
  ru: { name: '俄文', code: 'RU' },
  fr: { name: '法文', code: 'FR' },
  es: { name: '西班牙文', code: 'ES' },
  de: { name: '德文', code: 'DE' },
  pt: { name: '葡文', code: 'BR' },
};
