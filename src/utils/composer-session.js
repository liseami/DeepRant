/**
 * [INPUT]: 原生浮窗单调递增的会话编号，以及异步取消 / 回填的完成通知。
 * [OUTPUT]: 提供 ComposerSession 的接收、取消、结束与当前编号核验。
 * [POS]: 浮窗异步生命周期边界；迟到的查询、事件和取消响应不能覆盖新会话，草稿仍由 React 持有。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export class ComposerSession {
  current = null;
  latest = 0;
  ended = 0;
  cancelling = null;

  accept(id) {
    if (!Number.isSafeInteger(id) || id <= this.ended || id < this.latest || id === this.cancelling || id === this.current) return false;
    this.latest = id;
    this.current = id;
    return true;
  }

  owns(id) { return this.current === id; }

  beginCancel(id) {
    this.cancelling = id;
    if (this.owns(id)) this.current = null;
  }

  finish(id) {
    this.ended = Math.max(this.ended, id);
    if (this.cancelling === id) this.cancelling = null;
    if (this.owns(id)) this.current = null;
  }

  cancelFailed(id) {
    if (this.cancelling === id) this.cancelling = null;
    if (this.latest === id && this.ended < id && this.current === null) this.current = id;
  }
}
