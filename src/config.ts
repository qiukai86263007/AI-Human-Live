import packageJson from '../package.json';
import { TimeUtil } from '../electron/lib/util';

const BASE_URL = 'https://aigcpanel.com';
const HS_URL = 'https://openspeech.bytedance.com';
const AI_HUMAN_BACKEND_URL = 'http://60.165.239.28:1880/prod-api';

export const AppConfig = {
  name: 'AI数字人直播系统',
  slogan: '一站式AI数字人系统',
  version: packageJson.version,
  website: `${BASE_URL}`,
  websiteGithub: 'https://github.com/modstart-lib/aigcpanel',
  websiteGitee: 'https://gitee.com/modstart-lib/aigcpanel',
  apiBaseUrl: `${BASE_URL}/api`,
  updaterUrl: `${BASE_URL}/app_manager/updater`,
  downloadUrl: `${BASE_URL}/app_manager/download`,
  feedbackUrl: `${BASE_URL}/feedback`,
  statisticsUrl: `${BASE_URL}/app_manager/collect`,
  guideUrl: `${BASE_URL}/app_manager/guide`,
  helpUrl: `${BASE_URL}/app_manager/help`,
  hsAPIConfig: {
    upload: `${HS_URL}/api/v1/mega_tts/audio/upload`,
    status: `${HS_URL}/api/v1/mega_tts/status`,
  },
  basic: {
    userEnable: false,
  },
  aiHuman: {
    taskSubmit: `${AI_HUMAN_BACKEND_URL}/aihuman/task/anonymous/submit`,
    taskDownload: `${AI_HUMAN_BACKEND_URL}/aihuman/task/anonymous/download`,
    taskStatus: `${AI_HUMAN_BACKEND_URL}/aihuman/task/anonymous/status`,
  },
};
