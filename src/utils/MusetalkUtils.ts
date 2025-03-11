/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-03-03 17:32:38
 * @LastEditors: zhjiajia 46287134@qq.com
 * @LastEditTime: 2025-03-11 16:06:00
 * @FilePath: \workRome\AI-Human-Live\src\utils\MusetalkUtils.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { PathManager } from "./pathManager";
import { AppConfig } from "../config";
import { reject } from "lodash-es";
import { Message } from "@arco-design/web-vue";

interface RenderParams {
    clientId: string;
    userId: string;
    parentTaskId: string;
    imageIdList: Array<string>;
    audioIdList: Array<string>;
    file: string;
}
export class MusetalkUtils {
    /**
     * 提交音频素材渲染任务
     * @param params 渲染参数
     * @returns Promise<void>
     */
    static async submitRenderTask(params: RenderParams): Promise<void> {
        console.log("到submitRenderTask了");

        let formData = new FormData();
        console.log(params);
        for (let key in params) {
            if (key != "file") {
                formData.append(key, params[key]);
            } else if (key == "file") {
                let buffer = await window.$mapi.file.readBuffer(params.file, {
                    isFullPath: true,
                });
                let blob = new Blob([buffer], { type: "application/zip" });
                formData.append(key, blob, `${params.parentTaskId}.zip`); // 后端逻辑通过.zip文件名称判断
            }
        }
        let consoleForm = () => {
            console.log("----formData----");
            let formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });
            console.log(formObject);
            /*
                    {
                        "clientId": "",
                        "userId": "",
                        "parentTaskId": "1741251382463",
                        "imageIdList": "1ffe203237f6472e9eb34929e7679a70,1ffe203237f6472e9eb34929e7679a70,9b2027be0be340c1870fca8ba999b53c,9b2027be0be340c1870fca8ba999b53c",
                        "audioIdList": "b71f0c57-2079-45f8-b39c-3d6dd814aab5,91a5559d-0605-4bc9-be23-6928b0548394,22417e16-9163-478a-bd65-9f5b3eec2588,b17b2bd3-7972-4456-93ff-4cd39e92c9dd",
                        "file":File类型 {
                            size:112312,
                            name：'blob',
                            type:"application/zip"
                        }
                    }
                */
        };
        consoleForm();
        let send = async () => {
            fetch(AppConfig.aiHuman.taskSubmit, {
                method: "POST",
                body: formData, // 使用 FormData 替代 JSON
            })
                .then(async (res) => {
                    let d = await res.json();
                    console.log("submitRenderTask:", d);
                    // 如果成功 显示成功 打印成功
                    if (res.ok) {
                        // response.ok在200~299
                        /*
                            {
                                "msg": "全部提交成功",
                                "code": 200
                            }
                        */
                        Message.success(d.msg);
                        window.$mapi.log.info(
                            "submitRenderTask:" + d.msg + d.code
                        );
                    } else {
                        Message.error(d.msg);
                        window.$mapi.log.error(
                            "submitRenderTask:" + d.msg + d.code
                        );
                    }
                })
                .catch((rej) => {
                    console.error("Network error:", rej);
                    Message.error("Network error:", rej);
                    window.$mapi.log.error(
                        "submitRenderTask Network error:" + rej
                    );
                });
        };
        send();
        // 后续可能 根据失败原因处理重新克隆策略
    }
    static downloadVideo = async () => {
        const url = 'https://tse2-mm.cn.bing.net/th/id/OIP-C.7GLMYPqMlt2LgkbPsOnDIAAAAA?rs=1&pid=ImgDetMain';
        const localPath = 'downloads/downloaded_image.jpg';
    
        await window.$mapi.file.download(url, localPath, { progress: null });
    };
    // 当status为allFinished  开始下载  我会拿到一个压缩包 里面是一个viedos文件夹 名称和音频一一对应
    static async getRenderedViews(taskId: string): Promise<void> {
        // mapi/file 里面有download
        fetch(
            `${AppConfig.aiHuman.taskDownload}?taskId=${taskId}`,
            {
                method: "GET",
            }
        )
        // .then(async res=>{
        //     let d = await res.json();
        //     if(res.ok){
        //         // 一整个的zip
        //     }else{
        //         Message.error(d.msg);
        //         window.$mapi.log.error(
        //             "getRenderedViews:" + d.msg + d.code
        //         );
        //     }
        // })
        // 这里来模拟一下
        .then(async res => {
            let d = await res.json();
            if(res.ok){
                // 一整个的zip
                // let buffer = await window.$mapi.file.readBuffer(d.data, {
                //     isFullPath: true,
                // });
                // let blob = new Blob([buffer], { type: "application/zip" });
                // let file = new File([blob], `${taskId}.zip`);
                
                // 假设已经将buffer流读在了本地
                
            }else {
                Message.error(d.msg);
                window.$mapi.log.error(
                    "getRenderedViews:" + d.msg + d.code
                );
            }
        })
    }
    static async mockGetRenderedViews(taskId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                let zipFilePath = String.raw`C:\Users\Alan\AppData\Roaming\aigcpanel\data\audio\taskByRoom` // 这个路径应该在video下
                zipFilePath = zipFilePath + `\\${taskId}.zip`
                let unzipPath = await window.$mapi.file.unzipFolder(zipFilePath);   // 返回视频所在文件夹
                console.log('unzipPath',unzipPath)
                resolve(unzipPath);
            }, 20);
        });
    }
    static async getTaskStatus(taskId: string): Promise<any> {
        return fetch(
            `${AppConfig.aiHuman.taskStatus}/${taskId}`,    // 接口是这样 而非query
            {
                method: "GET",
            }
        ).then(async res => await res.json() )
        .catch((rej) => {
            console.error("Network error:", rej);
        });
    }
}
