import { useState } from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import {
  HomeHLine,
  Settings02,
  Translate,
  UserUser01,
  InfoCircle,
  GodlyWebsite,
} from '../icons';
import appIcon from '../assets/app-icon.png';
// import LoginModal from './LoginModal';

const sidebarItems = [
  { name: '主页', icon: HomeHLine, id: 'home' },
  { name: '模式', icon: Translate, id: 'translate' },
  { name: '常用语', icon: InfoCircle, id: 'phrases' },
  { name: '能量', icon: GodlyWebsite, id: 'mana' },
  { name: 'AI模型', icon: Settings02, id: 'settings' },
  { name: '关于', icon: InfoCircle, id: 'about' },
];

export default function Sidebar({ activeItem, setActiveItem }) {
  // const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className='h-full flex flex-col bg-[#F9F9F9] dark:bg-gray-900'>
      {/* Logo区域 */}
      <div className='px-5 py-5'>
        <div className='flex items-center space-x-2'>
          <div className='rounded-xl flex items-center justify-center overflow-hidden w-[46px] h-[46px] min-w-[46px] border-2 border-white dark:border-gray-700'>
            <img
              src={appIcon}
              alt='DeepRant Logo'
              width='46'
              height='46'
              className='object-cover w-[46px] h-[46px]'
            />
          </div>
          <h3 className='text-[20px] font-semibold text-[#1a1a1a] dark:text-white'>DeepRant</h3>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className='flex-1 px-2 py-2'>
        {sidebarItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className='relative'>
              {isActive && (
                <motion.div
                  layoutId='activeTab'
                  className='absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-[0_4px_8px_-2px_rgba(0,0,0,0.08)]'
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}
              <div
                className={twMerge(
                  'flex items-center px-3.5 py-2.5 cursor-pointer',
                  'text-[14px] font-medium relative z-10',
                  isActive
                    ? 'text-[#1a1a1a] dark:text-white font-semibold'
                    : 'text-[#666666] dark:text-gray-400 hover:text-[#1a1a1a] dark:hover:text-white'
                )}>
                <item.icon
                  className={twMerge(
                    'w-[18px] h-[18px] mr-3',
                    isActive ? 'stroke-[#1a1a1a] dark:stroke-white' : 'stroke-[#666666] dark:stroke-gray-400'
                  )}
                />
                {item.name}
              </div>
            </div>
          );
        })}
      </nav>

      {/* 用户信息 */}
      {/* <div className='px-2 pb-3'>
        <div
          className='flex items-center px-3.5 py-2.5 cursor-pointer text-[#666666] dark:text-gray-400 hover:text-[#1a1a1a] dark:hover:text-white'
          onClick={() => setIsLoginModalOpen(true)}>
          <UserUser01 className='w-[18px] h-[18px] mr-3 stroke-[#666666] dark:stroke-gray-400' />
          <span className='text-[14px] font-medium'>未登录</span>
        </div>
      </div> */}

      {/* <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      /> */}
    </div>
  );
}
