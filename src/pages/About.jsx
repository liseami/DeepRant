/**
 * [INPUT]: 依赖应用版本命令、统一更新请求入口与系统 URL 打开能力
 * [OUTPUT]: 提供版本 / 更新 / 项目链接和实际隐私边界说明
 * [POS]: 关于页仅描述可用功能，安装交给常驻 UpdateManager
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useStore } from '../components/StoreProvider';
import { requestUpdateCheck } from '../utils/updater';
import { showError } from '../utils/toast';

export default function About() {
  const { t } = useStore();
  const [version, setVersion] = useState('');
  useEffect(() => {
    let closed = false;
    invoke('get_version').then(value => { if (!closed) setVersion(value); }).catch(error => { if (!closed) showError(error); });
    return () => { closed = true; };
  }, []);

  return <div className="page-stack">
    <header><h1>{t('aboutTitle')}</h1><p>{t('aboutDescription')}</p></header>
    <section className="card"><h2>{t('version')} {version || '—'}</h2><div className="actions">
      <button type="button" className="primary" onClick={requestUpdateCheck}>{t('checkUpdates')}</button>
      <button type="button" onClick={() => openUrl('https://github.com/liseami/DeepRant/releases').catch(showError)}>{t('project')}</button>
    </div></section>
    <section className="card"><h2>{t('privacy')}</h2><p>{t('privacyHelp')}</p></section>
    <section className="card"><h2>{t('permissions')}</h2><p>{t('permissionsHelp')}</p><p>{t('inputHelp')}</p></section>
  </div>;
}
