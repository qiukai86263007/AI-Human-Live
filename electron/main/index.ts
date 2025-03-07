/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-03-03 17:32:37
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-03-04 11:09:36
 * @FilePath: \workRome\AI-Human-Live\electron\main\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {app, BrowserWindow, desktopCapturer, session, shell} from 'electron'
import {optimizer} from '@electron-toolkit/utils'
import {join} from 'path'
import fs from 'fs-extra'

/** process.js 必须位于非依赖项的顶部 */
import {isDummy} from "../lib/process";
import {AppEnv, AppRuntime} from "../mapi/env";
import {MAPI} from '../mapi/main';

import {WindowConfig} from "../config/window";
import {AppConfig} from "../../src/config";
import Log from "../mapi/log/main";
import {ConfigMenu} from "../config/menu";
import {ConfigLang} from "../config/lang";
import {ConfigContextMenu} from "../config/contextMenu";
import {preloadDefault, rendererLoadPath} from "../lib/env-main";
import {Page} from "../page";
import {ConfigTray} from "../config/tray";
import {icnsLogoPath, icoLogoPath, logoPath} from "../config/icon";
import {isPackaged} from "../lib/env";
import {executeHooks} from "../lib/hooks";
import {DevToolsManager} from "../lib/devtools";
import {AppsMain} from "../mapi/app/main";
import {Files} from '../mapi/file/main'

const isDummyNew = isDummy

if (process.env['ELECTRON_ENV_PROD']) {
    DevToolsManager.setEnable(false)
}

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

const hasSplashWindow = true

AppEnv.appRoot = process.env.APP_ROOT
AppEnv.appData = app.getPath('appData')
AppEnv.userData = app.getPath('userData')
AppEnv.isInit = true

MAPI.init()
ConfigContextMenu.init()

Log.info('Starting')
Log.info('LaunchInfo', {
    isPackaged,
    userData: AppEnv.userData
})

// 开发环境下复制资源文件到用户数据目录
async function copyResourcesInDev() {
    if (process.env.NODE_ENV === 'development') {
        const userDataPath = app.getPath('userData');
        const resourcePath = join(process.cwd(), 'resources');
        const targetPath = join(userDataPath, 'resources');

        try {
            if (fs.existsSync(resourcePath)) {
                await fs.copy(resourcePath, targetPath);
                console.log('开发环境: 资源文件已复制到用户数据目录');
            }
        } catch (error) {
            console.error('复制资源文件失败:', error);
        }
    }
}

async function createWindow() {
    await copyResourcesInDev();

    let icon = logoPath
    if (process.platform === 'win32') {
        icon = icoLogoPath
    } else if (process.platform === 'darwin') {
        icon = icnsLogoPath
    }
    if (hasSplashWindow) {
        AppRuntime.splashWindow = new BrowserWindow({
            title: AppConfig.name,
            width: 600,
            height: 350,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            hasShadow: true,
            skipTaskbar: true,
        })
        rendererLoadPath(AppRuntime.splashWindow, 'splash.html')
    }
    AppRuntime.mainWindow = new BrowserWindow({
        show: !hasSplashWindow,
        title: AppConfig.name,
        ...(!isPackaged ? {icon} : {}),
        frame: false,
        transparent: false,
        hasShadow: true,
        center: true,
        minWidth: WindowConfig.initWidth,
        minHeight: WindowConfig.initHeight,
        width: WindowConfig.initWidth,
        height: WindowConfig.initHeight,
        backgroundColor: await AppsMain.defaultDarkModeBackgroundColor(),
        webPreferences: {   // 网页功能设置 例如devTools、preload、session、img、webgl
            preload : preloadDefault,
            // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
            nodeIntegration: true,
            webSecurity: false,
            webviewTag: true,
            // Consider using contextBridge.exposeInMainWorld
            // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
            contextIsolation: false,
            // sandbox: false,
        },
    })

    AppRuntime.mainWindow.on('closed', () => {
        AppRuntime.mainWindow = null
    })
    AppRuntime.mainWindow.on('show', async () => {
        await executeHooks(AppRuntime.mainWindow, 'Show')
    });
    AppRuntime.mainWindow.on('hide', async () => {
        await executeHooks(AppRuntime.mainWindow, 'Hide')
    });

    rendererLoadPath(AppRuntime.mainWindow, 'index.html')
    DevToolsManager.register('Main', AppRuntime.mainWindow)

    AppRuntime.mainWindow.webContents.on('did-finish-load', () => {
        if (hasSplashWindow) {
            AppRuntime.mainWindow?.show()
            setTimeout(() => {
                try {
                    AppRuntime.splashWindow?.close()
                    AppRuntime.splashWindow = null
                    // AppRuntime.mainWindow.webContents.openDevTools({
                    //     mode: 'detach',
                    // })
                } catch (e) {
                }
            }, 1000);
        }
        Page.ready('main')
        DevToolsManager.autoShow(AppRuntime.mainWindow)
    })
    AppRuntime.mainWindow.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return {action: 'deny'}
    })
}

app.whenReady()
    .then(() => {
        session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
            desktopCapturer.getSources({types: ['screen']}).then((sources) => {
                // Grant access to the first screen found.
                callback({video: sources[0], audio: 'loopback'})
            })
        })
    })
    .then(ConfigLang.readyAsync)
    .then(() => {
        MAPI.ready()
        ConfigMenu.ready()
        ConfigTray.ready()
        app.on('browser-window-created', (_, window) => {
            optimizer.watchWindowShortcuts(window)
        })
        createWindow().then()
    })

app.on('will-quit', () => {
    MAPI.destroy()
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
    if (AppRuntime.mainWindow) {
        if (AppRuntime.mainWindow.isMinimized()) {
            AppRuntime.mainWindow.restore()
        }
        AppRuntime.mainWindow.show()
        AppRuntime.mainWindow.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        if (!AppRuntime.mainWindow.isVisible()) {
            AppRuntime.mainWindow.show()
        }
        AppRuntime.mainWindow.focus()
    } else {
        createWindow().then()
    }
})
