/**
 * [INPUT]: 依赖 Radix Dialog 的受控状态、焦点边界和 Cromma UI ModalShell
 * [OUTPUT]: 提供 AppDialog，共享 CCBaga 同款模态和关闭后焦点恢复
 * [POS]: 自定义游戏场景与辅助编辑共用的模态边界，业务状态由调用方持有
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useId, useRef } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { ModalShell } from 'cromma-ui';
import { useStore } from './StoreProvider';

export default function AppDialog({ open, onOpenChange, title, description, children, footer, width = 560 }) {
  const { locale } = useStore();
  const titleId = useId();
  const content = useRef(null);
  const previousFocus = useRef(null);
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="app-dialog-overlay" />
      <DialogPrimitive.Content ref={content} className="app-dialog-position" aria-labelledby={titleId} aria-describedby={undefined}
        onOpenAutoFocus={event => {
          previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          event.preventDefault();
          content.current?.focus();
        }}
        onCloseAutoFocus={event => {
          event.preventDefault();
          previousFocus.current?.focus();
        }}>
        <ModalShell title={<DialogPrimitive.Title id={titleId} asChild><span>{title}</span></DialogPrimitive.Title>}
          description={description} onClose={() => onOpenChange(false)} width={width}
          closeLabel={locale === 'en' ? 'Close dialog' : '关闭弹窗'} footer={footer}>
          {children}
        </ModalShell>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
