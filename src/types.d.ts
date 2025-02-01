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