import Sidebar from './Sidebar';
import { StoreProvider } from './StoreProvider';
import { Toaster } from 'react-hot-toast';

export default function Layout({ children, activeItem, setActiveItem }) {
    return (
        <StoreProvider>
            <div className="flex h-screen bg-[#F9F9F9] dark:bg-gray-900 overflow-hidden">
                {/* Toast 容器 */}
                <Toaster
                    toastOptions={{
                        className: 'dark:bg-zinc-800 dark:text-white',
                        style: {
                            borderRadius: '12px',
                            background: '#fff',
                            color: '#363636',
                        },
                    }}
                />

                {/* 左侧固定宽度的侧边栏 */}
                <div className="w-[200px] h-screen">
                    <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
                </div>

                {/* 右侧内容区域 */}
                <div className="flex-1 overflow-auto bg-[#F9F9F9] dark:bg-gray-900">
                    <div className="max-w-[1200px] mx-auto h-[calc(100vh-32px)] bg-[#F9F9F9] dark:bg-gray-900 rounded-2xl p-5 overflow-auto">
                        {children}
                    </div>
                </div>
            </div>
        </StoreProvider>
    );
} 