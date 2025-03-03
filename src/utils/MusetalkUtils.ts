import { PathManager } from './pathManager';
import { AppConfig } from '../config';

interface RenderParams {
    materialId: string;
    parentTaskId: string;
    audioFiles: Array<{
        scriptId: string;
        audioPath: string;
    }>;
}

export class MusetalkUtils {
    /**
     * 提交音频素材渲染任务
     * @param params 渲染参数
     * @returns Promise<void>
     */
    static async submitRenderTask(params: RenderParams): Promise<void> {
        try {
            await window.$mapi.log.error('渲染任务提交失败sssss:');
            // 上传音频文件到服务器
            const uploadTasks = params.audioFiles.map(async (file) => {
                const audioBuffer = await window.$mapi.file.readBuffer(file.audioPath);
                // TODO: 实现文件上传到服务器的逻辑
                return {
                    scriptId: file.scriptId,
                    audioUrl: file.audioPath
                };
            });

            const uploadedFiles = await Promise.all(uploadTasks);

            // 创建 FormData 对象
            const formData = new FormData();
            formData.append('materialId', params.audioFiles[0].scriptId);
            formData.append('userId', '');
            formData.append('clientId', '');
            formData.append('parentTaskId', params.parentTaskId);
            console.log( params.audioFiles[0].scriptId);
            const audioBuffer = await window.$mapi.file.readBuffer(params.audioFiles[0].audioPath);
                // 创建 Blob 对象
            const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
                // 添加音频文件到 FormData
            console.log(`${params.audioFiles[0].scriptId}.wav`)
            formData.append('file', audioBlob, `${params.audioFiles[0].scriptId}.wavs`);
            console.log(AppConfig.aiHuman.taskSubmit)
            // 提交渲染任务
            const renderTaskResponse = await fetch(AppConfig.aiHuman.taskSubmit, {
                method: 'POST',
                body: formData  // 使用 FormData 替代 JSON
            });

            if (!renderTaskResponse.ok) {
                throw new Error('渲染任务提交失败');
            }

            await window.$mapi.log.info('渲染任务提交成功', {
                materialId: params.materialId,
                parentTaskId: params.parentTaskId
            });

        } catch (error) {
            await window.$mapi.log.error('渲染任务提交失败:', error);
            throw error;
        }
    }
}