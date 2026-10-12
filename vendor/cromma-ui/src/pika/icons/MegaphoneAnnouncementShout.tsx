// 由 cromma-ui/scripts/gen-icons.ts 生成，不手改（源：icons/pika）
import type { PikaIconProps } from '../types';
export default function MegaphoneAnnouncementShout({
  size = 24,
  color,
  className,
  ariaLabel,
  ...props
}: PikaIconProps) {
  const iconStyle = {
    color: color || 'currentColor'
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={ariaLabel ?? 'megaphone-announcement-shout icon'} style={iconStyle} {...props}><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.162 15.312 13.295 22H8.92l-2.116-6.044m4.358-.644c-1.458.166-2.907.423-4.358.644m4.358-.644a27.4 27.4 0 0 1 8.16.296m-12.518.348-1.632.248a5.126 5.126 0 0 1-1.699-6.34l4.67-1.824a27.4 27.4 0 0 0 7.882-4.733m3.296 12.301q.236.137.436.086c.876-.235.825-3.263-.114-6.765-.938-3.5-2.408-6.15-3.283-5.915q-.2.056-.335.293m3.296 12.301c-.873-.504-2.052-2.86-2.847-5.83-.796-2.969-.953-5.598-.449-6.471" fill="none" /></svg>;
}