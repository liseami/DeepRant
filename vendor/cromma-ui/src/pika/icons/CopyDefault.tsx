// 由 cromma-ui/scripts/gen-icons.ts 生成，不手改（源：icons/pika）
import type { PikaIconProps } from '../types';
export default function CopyDefault({
  size = 24,
  color,
  className,
  ariaLabel,
  ...props
}: PikaIconProps) {
  const iconStyle = {
    color: color || 'currentColor'
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={ariaLabel ?? 'copy-default icon'} style={iconStyle} {...props}><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.902 16.902a4 4 0 0 0 .643-.147 5 5 0 0 0 3.21-3.21C21 12.792 21 11.861 21 10s0-2.792-.245-3.545a5 5 0 0 0-3.21-3.21C16.792 3 15.861 3 14 3s-2.792 0-3.545.245a5 5 0 0 0-3.21 3.21 4 4 0 0 0-.147.643m9.804 9.804C17 16.239 17 15.372 17 14c0-1.861 0-2.792-.245-3.545a5 5 0 0 0-3.21-3.21C12.792 7 11.861 7 10 7c-1.373 0-2.24 0-2.902.098m9.804 9.804a4 4 0 0 1-.147.643 5 5 0 0 1-3.21 3.21C12.792 21 11.861 21 10 21s-2.792 0-3.545-.245a5 5 0 0 1-3.21-3.21C3 16.792 3 15.861 3 14s0-2.792.245-3.545a5 5 0 0 1 3.21-3.21c.198-.065.407-.112.643-.147" fill="none" /></svg>;
}