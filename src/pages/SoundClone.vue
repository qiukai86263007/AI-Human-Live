<template>
  <div class="p-6">
    <!-- 顶部标题和按钮区 -->
    <div class="flex justify-between items-center mb-6">
      <div class="text-2xl font-bold">声音克隆</div>
      <div class="flex gap-3">
        <a-button>
          <template #icon>
            <icon-book />
          </template>
          操作手册
        </a-button>
        <a-button type="outline" status="success" @click="handleShowKeyConfig">
          <template #icon>
            <icon-lock />
          </template>
          配置密钥
        </a-button>
        <a-button type="primary" @click="showCloneVoiceDialog = true">
          <template #icon>
            <icon-plus />
          </template>
          新建克隆声音
        </a-button>
        <a-button>
          <template #icon>
            <icon-refresh @click="loadSoundList" />
          </template>
        </a-button>
      </div>
    </div>

    <!-- 空状态提示 -->
    <div v-if="!soundList.length" class="flex flex-col items-center justify-center py-20">
      <div class="text-gray-400 mb-4">
        <icon-sound class="text-6xl" />
      </div>
      <div class="text-gray-400 mb-4">暂无克隆声音，请新建克隆声音</div>
    </div>

    <!-- 声音克隆卡片列表 -->
    <div v-else>
      <div v-for="sound in soundList" :key="sound.id" class="sound-card bg-[#252632] rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between">
          <!-- 左侧信息区域 -->
          <div class="flex items-center">
            <!-- 头像区域 -->
            <div class="relative w-16 h-16 mr-4">
              <div v-if="sound.image_url" class="w-full h-full rounded-lg overflow-hidden">
                <img :src="sound.image_url" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-full h-full rounded-lg bg-[#1D1E2B] flex items-center justify-center">
                <icon-user class="text-2xl text-gray-400" />
              </div>
            </div>
            
            <!-- 基本信息 -->
            <div class="flex flex-col">
              <div class="text-gray-400 font-medium mb-2">{{ sound.name }}</div>
              <div class="flex items-center gap-4 text-sm text-gray-400">
                <span>创建时间：{{ new Date(sound.create_date || '').toLocaleString() }}</span>
                <span>性别：{{ sound.gender_id === 1 ? '男' : '女' }}</span>
                <span>语种：{{ 
                  sound.language_id === 1 ? '普通话' : 
                  sound.language_id === 2 ? '英语' : 
                  sound.language_id === 3 ? '日本语' : '未知'
                }}</span>
                <span>版本：{{ sound.configType === 1 ? '字符版' : '并发版' }}</span>
              </div>
            </div>
          </div>

          <!-- 右侧状态和操作区域 -->
          <div class="flex items-center gap-4">
            <template v-if="sound.state === 'normal'">
              <a-tag color="green">可使用</a-tag>
              <a-button type="text" @click="handlePlayAudio(sound)">
                <template #icon>
                  <icon-play-circle v-if="currentPlayingId !== sound.id" />
                  <icon-pause-circle v-else />
                </template>
                {{ currentPlayingId === sound.id ? '停止' : '试听' }}
              </a-button>
            </template>
            <template v-else-if="sound.state === 'cloning'">
              <a-tag color="blue">克隆中</a-tag>
            </template>
            <template v-else-if="sound.state === 'failed'">
              <a-tag color="red">克隆失败</a-tag>
            </template>
            <template v-else>
              <a-tag color="gray">未知状态</a-tag>
            </template>
            <a-button type="text" @click="handleEdit(sound)">
              <template #icon>
                <icon-edit />
              </template>
              编辑
            </a-button>
            <a-button type="text" status="danger" @click="handleDelete(sound.id)">
              <template #icon>
                <icon-delete />
              </template>
              删除
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <a-modal v-model:visible="showCloneVoiceDialog" title="新建克隆声音" width="500" 
      :ok-button-props="{ loading: saving }"
      :cancel-button-props="{ disabled: saving }"
      :mask-closable="false"
      :closable="!saving"
      @before-ok="handleSaveCloneVoice">
      <div class="clone-voice-form">
        <a-tabs default-active-key="1">
          <a-tab-pane key="1" title="火山引擎">
            <div class="mb-4">
              <div>
                <span class="text-red-500 mr-1">*</span>
                <span>上传音频文件：</span>
              </div>
              <div>
                <span>上传一段音频文件，用于克隆声音。建议上传音频时长为10-30秒，音频质量大于音频的时长，避免多人对话、明显杂音、噪音等情况</span>
              </div>
              <div class="image-upload" @click="handleAudioClick">
                <div class="upload-placeholder">
                  <icon-plus />
                </div>
                <div v-if="audioFileName" class="upload-filename">{{ audioFileName }}</div>
                <div class="upload-text">支持WAV/MP3/M4A格式,建议大小不超过5MB</div>
              </div>
              <input
                type="file"
                id="audioUpload"
                ref="audioUploadRef"
                accept=".wav,.mp3,.m4a"
                class="hidden"
                @change="handleAudioUpload"
              />
            </div>
            <div class="mb-4">
              <div>
                <span class="text-red-500 mr-1">*</span>
                <span>上传音频者封面：</span>
              </div>
              <div>
                <span>上传音频者的图片，用作克隆声音的封面</span>
              </div>
              <div class="image-upload" @click="handleImageClick">
                <div class="upload-placeholder">
                  <icon-plus />
                </div>
                <div v-if="imageFileName" class="upload-filename">{{ imageFileName }}</div>
                <div class="upload-text">支持格式:JPG/PNG/JPEG,建议大小不超过5MB</div>
              </div>
              <input
                type="file"
                id="imageUpload"
                ref="imageUploadRef"
                accept=".jpg,.jpeg,.png"
                class="hidden"
                @change="handleImageUpload"
              />
            </div>
            <div class="mb-4">
              <div class="flex items-center">
                <span class="w-32 flex-shrink-0">
                  <span class="text-red-500 mr-1">*</span>
                  <span>音频源昵称：</span>
                </span>
                <a-input v-model="name" placeholder="请输入姓名" style="width: 150px" />
              </div>
            </div>

            <div class="mb-4">
              <div class="flex items-center">
                <span class="w-32 flex-shrink-0">
                  <span class="text-red-500 mr-1">*</span>
                  <span>音调ID：</span>
                </span>
                <a-input v-model="voiceId" placeholder="请输入音调ID" style="width: 150px" />
              </div>
            </div>

            <div class="mb-4">
              <div class="flex items-center">
                <span class="w-32 flex-shrink-0">
                  <span class="text-red-500 mr-1">*</span>
                  <span>声音版本：</span>
                </span>
                <a-radio-group v-model="version">
                  <a-radio value="1">字符版</a-radio>
                  <a-radio value="2">并发版</a-radio>
                </a-radio-group>
              </div>
            </div>

            <div class="mb-4">
              <div class="flex items-center">
                <span class="w-32 flex-shrink-0">
                  <span class="text-red-500 mr-1">*</span>
                  <span>语种选择：</span>
                </span>
                <a-select v-model="language" style="width: 150px">
                  <a-option value="1">普通话</a-option>
                  <a-option value="2">英语</a-option>
                  <a-option value="3">日本语</a-option>
                </a-select>
              </div>
            </div>

            <div class="mb-4">
              <div class="flex items-center">
                <span class="w-32 flex-shrink-0">
                  <span class="text-red-500 mr-1">*</span>
                  <span>音频者性别：</span>
                </span>
                <a-radio-group v-model="gender">
                  <a-radio value="male">男</a-radio>
                  <a-radio value="female">女</a-radio>
                </a-radio-group>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-modal>

    <a-modal v-model:visible="showKeyConfigDialog" title="配置密钥" width="500" @ok="handleSaveKeyConfig"
      @cancel="handleCancelKeyConfig">
      <div class="key-config-form">
        <a-tabs default-active-key="1">
          <a-tab-pane key="1" title="火山密钥配置">
            <div class="mb-6">
              <div class="font-medium mb-2">火山语音技术-服务接口认证信息</div>
              <div class="mb-4">
                <div>
                  <span class="text-red-500 mr-1">*</span>
                  <span>App ID：</span>
                </div>
                <div>
                  <a-input v-model="keyConfig.app_key" placeholder="请输入App ID" style="width: 400px" />
                </div>
              </div>
              <div class="mb-4">
                <div>
                  <span class="text-red-500 mr-1">*</span>
                  <span>Access Token：</span>
                </div>
                <div>
                  <a-input v-model="keyConfig.access_key_secret" placeholder="请输入Access Token" style="width: 400px" />
                </div>
              </div>
            </div>

            <div class="mb-6">
              <div class="font-medium mb-2">火山引擎API访问密钥</div>
              <div class="mb-4">
                <div>
                  <span class="text-red-500 mr-1">*</span>
                  <span>Access Key ID：</span>
                </div>
                <div>
                  <a-input v-model="keyConfig.hsKeyid" placeholder="请输入Access Key ID" style="width: 400px" />
                </div>
              </div>
              <div class="mb-4">
                <div>
                  <span class="text-red-500 mr-1">*</span>
                  <span>Secret Access Key：</span>
                </div>
                <div>
                  <a-input v-model="keyConfig.hsAccessKey" placeholder="请输入Secret Access Key" style="width: 400px" />
                </div>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Modal, Radio, Input, Select, Option, Message, Tabs, TabPane } from '@arco-design/web-vue';
import { IconPlus, IconLock, IconPlayCircle, IconPauseCircle } from '@arco-design/web-vue/es/icon';
import { v4 as uuidv4 } from 'uuid';
import AudioCharacterService from '../service/AudioCharacterService';
import { PathManager } from '../utils/pathManager';
import HsEngineConfigService from '../service/HsEngineConfigService';
import { doRequest } from '../utils/HsSignUtils';
import { train, getStatus } from '../utils/VoiceCloneUtils';
import { join } from 'path'

interface SoundCloneItem {
  id?: string;
  name?: string;
  canUse: boolean;
  level?: string;
  avatar?: string;
  create_date?: string;
  audio_url?: string;
  image_url?: string;
  state?: string;
  gender_id?: number;
  language_id?: number;
  configType?: number;
  voice_id?: string;
  code?: number;
  expire_time?: string;
  token?: string;
  app_key?: string;
  access_key_secret?: string;
  access_key_id?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
  hsKeyid?: string;
  hsAccessKey?: string;
  version?: number;
}

const soundList = ref<SoundCloneItem[]>([]);

const showCloneVoiceDialog = ref(false);
const selectedPlatform = ref('aliyun');
const name = ref('');
const gender = ref('male');
const language = ref('1');
const voiceId = ref('');
const version = ref('1');

const audioFile = ref<File | null>(null);
const audioFileName = ref('');
const imageFile = ref<File | null>(null);
const imageFileName = ref('');

const audioUploadRef = ref<HTMLInputElement | null>(null);
const imageUploadRef = ref<HTMLInputElement | null>(null);

const showKeyConfigDialog = ref(false);
const keyConfig = ref({
  app_key: '',
  access_key_secret: '',
  hsKeyid: '',
  hsAccessKey: ''
});

// 添加编辑状态和当前编辑项ID
const isEditing = ref(false);
const editingId = ref<string>('');

// 添加保存状态
const saving = ref(false);

// 添加音频播放器引用
const audioPlayer = ref<HTMLAudioElement | null>(null);
const currentPlayingId = ref<string | null>(null);

// 获取克隆音频的公共函数
const getClonedAudio = async (appKey: string, accessKeySecret: string, voiceId: string, name:string): Promise<string> => {
  let retryCount = 0;
  
  while (retryCount < 5) {
    const statusResponse = await getStatus(appKey, accessKeySecret, voiceId);
    const statusData = JSON.parse(statusResponse);
    
    if (statusData.BaseResp.StatusCode === 0) {
      if (statusData.status === 2 && statusData.demo_audio) {
        try {
          const response = await fetch(statusData.demo_audio);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // 确保目录存在
          const fullSubDir = await window.$mapi.file.fullPath(join('audio', 'sound_anchor_cloned'));
          await window.$mapi.file.mkdir(fullSubDir);
          
          // 保存文件
          const fileName = `${voiceId}_${name}.wav`;
          const filePath = join(fullSubDir, fileName);
          await window.$mapi.file.writeBuffer(filePath, buffer, { isFullPath: true });
          
          return PathManager.toStoragePath(filePath);
        } catch (error) {
          console.error('下载克隆音频失败:', error);
        }
      } else if (statusData.status === 3) {
        throw new Error('克隆失败');
      }
    }
    
    retryCount++;
    if (retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('克隆音频尚未就绪');
};

// 重置表单的函数
const resetForm = () => {
  name.value = '';
  gender.value = 'male';
  language.value = '1';
  voiceId.value = '';
  version.value = '1';
  audioFile.value = null;
  audioFileName.value = '';
  imageFile.value = null;
  imageFileName.value = '';
  isEditing.value = false;
  editingId.value = '';
};

// 保存文件到本地
const saveFile = async (file: File, subDir: string): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const ext = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${ext}`;
  const fullSubDir = await window.$mapi.file.fullPath(`${subDir}`);
  const filePath = join(fullSubDir, fileName);
  // 确保目录存在
  await window.$mapi.file.mkdir(fullSubDir);

  // 写入文件
  await window.$mapi.file.writeBuffer(filePath, Buffer.from(buffer),{ isFullPath: true });

  // 转换为标准化的 URL 格式存储到数据库
  return PathManager.toStoragePath(filePath);
};

// 加载声音克隆列表
const loadSoundList = async () => {
  try {
    const list = await AudioCharacterService.list();
    const soundListWithStatus = await Promise.all(list.map(async item => {
      try {
        const statusResponse = await getStatus(item.app_key!, item.access_key_secret!, item.voice_id!);
        const statusData = JSON.parse(statusResponse);
        let state = 'unknown';
        
        if (statusData.BaseResp.StatusCode === 0) {
          switch (statusData.status) {
            case 2:
              state = 'normal';
              break;
            case 1:
              state = 'cloning';
              break;
            case 3:
              state = 'failed';
              break;
            default:
              state = 'unknown';
          }
        }
        return {
          ...item,
          state: state,
          canUse: state === 'normal'
        };
      } catch (error) {
        console.error('获取声音状态失败:', error);
        return {
          ...item,
          state: 'unknown',
          canUse: false
        };
      }
    }));
    soundList.value = soundListWithStatus;
  } catch (error) {
    console.error('加载声音列表失败:', error);
  }
};

// 删除声音克隆
const handleDelete = async (id?: string) => {
  if (!id) return;
  try {
    await Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个声音克隆吗？',
      onOk: async () => {
        await AudioCharacterService.delete(id);
        Message.success('删除成功');
        loadSoundList();
      }
    });
  } catch (error) {
    Message.error('删除失败');
  }
};

// 编辑声音克隆
const handleEdit = async (item: SoundCloneItem) => {
  if (!item.id || !item.name || !item.voice_id) return;
  try {
    isEditing.value = true;
    editingId.value = item.id;
    name.value = item.name;
    gender.value = item.gender_id === 1 ? 'male' : 'female';
    language.value = item.language_id?.toString() || '1';
    voiceId.value = item.voice_id;
    version.value = item.configType?.toString() || '1';
    showCloneVoiceDialog.value = true;
  } catch (error) {
    Message.error('加载编辑数据失败');
  }
};

// 保存密钥配置
const handleSaveKeyConfig = async () => {
  try {
    // 验证所有字段都已填写
    if (!keyConfig.value.app_key || !keyConfig.value.access_key_secret || 
        !keyConfig.value.hsKeyid || !keyConfig.value.hsAccessKey) {
      Message.warning('请填写所有配置项');
      return;
    }
    
    const defaultConfig = await HsEngineConfigService.getDefault();
    if (defaultConfig) {
      // 更新已有配置
      await HsEngineConfigService.update(defaultConfig.id!, {
        app_key: keyConfig.value.app_key,
        access_key_secret: keyConfig.value.access_key_secret,
        hsKeyid: keyConfig.value.hsKeyid,
        hsAccessKey: keyConfig.value.hsAccessKey,
        updater: 'system'
      });
    } else {
      // 创建新配置
      await HsEngineConfigService.create({
        app_key: keyConfig.value.app_key,
        access_key_secret: keyConfig.value.access_key_secret,
        hsKeyid: keyConfig.value.hsKeyid,
        hsAccessKey: keyConfig.value.hsAccessKey,
        state: 'normal',
        creator: 'system',
        updater: 'system'
      });
    }
    
    Message.success('配置保存成功');
    showKeyConfigDialog.value = false;
  } catch (error) {
    Message.error('保存配置失败');
  }
};

// 加载已保存的配置
const loadKeyConfig = async () => {
  try {
    const config = await HsEngineConfigService.getDefault();
    if (config) {
      keyConfig.value = {
        app_key: config.app_key || '',
        access_key_secret: config.access_key_secret || '',
        hsKeyid: config.hsKeyid || '',
        hsAccessKey: config.hsAccessKey || ''
      };
    } 
  } catch (error) {
    console.error('加载配置失败:', error);
  }
};

// 在组件挂载时加载列表和配置
onMounted(() => {
  loadSoundList();
  loadKeyConfig();
});

// 修改保存函数
const handleSaveCloneVoice = async (done: (closed: boolean) => void) => {
  saving.value = true;
  try {
    // 验证必填项
    if (!name.value) {
      Message.error('请输入音频源昵称');
      done(false);
      return;
    }

    if (!voiceId.value) {
      Message.error('请输入音调ID');
      done(false);
      return;
    }

    // 获取配置
    const config = await HsEngineConfigService.getDefault();
    if (!config || !config.app_key || !config.access_key_secret || !config.hsKeyid || !config.hsAccessKey) {
      Message.error('请先配置火山引擎密钥');
      done(false);
      return;
    }

    let clonedAudioPath = '';

    try {
      if (!isEditing.value) {
        // 新建模式的验证
        if (!audioFile.value || !imageFile.value) {
          Message.error('请上传音频文件和封面图片');
          done(false);
          return;
        }

        // 保存文件
        const audioPath = await saveFile(audioFile.value, join('audio', 'sound_anchor_original'));
        const imagePath = await saveFile(imageFile.value, join('images', 'sound_anchor_cover'));
        
        // 训练
        await train(config.app_key, config.access_key_secret, PathManager.fromStoragePath(audioPath), voiceId.value);
        
        // 获取克隆音频
        clonedAudioPath = await getClonedAudio(config.app_key, config.access_key_secret, voiceId.value,name.value);

        // 创建记录
        await AudioCharacterService.create({
          name: name.value,
          gender_id: gender.value === 'male' ? 1 : 2,
          language_id: parseInt(language.value),
          voice_id: voiceId.value,
          state: 'normal',
          configType: parseInt(version.value),
          version: 1,
          image_url: imagePath,
          audio_url: clonedAudioPath,
          creator: 'system',
          code: 0,
          app_key: config.app_key,
          access_key_secret: config.access_key_secret,
          access_key_id: config.access_key_secret,
          hsKeyid: config.hsKeyid,
          hsAccessKey: config.hsAccessKey
        });
      } else {
        // 编辑模式
        // 获取克隆音频
        clonedAudioPath = await getClonedAudio(config.app_key, config.access_key_secret, voiceId.value,name.value);

        // 更新记录
        await AudioCharacterService.update(editingId.value, {
          name: name.value,
          gender_id: gender.value === 'male' ? 1 : 2,
          language_id: parseInt(language.value),
          voice_id: voiceId.value,
          configType: parseInt(version.value),
          audio_url: clonedAudioPath,
          updater: 'system'
        });
      }

      Message.success(isEditing.value ? '更新成功' : '保存成功');
      resetForm();
      await loadSoundList();
      done(true);
    } catch (error) {
      if (error instanceof Error) {
        Message.error(error.message);
      } else {
        Message.error(isEditing.value ? '更新失败' : '保存失败');
      }
      done(false);
    }
  } catch (error) {
    Message.error('操作失败');
    done(false);
  } finally {
    saving.value = false;
  }
};

const handleCancelCloneVoice = () => {
  showCloneVoiceDialog.value = false;
  // 重置所有表单数据
  name.value = '';
  gender.value = 'male';
  language.value = '1';
  voiceId.value = '';
  version.value = '1';
  audioFile.value = null;
  audioFileName.value = '';
  imageFile.value = null;
  imageFileName.value = '';
};

const handleAudioUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    // 检查文件类型
    console.log(file.type);
    if (!['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/x-m4a'].includes(file.type)) {
      Message.error('请上传WAV/MP3/M4A格式的音频文件');
      return;
    }
    // 检查文件大小（5MB = 5 * 1024 * 1024 bytes）
    if (file.size > 5 * 1024 * 1024) {
      Message.error('音频文件大小不能超过5MB');
      return;
    }
    audioFile.value = file;
    audioFileName.value = file.name;
  }
};

const handleImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    // 检查文件类型
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      Message.error('请上传JPG/PNG/JPEG格式的图片');
      return;
    }
    // 检查文件大小（5MB = 5 * 1024 * 1024 bytes）
    if (file.size > 5 * 1024 * 1024) {
      Message.error('图片大小不能超过5MB');
      return;
    }
    imageFile.value = file;
    imageFileName.value = file.name;
  }
};

const handleAudioClick = () => {
  audioUploadRef.value?.click();
};

const handleImageClick = () => {
  imageUploadRef.value?.click();
};

// 显示密钥配置对话框
const handleShowKeyConfig = async () => {
  showKeyConfigDialog.value = true;
  await loadKeyConfig();
};

// 取消密钥配置
const handleCancelKeyConfig = () => {
  showKeyConfigDialog.value = false;
  // 重置配置
  keyConfig.value = {
    app_key: '',
    access_key_secret: '',
    hsKeyid: '',
    hsAccessKey: ''
  };
};

// 添加试听函数
const handlePlayAudio = async (sound: SoundCloneItem) => {
  try {
    if (!sound.audio_url) {
      Message.error('音频文件不存在');
      return;
    }

    // 如果正在播放同一个音频，则停止播放
    if (currentPlayingId.value === sound.id && audioPlayer.value?.paused === false) {
      audioPlayer.value?.pause();
      audioPlayer.value.currentTime = 0;
      currentPlayingId.value = null;
      return;
    }

    // 如果正在播放其他音频，先停止
    if (audioPlayer.value && !audioPlayer.value.paused) {
      audioPlayer.value.pause();
      audioPlayer.value.currentTime = 0;
    }

    // 获取音频文件的完整路径
    const audioPath = PathManager.fromStoragePath(sound.audio_url);
    
    try {
      // 读取音频文件
      const buffer = await window.$mapi.file.readBuffer(audioPath, { isFullPath: true });
      
      // 创建Blob对象，指定MIME类型
      const blob = new Blob([buffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      // 创建新的音频播放器
      audioPlayer.value = new Audio(audioUrl);
      currentPlayingId.value = sound.id || null;

      // 播放结束时清理
      audioPlayer.value.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentPlayingId.value = null;
      };

      // 开始播放
      await audioPlayer.value.play();
    } catch (error) {
      console.error('读取音频文件失败:', error);
      throw error;
    }
  } catch (error) {
    Message.error('音频播放失败: ' + error);
    currentPlayingId.value = null;
  }
};

// 在组件卸载时停止播放
onUnmounted(() => {
  if (audioPlayer.value && !audioPlayer.value.paused) {
    audioPlayer.value.pause();
  }
});
</script>

<style scoped>
.sound-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.clone-voice-form {
  display: flex;
  flex-direction: column;
}

.image-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #ccc;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
}

.upload-filename {
  margin-top: 8px;
  font-size: 14px;
  color: #165DFF;
}

.upload-placeholder {
  font-size: 24px;
  color: #ccc;
}

.upload-text {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.hidden {
  display: none;
}
</style>
