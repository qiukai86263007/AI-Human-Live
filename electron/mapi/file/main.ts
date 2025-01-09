import {dialog, ipcMain, shell} from "electron";
import { join } from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import fileIndex from "./index";

ipcMain.handle('file:openFile', async (_, options) => {
    const res = await dialog
        .showOpenDialog({
            properties: ['openFile'],
            ...options
        })
        .catch(e => {
        })
    if (!res || res.canceled) {
        return null
    }
    return res.filePaths?.[0] || null
})

ipcMain.handle('file:openDirectory', async (_, options) => {
    const res = await dialog
        .showOpenDialog({
            properties: ['openDirectory'],
            ...options
        })
        .catch(e => {
        })
    if (!res || res.canceled) {
        return null
    }
    return res.filePaths?.[0] || null
})

ipcMain.handle('file:openSave', async (_, options) => {
    const res = await dialog
        .showSaveDialog({
            ...options
        })
        .catch(e => {
        })
    if (!res || res.canceled) {
        return null
    }
    return res.filePath || null
})

ipcMain.handle('file:openPath', async (_, path, options) => {
    return shell.openPath(path)
})

export default {
    ...fileIndex,
}

export const Files = {
    ...fileIndex,
    
    // 初始化用户资源目录
    async initUserResources() {
        const userDataPath = app.getPath('userData');
        const resourcePath = join(process.cwd(), 'resources');  // 项目中的资源目录

        const dirs = {
            images: {
                anchors: null,    // 主播图片
                products: null,   // 产品图片
                avatars: null     // 头像
            },
            videos: {
                demos: null       // 演示视频
            }
        };

        try {
            // 递归创建目录结构并复制文件
            for (const [mainDir, subDirs] of Object.entries(dirs)) {
                const targetMainDir = join(userDataPath, mainDir);
                const sourceMainDir = join(resourcePath, mainDir);

                // 如果目标主目录不存在，复制整个目录
                if (!fs.existsSync(targetMainDir)) {
                    if (fs.existsSync(sourceMainDir)) {
                        await fs.copy(sourceMainDir, targetMainDir);
                    } else {
                        await fs.mkdirp(targetMainDir);
                    }
                }

                // 创建子目录
                if (subDirs) {
                    for (const subDir of Object.keys(subDirs)) {
                        const targetSubDir = join(targetMainDir, subDir);
                        const sourceSubDir = join(sourceMainDir, subDir);

                        if (!fs.existsSync(targetSubDir)) {
                            if (fs.existsSync(sourceSubDir)) {
                                await fs.copy(sourceSubDir, targetSubDir);
                            } else {
                                await fs.mkdirp(targetSubDir);
                            }
                        }
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('初始化用户资源目录失败:', error);
            return false;
        }
    }
};
