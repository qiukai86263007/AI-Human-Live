export class PathManager {
  /**
   * 将文件路径转换为标准化的 URL 格式存储到数据库
   * Windows: C:\Users\xxx\files\audio.mp3 -> file:///C:/Users/xxx/files/audio.mp3
   * Mac/Linux: /Users/xxx/files/audio.mp3 -> file:///Users/xxx/files/audio.mp3
   */
  static toStoragePath(filePath: string): string {
    // 统一使用正斜杠
    let normalizedPath = filePath.replace(/\\/g, '/');
    
    // Windows 系统下处理盘符路径
    if (process.platform === 'win32' && /^[a-zA-Z]:/i.test(normalizedPath)) {
      // 确保路径以单个斜杠开头
      normalizedPath = normalizedPath.replace(/^\/+/, '');
    }

    // 转换为 file:// URL 格式
    return `file:///${normalizedPath}`;
  }

  /**
   * 从数据库读取的 URL 格式转换为系统可用的文件路径
   * file:///C:/Users/xxx/files/audio.mp3 -> C:\Users\xxx\files\audio.mp3 (Windows)
   * file:///Users/xxx/files/audio.mp3 -> /Users/xxx/files/audio.mp3 (Mac/Linux)
   */
  static fromStoragePath(urlPath: string): string {
    const fileUrl = new URL(urlPath);
    let path = decodeURIComponent(fileUrl.pathname);
    
    // Windows 系统下处理路径
    if (process.platform === 'win32') {
      // 移除开头的斜杠（针对 Windows 盘符路径）
      path = path.replace(/^\/+([a-zA-Z]:)/, '$1');
      // 转换为反斜杠（Windows 标准路径格式）
      path = path.replace(/\//g, '\\');
    }
    
    return path;
  }
}