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
        <a-button type="outline" status="success" @click="showKeyConfigDialog = true">
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
        <div class="flex items-center">
          <!-- 头像区域 -->
          <div class="relative w-16 h-16 mr-4">
            <div v-if="sound.avatar" class="w-full h-full rounded-lg overflow-hidden">
              <img :src="sound.avatar" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-full h-full rounded-lg bg-[#1D1E2B] flex items-center justify-center">
              <icon-user class="text-2xl text-gray-400" />
            </div>
          </div>

          <!-- 状态和操作区域 -->
          <div class="flex items-center gap-4">
            <a-tag color="green" v-if="sound.canUse">可使用</a-tag>
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

    <a-modal v-model:visible="showCloneVoiceDialog" title="新建克隆声音" width="500" @ok="handleSaveCloneVoice"
      @cancel="handleCancelCloneVoice">
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
      @cancel="showKeyConfigDialog = false">
      <div class="key-config-form">
        <a-tabs default-active-key="1">
          <a-tab-pane key="1" title="火山密钥配置">
            <div class="mb-6">
              <div class="font-medium mb-2">火山语音技术-服务接口认证信息</div>
              <div class="mb-4">
                <div>
                  <span class="text-red-500 mr-1">*</span>
                  <span>App Key：</span>
                </div>
                <div>
                  <a-input v-model="keyConfig.app_key" placeholder="请输入App Key" style="width: 400px" />
                </div>
              </div>
              <div class="mb-4">
                <div>
                  <span class="text-red-500 mr-1">*</span>
                  <span>Access Key Secret：</span>
                </div>
                <div>
                  <a-input v-model="keyConfig.access_key_secret" placeholder="请输入Access Key Secret" style="width: 400px" />
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
import { ref, onMounted } from 'vue';
import { Modal, Radio, Input, Select, Option, Message, Tabs, TabPane } from '@arco-design/web-vue';
import { IconPlus, IconLock } from '@arco-design/web-vue/es/icon';
import { v4 as uuidv4 } from 'uuid';
import AudioCharacterService from '../service/AudioCharacterService';
import { PathManager } from '../utils/pathManager';
import HsEngineConfigService from '../service/HsEngineConfigService';

interface SoundCloneItem {
  id: string;
  name: string;
  canUse: boolean;
  level?: string;
  avatar?: string;
  create_date?: string;
  audio_url?: string;
  image_url?: string;
  state?: string;
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

// 保存文件到本地
const saveFile = async (file: File, subDir: string): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const ext = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${ext}`;
  const fullSubDir = await window.$mapi.file.fullPath(`${subDir}`);
  const filePath = `${fullSubDir}/${fileName}`;
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
    soundList.value = list.map(item => ({
      id: item.id || '',
      name: item.name || '',
      canUse: item.state === 'normal',
      level: 'L',
      avatar: item.image_url,
      create_date: item.create_date,
      audio_url: item.audio_url,
      image_url: item.image_url,
      state: item.state
    }));
  } catch (error) {
    Message.error('加载声音克隆列表失败');
  }
};

// 删除声音克隆
const handleDelete = async (id: string) => {
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
  try {
    name.value = item.name;
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
    console.error('保存配置失败:', error);
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

const handleSaveCloneVoice = async () => {
  try {
    // 验证必填项
    if (!audioFile.value) {
      Message.error('请上传音频文件');
      return;
    }

    if (!imageFile.value) {
      Message.error('请上传音频者封面');
      return;
    }

    if (!name.value) {
      Message.error('请输入音频源昵称');
      return;
    }

    if (!voiceId.value) {
      Message.error('请输入音调ID');
      return;
    }

    // 保存音频文件
    const audioPath = await saveFile(audioFile.value, 'audio');
    // 保存图片文件
    const imagePath = await saveFile(imageFile.value, 'images');
    // 保存到数据库
    await AudioCharacterService.create({
      name: name.value,
      gender_id: gender.value === 'male' ? 1 : 2,
      language_id: parseInt(language.value),
      voice_id: voiceId.value,
      state: 'normal',
      configType: parseInt(version.value),
      version: 1,
      image_url: imagePath,
      audio_url: audioPath,
      creator: 'system',
      code: 0
    });

    Message.success('保存成功');
    showCloneVoiceDialog.value = false;

    // 刷新列表
    await loadSoundList();

    // 重置表单
    name.value = '';
    gender.value = 'male';
    language.value = '1';
    voiceId.value = '';
    version.value = '1';
    audioFile.value = null;
    audioFileName.value = '';
    imageFile.value = null;
    imageFileName.value = '';

  } catch (error) {
    Message.error('保存失败');
  }
};

const handleCancelCloneVoice = () => {
  showCloneVoiceDialog.value = false;
};

const handleAudioUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    // 检查文件类型
    if (!['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/mpeg'].includes(file.type)) {
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
