/**
 * [INPUT]: 依赖 Cromma UI Panel/Select、Pika、语言目录、国旗与 Rust 设置缓存
 * [OUTPUT]: 提供翻译方向卡片，保留国旗语言选择、双向交换与同语言增强表达
 * [POS]: 游戏主页的语言入口，选择行为和皮肤由同源 Radix 控件承担
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Panel, PanelHeader, PanelAction, Select, motion, MOTION } from 'cromma-ui';
import { Translate, Refresh, ArrowRight } from 'cromma-ui/pika';
import { CN, US, GB, SG, KR, JP, RU, FR, ES, DE, BR } from 'country-flag-icons/react/3x2';
import { useStore } from '../../../components/StoreProvider';
import { LANGUAGES, languageName } from '../../../data/languages';
import { showError } from '../../../utils/toast';

const FLAGS = { zh: CN, en: US, 'en-GB': GB, 'en-SEA': SG, ko: KR, ja: JP, ru: RU, fr: FR, es: ES, de: DE, pt: BR };

export default function TranslationDirectionCard() {
  const { settings, updateSettings, locale, t } = useStore();
  const english = locale === 'en';
  const items = Object.keys(LANGUAGES).map(value => {
    const Flag = FLAGS[value];
    return { value, label: <span className="inline-flex items-center gap-2">
      {Flag && <Flag aria-hidden="true" className="w-4 h-3 rounded-sm shrink-0" />}{languageName(value, locale)}
    </span> };
  });
  return <motion.div className="min-w-0 h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={MOTION.base}>
    <Panel className="h-full">
      <PanelHeader title={<span className="inline-flex items-center gap-2"><Translate size={18} aria-hidden="true" />{english ? 'Translation mode' : '翻译模式'}</span>}
        actions={<PanelAction label={t('swapLanguages')} icon={<Refresh size={18} aria-hidden="true" />} onClick={() => updateSettings({
          translation_from: settings.translation_to, translation_to: settings.translation_from,
        }).catch(showError)} />} />
      <div className="flex-1 min-h-[260px] flex flex-col justify-between gap-6 p-5">
        <div className="text-sm text-muted-foreground leading-relaxed">
          <p>{english ? 'Choose your translation direction' : '设置你的翻译方向'}</p>
          <p className="mt-2">{english ? 'Matching languages can strengthen your tone and your words.' : '如果前后方向相同，也可以增强语气和语言战斗力。'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select aria-label={t('sourceLanguage')} className="min-w-0 flex-1" size="large" items={items} value={settings.translation_from}
            onValueChange={value => updateSettings({ translation_from: value }).catch(showError)} />
          <ArrowRight size={18} aria-hidden="true" className="text-muted-foreground" />
          <Select aria-label={t('targetLanguage')} className="min-w-0 flex-1" size="large" items={items} value={settings.translation_to}
            onValueChange={value => updateSettings({ translation_to: value }).catch(showError)} />
        </div>
      </div>
    </Panel>
  </motion.div>;
}
