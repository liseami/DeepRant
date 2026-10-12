// 由 cromma-ui/scripts/gen-icons.ts 生成，不手改（源：icons/pika）
import type { PikaIconProps } from '../types';
export default function CrownWinnerKing({
  size = 24,
  color,
  className,
  ariaLabel,
  ...props
}: PikaIconProps) {
  const iconStyle = {
    color: color || 'currentColor'
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={ariaLabel ?? 'crown-winner-king icon'} style={iconStyle} {...props}><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.23 21.5a20.6 20.6 0 0 0-14.46 0m15.172-3.793L22.426 6.94c.143-.616-.61-1.034-1.058-.587-2.555 2.556-6.89 1.666-8.232-1.69l-.765-1.912a.4.4 0 0 0-.742 0l-.765 1.912C9.522 8.02 5.186 8.91 2.631 6.353c-.447-.447-1.2-.03-1.058.587l2.485 10.767a22.62 22.62 0 0 1 15.884 0Z" fill="none" /></svg>;
}