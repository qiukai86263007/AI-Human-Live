export class PathManager {
  /**
   * 将文件路径转换为标准化的 URL 格式存储到数据库
   * Windows: C:\Users\xxx\files\audio.mp3 -> file:///C:/Users/xxx/files/audio.mp3
   * Mac/Linux: /Users/xxx/files/audio.mp3 -> file:///Users/xxx/files/audio.mp3
   */
  static toStoragePath(filePath: string): string {
    // 统一使用正斜杠
    const normalizedPath = filePath.replace(/\\/g, '/');
    // 转换为 file:// URL 格式
    return new URL(`file://${normalizedPath}`).href;
  }

  /**
   * 从数据库读取的 URL 格式转换为系统可用的文件路径
   * file:///C:/Users/xxx/files/audio.mp3 -> C:\Users\xxx\files\audio.mp3 (Windows)
   * file:///Users/xxx/files/audio.mp3 -> /Users/xxx/files/audio.mp3 (Mac/Linux)
   */
  static fromStoragePath(urlPath: string): string {
    const fileUrl = new URL(urlPath);
    // URL.pathname 会自动处理为当前系统的路径格式
    return decodeURIComponent(fileUrl.pathname);
  }
} 