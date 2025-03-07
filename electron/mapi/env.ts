/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-03-03 17:32:37
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-03-06 10:06:59
 * @FilePath: \workRome\AI-Human-Live\electron\mapi\env.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {BrowserWindow} from "electron";

export const AppEnv = {
    isInit: false,
    appRoot: null as string,
    appData: null as string,
    userData: null as string,
}

export const AppRuntime = {
    splashWindow: null as BrowserWindow,
    mainWindow: null as BrowserWindow,
    windows: {} as Record<string, BrowserWindow>,
}

export const waitAppEnvReady = async () => {
    while (!AppEnv.isInit) {
        await new Promise(resolve => {
            setTimeout(resolve, 1000)
        })
    }
}

