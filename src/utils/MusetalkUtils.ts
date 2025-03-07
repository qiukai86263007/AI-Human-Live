/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-03-03 17:32:38
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-03-05 17:51:21
 * @FilePath: \workRome\AI-Human-Live\src\utils\MusetalkUtils.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { PathManager } from './pathManager';
import { AppConfig } from '../config';

interface RenderParams {
    clientId:string;
          userId:string;
          parentTaskId: string,
          imageIdList: Array<string>,
          audioIdList: Array<string>,
          file: string;
}
export class MusetalkUtils {
    /**
     * 提交音频素材渲染任务
     * @param params 渲染参数
     * @returns Promise<void>
     */
    static async submitRenderTask(params: RenderParams): Promise<void> {
        console.log('到submitRenderTask了')
        try {
            let formData = new FormData();
            console.log(params)
            for (let key in params) {
                if (key != 'file') {
                    formData.append(key, params[key]);
                }else if(key == 'file'){
                    let buffer = await window.$mapi.file.readBuffer(params.file, { isFullPath: true });
                    let blob = new Blob([buffer],{type:'application/zip'})
                    formData.append(key,blob)
                }
            }
            let consoleForm = ()=>{
                console.log('----formData----')
                let formObject = {};
                formData.forEach((value, key) => { formObject[key] = value; });
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
                            name,
                            type:"application/zip"
                        }
                    }
                */
            }
            consoleForm()
            let send = async ()=>{
                const renderTaskResponse = await fetch(AppConfig.aiHuman.taskSubmit, {
                    method: 'POST',
                    body: formData  // 使用 FormData 替代 JSON
                });
            }
            // send();
            // 请求无误，payload为一个formData对象 200发出 等待接口编写 

            // if (!renderTaskResponse.ok) {
            //     throw new Error('渲染任务提交失败');
            // }

            // await window.$mapi.log.info('渲染任务提交成功', {
            //     a:'hello'
            // });

        } catch (error) {
            await window.$mapi.log.error('渲染任务提交失败:', error);
            throw error;
        }
    }
    static async getTaskStatus(taskId: string): Promise<boolean> {
        const response = await fetch(`${AppConfig.aiHuman.taskStatus}?taskId=${taskId}`, {
            method: 'GET',
        });
        const data = await response.json();
        console.log('data',data)
        return data
    }
    static async getRenderedViews(taskId: string): Promise<boolean> {
        // mapi/file 里面有download
            const response = await fetch(`${AppConfig.aiHuman.taskDownload}?taskId=${taskId}`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('获取渲染任务状态失败');
            }

            const data = await response.json();
            console.log('data',data)
            return data.status === 'done';
    }
}
