/**
 * [INPUT]: 依赖 radix-ui 的 Tabs（方向键、roving focus、tablist 语义），.cn 的 cn，control 的 CONTROL_RADIUS。
 * [OUTPUT]: 提供 Tabs。Tabs是variant: segmented | underline；size: small | medium；tabs + value/onValueChange。
 * [POS]: cromma-ui的页签——Kumo Tabs 迁来。segmented 是一条轨道上的滑块，underline 是底边。行为归 Radix，这里只给两种长相。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { ReactNode } from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '../cn';
import { CONTROL_RADIUS } from './control';

export type TabsVariant = 'segmented' | 'underline';
export type TabsSize = 'small' | 'medium';
export interface TabsItem {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export function Tabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  variant = 'segmented',
  size = 'medium',
  fill = false,
  className,
}: {
  tabs: TabsItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  /** underline 时每个 tab 等分整行（个人主页 / 频道那种通栏标签） */
  fill?: boolean;
  className?: string;
}) {
  const compact = size === 'small';
  const underline = variant === 'underline';
  return (
    // 只有标签行、没有面板：面板由调用方按 value 自己换；方向键在标签间移动并选中（Radix 的 roving focus）
    <TabsPrimitive.Root value={value} defaultValue={defaultValue ?? tabs[0]?.value} onValueChange={onValueChange}>
      <TabsPrimitive.List
        className={cn(underline ? (fill ? 'grid w-full border-b border-border' : 'flex gap-1 border-b border-border') : cn('inline-flex bg-muted p-0.5', CONTROL_RADIUS), className)}
        style={underline && fill ? { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` } : undefined}
      >
        {tabs.map((t) => (
          <TabsPrimitive.Trigger
            key={t.value}
            value={t.value}
            disabled={t.disabled}
            className={cn(
              'outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50',
              underline
                ? cn(
                    'border-b-2 border-transparent px-3 py-2 text-base text-muted-foreground hover:text-foreground',
                    'data-[state=active]:border-primary data-[state=active]:font-medium data-[state=active]:text-foreground',
                    fill && 'h-11',
                    compact && 'py-1.5 text-sm',
                  )
                : cn(
                    'rounded-2xl px-3 text-base text-muted-foreground hover:text-foreground',
                    'data-[state=active]:bg-card data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                    compact ? 'h-7 text-sm' : 'h-8',
                  ),
            )}
          >
            {t.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
