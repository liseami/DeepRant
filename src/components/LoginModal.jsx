import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XClose } from '../icons';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Spinner } from '../icons';
import appIcon from '../assets/app-icon.png';
import { Fragment } from 'react';

export default function LoginModal({ isOpen, onClose }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'code'
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('login', {
        body: { phone },
      });

      if (error) throw error;

      toast.success('验证码已发送');

      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 切换到验证码输入步骤
      setStep('code');
    } catch (error) {
      console.error('发送验证码失败:', error);
      toast.error(error.message || '发送验证码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('verify', {
        body: { phone, code },
      });

      if (error) throw error;

      toast.success('登录成功');
      onClose();
    } catch (error) {
      console.error('验证失败:', error);
      toast.error(error.message || '验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition
      appear
      show={isOpen}
      as={Fragment}>
      <Dialog
        as='div'
        className='relative z-50'
        onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'>
          <div className='fixed inset-0 bg-black/30 backdrop-blur-sm' />
        </Transition.Child>

        <div className='fixed inset-0 flex items-center justify-center p-4'>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0 scale-95'
            enterTo='opacity-100 scale-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100 scale-100'
            leaveTo='opacity-0 scale-95'>
            <Dialog.Panel className='w-[360px] aspect-[3/4] bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_50px_-12px_rgba(255,255,255,0.1)] backdrop-blur-sm'>
              {/* 头部区域 */}
              <div className='p-6 border-b border-zinc-100 dark:border-zinc-800'>
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center gap-3'>
                    <img
                      src={appIcon}
                      alt='DeepRant Logo'
                      className='w-8 h-8 rounded-xl border-2 border-white'
                    />
                    <span className='text-lg font-semibold text-zinc-900 dark:text-white'>
                      DeepRant
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className='p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'>
                    <XClose className='w-5 h-5 text-zinc-500 dark:text-zinc-400' />
                  </button>
                </div>

                <Dialog.Title className='text-2xl font-bold text-zinc-900 dark:text-white'>
                  {step === 'phone' ? '欢迎回来' : '验证身份'}
                </Dialog.Title>
              </div>

              {/* 内容区域 */}
              <div className='p-6 flex-1 flex flex-col'>
                {step === 'phone' ? (
                  <div className='space-y-6 flex-1'>
                    <div className='space-y-1'>
                      <label className='text-sm text-zinc-500 dark:text-zinc-400'>
                        手机号码
                      </label>
                      <input
                        type='tel'
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder='+86 请输入手机号'
                        className='w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent'
                        disabled={loading}
                      />
                    </div>

                    <button
                      onClick={handleSendCode}
                      disabled={!/^1\d{10}$/.test(phone) || loading}
                      className='w-full py-2.5 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed'>
                      {loading ? (
                        <span className='flex items-center justify-center gap-2'>
                          <Spinner className='w-4 h-4 animate-spin' />
                          发送验证码
                        </span>
                      ) : (
                        '获取验证码'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className='space-y-6 flex-1'>
                    <div className='space-y-1'>
                      <label className='text-sm text-zinc-500 dark:text-zinc-400'>
                        验证码
                      </label>
                      <input
                        type='text'
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder='输入6位验证码'
                        maxLength={6}
                        className='w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent'
                        disabled={loading}
                      />
                    </div>

                    <div className='flex items-center justify-between text-sm'>
                      <button
                        onClick={() => setStep('phone')}
                        className='text-zinc-900 hover:text-black dark:text-zinc-200 dark:hover:text-white'
                        disabled={loading}>
                        修改手机号
                      </button>
                      {countdown > 0 ? (
                        <span className='text-zinc-500 dark:text-zinc-400'>
                          {countdown}秒后重试
                        </span>
                      ) : (
                        <button
                          onClick={handleSendCode}
                          className='text-zinc-900 hover:text-black dark:text-zinc-200 dark:hover:text-white'
                          disabled={loading}>
                          重新发送
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleVerifyCode}
                      disabled={code.length !== 6 || loading}
                      className='w-full py-2.5 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed'>
                      {loading ? (
                        <span className='flex items-center justify-center gap-2'>
                          <Spinner className='w-4 h-4 animate-spin' />
                          验证中...
                        </span>
                      ) : (
                        '立即登录'
                      )}
                    </button>
                  </div>
                )}

                {/* 底部声明 */}
                <p className='pt-6 text-xs text-zinc-500 dark:text-zinc-400 text-center border-t border-zinc-100 dark:border-zinc-800'>
                  登录即表示同意
                  <a
                    href='#'
                    className='text-zinc-900 hover:text-black dark:text-white dark:hover:text-zinc-200 ml-1 hover:underline'>
                    用户协议
                  </a>
                </p>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
