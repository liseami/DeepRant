/**
 * [INPUT]: 依赖 TypeScript 的静态资源导入类型机制
 * [OUTPUT]: 提供项目资源声明
 * [POS]: 前端构建的声明边界，不包含运行时业务
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
declare module '@tauri-apps/plugin-updater' {
  interface UpdateResult {
    version: string;
    date: string;
    body: string;
  }
  
  interface UpdateManifest {
    version: string;
    date: string;
    body: string;
  }
  
  function check(): Promise<UpdateResult | null>;
} 