import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { AppConfig } from '../config';


interface AudioData {
  audio_bytes: string;
  audio_format: string;
}

interface TrainRequestData {
  appid: string;
  speaker_id: string;
  audios: AudioData[];
  source: number;
  language: number;
  model_type: number;
}

export async function train(appid: string, token: string, audioPath: string, spkId: string): Promise<void> {
  const url = `${AppConfig.hsAPIConfig.upload}`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer;${token}`,
    "Resource-Id": "volc.megatts.voiceclone",
  };

  const [encodedData, audioFormat] = await encodeAudioFile(audioPath);
  const audios: AudioData[] = [{
    audio_bytes: encodedData,
    audio_format: audioFormat
  }];

  const data: TrainRequestData = {
    appid,
    speaker_id: spkId,
    audios,
    source: 2,
    language: 0,
    model_type: 1
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  await window.$mapi.log.error('Header: ' +  JSON.stringify(headers));
  console.log("status code = ", response.status);
  
  if (response.status !== 200) {
    await window.$mapi.log.error('请求火山引擎训练接口错误:,错误码' +  response.status+', 错误信息:'+ await response.text());
    throw new Error('请求火山引擎训练接口错误');
  }
  await window.$mapi.log.info('请求火山引擎训练接口成功，返回结果:' + JSON.stringify(response.json()));
  await window.$mapi.log.info("headers = ", JSON.stringify(response.headers));
}

export async function getStatus(appid: string, token: string, spkId: string): Promise<void> {
  const url = `${AppConfig.hsAPIConfig.status}`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer;${token}`,
    "Resource-Id": "volc.megatts.voiceclone",
  };

  const body = {
    appid,
    speaker_id: spkId
  };
  await window.$mapi.log.error('Header: ' +  JSON.stringify(headers)+', Body: '+ JSON.stringify(body));
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  if (response.status !== 200) {
    await window.$mapi.log.error('请求火山引擎状态接口错误:,错误码' +  response.status+', 错误信息:'+ await response.text());
    throw new Error('请求火山引擎状态接口失败');
  }
  await window.$mapi.log.info('请求火山引擎状态接口成功，返回结果:' + await response.json());
}

async function encodeAudioFile(filePath: string): Promise<[string, string]> {
  const buffer = await fs.promises.readFile(filePath);
  const encodedData = buffer.toString('base64');
  const audioFormat = path.extname(filePath).slice(1); // 获取文件扩展名作为音频格式
  return [encodedData, audioFormat];
}

// 使用示例
// const appid = "填入appid";
// const token = "填入access token";
// const spkId = "填入声音ID";
// await train(appid, token, "填入音频路径", spkId);
// await getStatus(appid, token, spkId); 