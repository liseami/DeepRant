// 由 cromma-ui/scripts/gen-icons.ts 生成，不手改（源：icons/pika）
import type { PikaIconProps } from '../types';
export default function Notebook({
  size = 24,
  color,
  className,
  ariaLabel,
  ...props
}: PikaIconProps) {
  const iconStyle = {
    color: color || 'currentColor'
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={ariaLabel ?? 'notebook icon'} style={iconStyle} {...props}><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5.066V21.5m0-16.434c3.025-1.1 7.005-1.71 10 0v15.5c-3.197-1.37-7.063-.401-10 .934m0-16.434c-3.025-1.1-7.005-1.71-10 0v15.5c3.197-1.37 7.063-.401 10 .934" fill="none" /></svg>;
}