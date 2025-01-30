import { motion } from 'framer-motion';
import { CheckTick } from '../icons';
import { twMerge } from 'tailwind-merge';

export default function DropdownMenu({
    show,
    onClose,
    options,
    currentValue,
    onSelect,
    anchorPosition = 'left-0',
    className = '',
    renderOption
}) {
    return show && (
        <>
            <div
                className="fixed inset-0 z-10"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={twMerge(
                    `absolute z-20 bottom-full mb-2 min-w-[160px] p-2 rounded-xl bg-[#F9F9F9] border-2 border-zinc-100/80 shadow-[0_4px_12px_rgba(0,0,0,0.04)] ${anchorPosition}`,
                    className
                )}
            >
                {Object.entries(options).map(([value, label]) => {
                    const isActive = value === currentValue;
                    return (
                        <button
                            key={value}
                            className={twMerge(
                                'w-full flex items-center px-3.5 py-2.5 text-[14px] relative rounded-lg',
                                isActive
                                    ? 'text-[#1a1a1a] font-semibold bg-white'
                                    : 'text-[#1a1a1a] hover:bg-zinc-100'
                            )}
                            onClick={() => onSelect(value)}
                        >
                            {renderOption ? renderOption(value, label) : label}
                            {isActive && (
                                <CheckTick className="w-6 h-6 ml-auto stroke-[#1a1a1a]" />
                            )}
                        </button>
                    );
                })}
            </motion.div>
        </>
    );
} 