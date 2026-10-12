/**
 * [INPUT]: 依赖 react，.cn 的 cn。
 * [OUTPUT]: 提供 Kbd。Kbd是快捷键小标签。
 * [POS]: cromma-ui的文字原子，用于提示与空态。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { ReactNode } from 'react';
import { cn } from '../cn';

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cn('rounded border border-border bg-muted px-1 font-sans text-xs text-muted-foreground', className)}>{children}</kbd>;
}
