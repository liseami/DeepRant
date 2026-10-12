// 由 cromma-ui/scripts/gen-icons.ts 生成，不手改（源：icons/pika）
import type { PikaIconProps } from '../types';
export default function KeyboardWired({
  size = 24,
  color,
  className,
  ariaLabel,
  ...props
}: PikaIconProps) {
  const iconStyle = {
    color: color || 'currentColor'
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={ariaLabel ?? 'keyboard-wired icon'} style={iconStyle} {...props}><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5H8.4c-2.24 0-3.36 0-4.216.436a4 4 0 0 0-1.748 1.748C2 8.04 2 9.16 2 11.4v1.2c0 2.24 0 3.36.436 4.216a4 4 0 0 0 1.748 1.748C5.04 19 6.16 19 8.4 19h7.2c2.24 0 3.36 0 4.216-.436a4 4 0 0 0 1.748-1.748C22 15.96 22 14.84 22 12.6v-1.2c0-2.24 0-3.36-.436-4.216a4 4 0 0 0-1.748-1.748C18.96 5 17.84 5 15.6 5zm0 0v-.75c0-.966.784-1.75 1.75-1.75H14A1.5 1.5 0 0 0 15.5 1m.5 14H8M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01" fill="none" /></svg>;
}