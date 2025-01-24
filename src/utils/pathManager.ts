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
    if (process.platform === 'win32') {
      if (/^[a-zA-Z]:/i.test(normalizedPath)) {
        // 确保 Windows 盘符路径格式正确
        normalizedPath = normalizedPath.replace(/^\/+/, '');
        return `file:///${normalizedPath}`;
      }
      // Windows 下的 UNC 路径处理
      if (normalizedPath.startsWith('//')) {
        return `file:${normalizedPath}`;
      }
    }

    // Mac/Linux 系统或 Windows 下的相对路径
    // 确保路径开头没有多余的斜杠
    normalizedPath = normalizedPath.replace(/^\/+/, '/');
    return `file://${normalizedPath}`;
  }

  /**
   * 从数据库读取的 URL 格式转换为系统可用的文件路径
   * file:///C:/Users/xxx/files/audio.mp3 -> C:\Users\xxx\files\audio.mp3 (Windows)
   * file:///Users/xxx/files/audio.mp3 -> /Users/xxx/files/audio.mp3 (Mac/Linux)
   */
  static fromStoragePath(urlPath: string): string {
    try {
      const fileUrl = new URL(urlPath);
      let path = decodeURIComponent(fileUrl.pathname);
      
      // Windows 系统下处理路径
      if (process.platform === 'win32') {
        // 移除开头的斜杠（针对 Windows 盘符路径）
        path = path.replace(/^\/+([a-zA-Z]:)/, '$1');
        // 转换为反斜杠（Windows 标准路径格式）
        path = path.replace(/\//g, '\\');
        
        // 处理 UNC 路径
        if (path.startsWith('\\\\')) {
          path = path.replace(/^\\+/, '\\\\');
        }
      } else {
        // Mac/Linux 系统确保路径格式正确
        path = path.replace(/^\/+/, '/');
      }
      
      return path;
    } catch (error) {
      // 处理无效的 URL 格式
      console.error('Invalid URL format:', error);
      return urlPath;
    }
  }
}