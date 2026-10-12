/**
 * [INPUT]: 依赖公开语言目录与 StoreProvider 的翻译方向
 * [OUTPUT]: 提供原文 / 目标语言原生选择器与方向互换
 * [POS]: 主页语言控制边界，允许相同语言用于润色
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useStore } from '../../../components/StoreProvider';
import { LANGUAGES, languageName } from '../../../data/languages';
import { showError } from '../../../utils/toast';

export default function TranslationDirectionCard() {
  const { settings, updateSettings, t, locale } = useStore();
  return <section className="card">
    <h2>{t('direction')}</h2>
    <div className="form-grid">
      {[['translation_from', 'sourceLanguage'], ['translation_to', 'targetLanguage']].map(([field, label]) =>
        <label key={field}>{t(label)}<select value={settings[field]} onChange={event => updateSettings({ [field]: event.target.value }).catch(showError)}>
          {Object.keys(LANGUAGES).map(id => <option key={id} value={id}>{languageName(id, locale)}</option>)}
        </select></label>)}
    </div>
    <div className="actions" style={{ marginTop: 16 }}><button type="button" onClick={() => updateSettings({
      translation_from: settings.translation_to, translation_to: settings.translation_from,
    }).catch(showError)}>{t('swapLanguages')}</button></div>
    <small>{t('sameLanguage')}</small>
  </section>;
}
