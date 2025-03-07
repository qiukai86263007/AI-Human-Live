import { v4 as uuidv4 } from 'uuid';
import { AppConfig } from '../config';

interface TtsRequestData {
  app: {
    appid: string;
    token: string;
    cluster: string;
  };
  user: {
    uid: string;
  };
  audio: {
    voice_type: string;
    encoding: string;
    speed_ratio: number;
    volume_ratio: number;
    pitch_ratio: number;
  };
  request: {
    reqid: string;
    text: string;
    text_type: string;
    operation: string;
    with_frontend: number;
    frontend_type: string;
  };
}

export async function textToSpeech(
  appid: string,
  token: string,
  text: string,
  voiceType: string,
  cluster: string = 'volcano_icl'
): Promise<Buffer> {
  const host = 'openspeech.bytedance.com';
  const apiUrl = `https://${host}/api/v1/tts`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer;${token}`
  };

  const requestData: TtsRequestData = {
    app: {
      appid,
      token: 'access_token',
      cluster
    },
    user: {
      uid: '388808087185088'
    },
    audio: {
      voice_type: voiceType,
      encoding: 'mp3',
      speed_ratio: 1.0,
      volume_ratio: 1.0,
      pitch_ratio: 1.0
    },
    request: {
      reqid: uuidv4(),
      text,
      text_type: 'plain',
      operation: 'query',
      with_frontend: 1,
      frontend_type: 'unitTson'
    }
  };
  await window.$mapi.log.info('请求语音合成接口,文本内容:' + text);
  console.log("请求内容： "+text);
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      await window.$mapi.log.error('请求语音合成接口错误:,错误码' + response.status + ', 错误信息:' + await response.text());
      throw new Error('请求语音合成接口失败');
    }

    const result = await response.json();
    let r = JSON.stringify(result)
    await window.$mapi.log.info('请求语音合成接口成功，返回结果:' + r.slice(0,20)+'.......'+r.slice(-50));

    if (result.data) {
      // 将base64字符串转换为Buffer
      return Buffer.from(result.data, 'base64');
    } else {
      throw new Error('语音合成接口返回数据格式错误');
    }
  } catch (error) {
    await window.$mapi.log.error('语音合成失败: ' + error);
    throw error;
  }
}

// 使用示例:
// const appid = "你的appid";
// const token = "你的access_token";
// const text = "要转换的文本";
// const audioBuffer = await textToSpeech(appid, token, text);
// await window.$mapi.file.writeBuffer('output.mp3', audioBuffer); 