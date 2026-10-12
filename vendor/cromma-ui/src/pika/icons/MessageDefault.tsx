// 由 cromma-ui/scripts/gen-icons.ts 生成，不手改（源：icons/pika）
import type { PikaIconProps } from '../types';
export default function MessageDefault({
  size = 24,
  color,
  className,
  ariaLabel,
  ...props
}: PikaIconProps) {
  const iconStyle = {
    color: color || 'currentColor'
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={ariaLabel ?? 'message-default icon'} style={iconStyle} {...props}><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.2 3H7.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C3 5.28 3 6.12 3 7.8v4.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C5.28 17 6.12 17 7.8 17H8v4l5-4h3.2c1.68 0 2.52 0 3.162-.327a3 3 0 0 0 1.311-1.311C21 14.72 21 13.88 21 12.2V7.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C18.72 3 17.88 3 16.2 3Z" fill="none" /><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10" fill="none" /><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12h7" fill="none" /></svg>;
}