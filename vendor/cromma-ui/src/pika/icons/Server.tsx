/**
 * [INPUT]: PikaIconProps 与原版 pika/server.svg。
 * [OUTPUT]: Server 图标，尺寸/颜色/无障碍属性沿用共用契约。
 * [POS]: 网络 VPS 按钮标识；只转换 JSX 属性名，保留 SVG 路径。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type {PikaIconProps} from '../types';
export default function Server({size=24,color,className,ariaLabel,...props}:PikaIconProps){
    return <svg className={className} role="img" aria-label={ariaLabel ?? "server icon"} style={{color:color||"currentColor"}} {...props} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12h10M7 12c-.464 0-.697 0-.892.022a3.5 3.5 0 0 0-3.086 3.086C3 15.303 3 15.536 3 16s0 .697.022.892a3.5 3.5 0 0 0 3.086 3.086C6.303 20 6.536 20 7 20h10c.464 0 .697 0 .892-.022a3.5 3.5 0 0 0 3.086-3.086C21 16.697 21 16.464 21 16s0-.697-.022-.892a3.5 3.5 0 0 0-3.086-3.086C17.697 12 17.464 12 17 12M7 12c-.464 0-.697 0-.892-.022a3.5 3.5 0 0 1-3.086-3.086C3 8.697 3 8.464 3 8s0-.697.022-.892a3.5 3.5 0 0 1 3.086-3.086C6.303 4 6.536 4 7 4h10c.464 0 .697 0 .892.022a3.5 3.5 0 0 1 3.086 3.086C21 7.303 21 7.536 21 8s0 .697-.022.892a3.5 3.5 0 0 1-3.086 3.086C17.697 12 17.464 12 17 12m-4-4h.01M17 8h.01M13 16h.01M17 16h.01" fill="none"/></svg>;
}
