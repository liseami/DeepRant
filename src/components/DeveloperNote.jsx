import { Coffee, SocialX, Macbook } from '../icons';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { showSuccess, showError } from '../utils/toast';
import { Spinner } from '../icons';
// import { openUrl } from '@tauri-apps/plugin-opener';

export default function DeveloperNote() {
  const [currentVersion, setCurrentVersion] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const socialLinks = [
    {
      name: '在 X 上关注纯想',
      url: 'https://x.com/liseami1',
      icon: <SocialX className='w-4 h-4 stroke-zinc-500' />,
    },
    {
      name: '在小红书上关注纯想',
      url: 'https://www.xiaohongshu.com/user/profile/597898e15e87e727f19b1003?',
      icon: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='w-4 h-4 stroke-zinc-500'>
          <rect
            width='18'
            height='18'
            x='3'
            y='3'
            rx='2'
          />
          <path d='M8 16V8l4 4 4-4v8' />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    invoke('get_version')
      .then((version) => {
        setCurrentVersion(version);
      })
      .catch((error) => {
        console.error('获取版本号失败:', error);
      });
  }, []);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      const update = await check();
      if (update) {
        let downloaded = 0;
        let contentLength = 0;

        await update.downloadAndInstall((progress) => {
          if (progress.event === 'Started') {
            contentLength = progress.data.contentLength;
            showSuccess(
              `开始下载更新包 ${(contentLength / 1024 / 1024).toFixed(2)}MB`
            );
          } else if (progress.event === 'Progress') {
            downloaded = progress.data.chunkLength;
            const percent = ((downloaded / contentLength) * 100).toFixed(1);
            showSuccess(`下载进度: ${percent}%`, { duration: 1000 });
          } else if (progress.event === 'Finished') {
            showSuccess('下载完成，准备安装');
          }
        });
        showSuccess('更新已完成，即将重启应用');
        await relaunch();
      } else {
        showSuccess('当前已是最新版本');
      }
    } catch (error) {
      console.error('Update error:', error);
      showError(`更新失败: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenLink = async (url) => {
    try {
      // await openUrl(url);
    } catch (error) {
      showError(`打开链接失败: ${error}`);
    }
  };

  return (
    <div className='flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm'>
      <div className='flex items-center gap-3 text-sm text-zinc-500 mb-6'>
        <Coffee className='w-6 h-6 stroke-zinc-500' />
        开发者说
      </div>
      <div className='flex flex-col gap-4'>
        <div className='text-lg font-medium text-zinc-900 dark:text-white'>
          你好，我是赵纯想
        </div>
        <p className='text-zinc-600 dark:text-zinc-400 leading-relaxed'>
          DeepRant
          是我的一个实验性项目，主要目的：1、在国际服游戏骂战中保证语言优势。2、测试目前尚不流行的Tauri2框架。
          目前这个软件是免费的，我暂时为所有Api调用支付费用。
        </p>

        {socialLinks.map((link, index) => (
          <div
            key={index}
            onClick={() => handleOpenLink(link.url)}
            className='self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer'>
            {link.icon}
            {link.name}
          </div>
        ))}

        <div
          onClick={() => handleOpenLink('https://chunxiang.space')}
          className='self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-950 to-emerald-900 hover:from-emerald-900 hover:to-emerald-800 transition-all transform hover:scale-105 text-sm text-white cursor-pointer shadow-lg ring-2 ring-white/50 ring-offset-2 ring-offset-emerald-950 hover:ring-white/80'>
          <Macbook className='w-4 h-4 stroke-white' />
          纯想0基础全栈开发课程
        </div>

        {updateAvailable && (
          <div className='mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg flex items-center gap-3'>
            <span className='text-sm text-yellow-700 dark:text-yellow-200'>
              新版本 {currentVersion} 可用！
            </span>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className='px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 rounded-full text-sm flex items-center gap-2'>
              {isUpdating ? (
                <>
                  <Spinner className='w-4 h-4 animate-spin' />
                  更新中...
                </>
              ) : (
                '立即更新'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
