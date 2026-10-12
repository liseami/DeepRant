/**
 * [INPUT]: 依赖设置缓存及语言、语境和输入能力卡片
 * [OUTPUT]: 提供主页配置流程、表达风格和平台权限说明
 * [POS]: 面向翻译准备的主页，演示媒体与空白营销区域不参与运行
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import TranslationDirectionCard from './components/TranslationDirectionCard';
import GameSceneCard from './components/GameSceneCard';
import HotkeyCard from './components/HotkeyCard';
import { useStore } from '../../components/StoreProvider';
import { showError } from '../../utils/toast';

export default function Home() {
  const { settings, updateSettings, t } = useStore();
  return <div className="page-stack">
    <header><h1>{t('homeTitle')}</h1><p>{t('homeDescription')}</p></header>
    <div className="grid-two"><div className="page-stack">
      <TranslationDirectionCard />
      <section className="card"><h2>{t('style')}</h2>
        <select aria-label={t('style')} value={settings.translation_mode}
          onChange={event => updateSettings({ translation_mode: event.target.value }).catch(showError)}>
          <option value="auto">{t('styleAuto')}</option><option value="pro">{t('stylePro')}</option><option value="toxic">{t('styleToxic')}</option>
        </select><small>{t('styleHelp')}</small>
      </section><HotkeyCard />
    </div><GameSceneCard /></div>
    <section className="card"><h2>{t('permissions')}</h2><p className="note">{t('permissionsHelp')}</p></section>
  </div>;
}
