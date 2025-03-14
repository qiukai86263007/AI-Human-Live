/*
 * @Author: zhjiajia 46287134@qq.com
 * @Date: 2025-03-03 17:32:37
 * @LastEditors: zhjiajia 46287134@qq.com
 * @LastEditTime: 2025-03-13 17:43:33
 * @FilePath: \workRome\AI-Human-Live\electron\mapi\ffmpeg\render.ts
 * @Description: 
 */
import ffmpegPath from "ffmpeg-static";
import {Apps} from "../app";
import {binResolve, isPackaged} from "../../lib/env";

const getBinPath = () => {
    if (isPackaged) {
        return binResolve('ffmpeg/ffmpeg')
    }
    return ffmpegPath
}

const version = async () => {
    const controller = await Apps.spawnShell(`${getBinPath()} -version`)
    const text = await controller.result()
    const match = text.match(/ffmpeg version ([\d.]+)/)
    return match ? match[1] : ''
}

const run = async (args: string[]) => {
    const controller = await Apps.spawnShell(`${getBinPath()} ${args.join(' ')}`)
    return await controller.result()
}

export default {
    version,
    run,
}
