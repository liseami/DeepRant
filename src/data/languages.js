/**
 * [INPUT]: 依赖后端语言 ID，包括英文地区变体
 * [OUTPUT]: 提供中英语言目录，支持同语言润色
 * [POS]: 主页与手动翻译共用的语言选项，名称不从国旗推断
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const LANGUAGES = {
  zh: ['中文', 'Chinese'],
  en: ['英文', 'English'],
  'en-GB': ['英式英语', 'English (UK)'],
  'en-SEA': ['东南亚英语', 'English (Southeast Asia)'],
  ko: ['韩文', 'Korean'],
  ja: ['日文', 'Japanese'],
  ru: ['俄文', 'Russian'],
  fr: ['法文', 'French'],
  es: ['西班牙文', 'Spanish'],
  de: ['德文', 'German'],
  pt: ['葡文', 'Portuguese'],
};

export function languageName(id, locale) {
  return LANGUAGES[id]?.[locale === 'en' ? 1 : 0] || id;
}
