<template>
  <a-modal
    v-model:visible="modalVisible"
    :title="`AI智能互动设置${platform ? `（平台：${platform}）` : ''}`"
    :footer="false"
    :mask-closable="false"
    :closable="true"
    :width="1200"
    :draggable="true"
    :align-center="false"
    modal-class="platform-settings-modal"
    :style="{ position: 'fixed' }"
    @close.stop="handleClose"
  >
    <div class="flex h-[600px]">
      <!-- 左侧选项卡 -->
      <div class="w-40 border-r border-gray-200">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="py-3 px-6 cursor-pointer"
          :class="currentTab === tab.key ? 'bg-blue-50 text-blue-500' : 'text-gray-500 hover:bg-gray-50'"
          @click="currentTab = tab.key"
        >
          {{ tab.name }}
        </div>
      </div>
      
      <!-- 右侧内容区域 -->
      <div class="flex-1 p-4">
        <!-- 全局设置面板 -->
        <div v-if="currentTab === 'global'" class="h-full">
          <div class="flex flex-col h-full">
            <div class="space-y-6 flex-grow">
              <!-- 运行模式 -->
              <div>
                <div class="mb-2">运行模式</div>
                <div class="flex items-center gap-4">
                  <a-radio-group v-model="settings.runMode">
                    <a-radio :value="0">智能弹夹</a-radio>
                    <a-radio :value="1">实时弹夹</a-radio>
                  </a-radio-group>
                </div>

              </div>
              
              <!-- 发送间隔 -->
              <div>
                <div class="mb-2">发送间隔</div>
                <div class="flex items-center gap-2">
                  <a-input-number
                    v-model="settings.replyDelay"
                    :min="0"
                    :max="100"
                    class="w-24"
                  />
                  <span>每隔*秒发送一次</span>
                </div>
              </div>
              
              <!-- 优先级设置 -->
              <div>
                <div class="mb-2">弹幕优先级设置</div>
                <div class="flex flex-wrap gap-4">
                  <div v-for="item in priorityItems" 
                       :key="item.key" 
                       class="flex items-center gap-2 whitespace-nowrap"
                  >
                    <a-input-number
                      v-model="settings.priorities[item.key]"
                      :min="0"
                      :max="10"
                      :precision="0"
                      class="w-16"
                      size="small"
                    />
                    <span>{{ item.label }}</span>
                  </div>
                </div>
                <div class="text-gray-400 text-sm mt-1">
                  数字越大优先级越高，仅针对智能弹夹模式生效
                </div>
              </div>
            </div>
            
            <!-- 底部保存按钮 -->
            <div class="flex justify-end mt-6 pt-4 border-t">
              <a-button type="primary" @click="handleSave">
                保存当前设置
              </a-button>
            </div>
          </div>
        </div>
        
        <!-- 定时引导面板 -->
        <div v-else-if="currentTab === 'timing'" class="h-full">
          <div class="flex flex-col h-full">
            <!-- 上部分：左右两个面板 -->
            <div class="flex gap-4 flex-grow">
              <!-- 左侧设置区域 -->
              <div class="w-[400px] flex-shrink-0">
                <div class="mb-4 text-lg font-medium">定时引导互动设置</div>
                <!-- 引导内容类型选择 -->
                <div class="mb-4">
                  <div class="mb-2">引导方式</div>
                  <a-radio-group v-model="timingSettings.replyWay">
                    <a-radio :value="0">弹幕</a-radio>
                    <a-radio :value="1">弹幕和助播</a-radio>
                    <a-radio :value="2">助播</a-radio>
                  </a-radio-group>
                </div>
                
                <!-- 引导间隔设置 -->
                <div class="mb-4">
                  <div class="mb-2">引导间隔</div>
                  <div class="flex items-center gap-2">
                    <a-input-number
                      v-model="timingSettings.intervalTime"
                      :min="0"
                      :max="100"
                      class="w-24"
                    />
                    <span>秒</span>
                  </div>
                </div>
                
                <!-- 引导概率设置组 -->
                <div class="mb-4">
                  <div class="mb-2">引导概率</div>
                  <div class="space-y-3">
                    <!-- 综合引导概率 -->
                    <div class="flex items-center gap-2">
                      <span class="w-24">综合引导：</span>
                      <a-input-number
                        v-model="timingSettings.chances.all"
                        :min="0"
                        :max="100"
                        class="w-20"
                      />
                      <span>%</span>
                    </div>
                    <!-- 关注引导概率 -->
                    <div class="flex items-center gap-2">
                      <span class="w-24">关注引导：</span>
                      <a-input-number
                        v-model="timingSettings.chances.follow"
                        :min="0"
                        :max="100"
                        class="w-20"
                      />
                      <span>%</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-24">消费引导：</span>
                      <a-input-number
                        v-model="timingSettings.chances.cost"
                        :min="0"
                        :max="100"
                        class="w-20"
                      />
                      <span>%</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-24">分享引导：</span>
                      <a-input-number
                        v-model="timingSettings.chances.share"
                        :min="0"
                        :max="100"
                        class="w-20"
                      />
                      <span>%</span>
                    </div>
                  </div>
                </div>
                
                <!-- 引导发送方式 -->
                <div class="mb-4">
                  <div class="mb-2">发送方式</div>
                  <a-radio-group v-model="timingSettings.runMode">
                    <a-radio :value="0">顺序发送</a-radio>
                    <a-radio :value="1">随机发送</a-radio>
                  </a-radio-group>
                </div>
              </div>
              
              <!-- 右侧内容区域 -->
              <div class="flex-grow">
                <div class="mb-4 text-lg font-medium">引导内容设置</div>
                <!-- 引导类型选项卡 -->
                <a-tabs v-model:activeKey="currentGuideType" @change="handleTabChange">
                  <a-tab-pane key="综合引导" title="综合引导" />
                  <a-tab-pane key="关注引导" title="关注引导" />
                  <a-tab-pane key="消费引导" title="消费引导" />
                  <a-tab-pane key="分享引导" title="分享引导" />
                </a-tabs>
                
                <!-- 引导内容列表 -->
                <div>
                  <div class="flex mb-4">
                    <a-button type="primary" @click="addGuide">
                      <template #icon>
                        <icon-plus />
                      </template>
                      添加引导
                    </a-button>
                  </div>
                  <div class="rounded-lg p-4 h-[400px] overflow-y-auto">
                    <template v-if="getGuideList(currentGuideType).length">
                      <div v-for="guide in getGuideList(currentGuideType)" 
                           :key="guide.id"
                           class="border border-gray-600 rounded-lg p-4 mb-3 last:mb-0"
                      >
                        <div class="flex items-center justify-between">
                          <div>{{ guide.content }}</div>
                          <div class="flex items-center gap-2">
                            <a-button type="text" size="mini" @click="editGuide(guide)">
                              <template #icon>
                                <icon-edit />
                              </template>
                            </a-button>
                            <a-button type="text" size="mini" status="danger" @click="deleteGuide(guide.id)">
                              <template #icon>
                                <icon-delete />
                              </template>
                            </a-button>
                          </div>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="text-gray-400 text-center py-20">
                        暂无引导内容
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 底部面板 -->
            <div class="flex justify-end items-center h-16 mt-4 pt-4 border-t border-gray-200">
              <a-button type="primary" @click="saveTimingSettings">
                保存当前设置
              </a-button>
            </div>
          </div>
        </div>
        
        <!-- 人气互动面板 -->
        <div v-else-if="currentTab === 'popularity'" class="h-full">
          <div class="flex flex-col h-full">
            <!-- 上部分：左右两个面板 -->
            <div class="flex gap-4 flex-grow">
              <!-- 左侧设置区域 -->
              <div class="w-[400px] flex-shrink-0">
                <div class="mb-4 text-lg font-medium">新增点赞互动设置</div>
                <!-- 互动方式 -->
                <div class="mb-4">
                  <div class="mb-2">新增点赞互动方式</div>
                  <a-radio-group v-model="popularitySettings.replyMode">
                    <a-radio value="danmu">弹幕</a-radio>
                    <a-radio value="host">主播</a-radio>
                    <a-radio value="both">弹幕和助播</a-radio>
                  </a-radio-group>
                </div>
                <!-- 新增点赞触发条件 -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span>新增点赞触发条件</span>
                    <a-button type="primary" size="small" @click="addLikeRule">
                      <template #icon>
                        <icon-plus />
                      </template>
                      添加条件
                    </a-button>
                  </div>
                  <!-- 触发规则列表 -->
                  <div class="rounded-lg p-4 h-[400px] overflow-y-auto">
                    <template v-if="popularitySettings.likeRules.length">
                      <div v-for="rule in popularitySettings.likeRules" 
                           :key="rule.id"
                           class="border border-gray-600 rounded-lg p-4 mb-3 last:mb-0"
                      >
                        <div class="flex items-center justify-between">
                          <div>
                            <div class="flex items-center gap-2">
                              <a-input-number
                                v-model="rule.count"
                                :min="0"
                                class="w-24"
                              />
                              <span>时，互动内容</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-2">
                            <a-button type="text" size="mini" @click="editLikeRule(rule)">
                              <template #icon>
                                <icon-edit />
                              </template>
                            </a-button>
                            <a-button type="text" size="mini" status="danger" @click="deleteLikeRule(rule.id)">
                              <template #icon>
                                <icon-delete />
                              </template>
                            </a-button>
                          </div>
                        </div>
                        <!-- 内容输入框 -->
                        <div class="mt-2">
                          <a-textarea
                            v-model="rule.content"
                            placeholder="请输入互动内容"
                            :auto-size="{ minRows: 2, maxRows: 3 }"
                            class="border border-gray-600"
                          />
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="text-gray-400 text-center py-20">
                        暂无触发规则
                      </div>
                    </template>
                  </div>
                </div>
              </div>
              
              <!-- 右侧内容区域 -->
              <div class="flex-grow">
                <div class="mb-4 text-lg font-medium">在线人数互动设置</div>
                <!-- 互动方式 -->
                <div class="mb-4">
                  <div class="mb-2">新增在线人数互动方式</div>
                  <a-radio-group v-model="popularitySettings.onlineReplyMode">
                    <a-radio value="danmu">弹幕</a-radio>
                    <a-radio value="assistant">助播</a-radio>
                    <a-radio value="both">弹幕和助播</a-radio>
                  </a-radio-group>
                </div>
                
                <!-- 添加条件按钮 -->
                <div class="flex items-center justify-between mb-4">
                  <span>在线人数触发条件</span>
                  <a-button type="primary" @click="addOnlineRule">
                    <template #icon>
                      <icon-plus />
                    </template>
                    添加条件
                  </a-button>
                </div>
                <!-- 内容列表 -->
                <div class="rounded-lg p-4 h-[400px] overflow-y-auto">
                  <template v-if="popularitySettings.onlineRules.length">
                    <div v-for="rule in popularitySettings.onlineRules" 
                         :key="rule.id"
                         class="border border-gray-600 rounded-lg p-4 mb-3 last:mb-0"
                    >
                      <div class="flex items-center justify-between">
                        <div>
                          <div class="flex items-center gap-2">
                            <a-input-number
                              v-model="rule.count"
                              :min="0"
                              class="w-24"
                            />
                            <span>时，互动内容</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <a-button type="text" size="mini" @click="editOnlineRule(rule)">
                            <template #icon>
                              <icon-edit />
                            </template>
                          </a-button>
                          <a-button type="text" size="mini" status="danger" @click="deleteOnlineRule(rule.id)">
                            <template #icon>
                              <icon-delete />
                            </template>
                          </a-button>
                        </div>
                      </div>
                      <!-- 内容输入框 -->
                      <div class="mt-2">
                        <a-textarea
                          v-model="rule.content"
                          placeholder="请输入互动内容"
                          :auto-size="{ minRows: 2, maxRows: 3 }"
                          class="border border-gray-600"
                        />
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="text-gray-400 text-center py-20">
                      暂无互动内容
                    </div>
                  </template>
                </div>
              </div>
            </div>
            
            <!-- 底部面板 -->
            <div class="flex justify-end items-center h-16 mt-4 pt-4 border-t border-gray-200">
              <a-button type="primary">
                保存当前设置
              </a-button>
            </div>
          </div>
        </div>
        
        <!-- 礼物感谢面板 -->
        <div v-else-if="currentTab === 'gift'" class="h-full">
          <div class="flex flex-col h-full">
            <!-- 上部分：左右两个面板 -->
            <div class="flex gap-4 flex-grow">
              <!-- 左侧设置区域 -->
              <div class="w-[400px] flex-shrink-0">
                <div class="mb-4 text-lg font-medium">礼物感谢互动设置</div>
                <!-- 互动方式 -->
                <div class="mb-4">
                  <div class="mb-2">感谢方式</div>
                  <a-radio-group v-model="giftSettings.replyMode">
                    <a-radio value="danmu">弹幕</a-radio>
                    <a-radio value="assistant">助播</a-radio>
                    <a-radio value="both">弹幕和助播</a-radio>
                  </a-radio-group>
                </div>
                
                <!-- 引导间隔设置 -->
                <div class="mb-4">
                  <div class="mb-2">礼物感谢规则</div>
                  <div class="space-y-3">
                    <a-radio-group v-model="giftSettings.thankRule">
                      <div class="flex flex-col gap-2">
                        <a-radio value="all">不管礼物数量还是大小，全部感谢</a-radio>
                        <a-radio value="threshold">
                          <div class="flex items-center gap-2">
                            <span>只感谢礼物单次金额大于</span>
                            <a-input-number
                              v-model="giftSettings.minThreshold"
                              :min="0"
                              class="w-20"
                              :disabled="giftSettings.thankRule !== 'threshold'"
                            />
                            <span>抖币的礼物</span>
                          </div>
                        </a-radio>
                      </div>
                    </a-radio-group>
                  </div>
                </div>
                
                <!-- 礼物等级定义 -->
                <div class="mb-4">
                  <div class="mb-2">礼物等级定义</div>
                  <div class="flex items-center gap-2">
                    <span class="whitespace-nowrap">  小于</span>
                    <a-input-number
                      v-model="giftSettings.giftThreshold"
                      :min="0"
                      class="w-24"
                    />
                    <span class="flex-shrink-0">抖币礼物属于小额礼物，否则属于大额礼物</span>
                  </div>
                </div>
              </div>
              
              <!-- 右侧内容区域 -->
              <div class="flex-grow">
                <div class="mb-4 text-lg font-medium">引导内容设置</div>
                <!-- 引导类型选项卡 -->
                <a-tabs v-model:activeKey="currentGiftType" @change="handleGiftTabChange">
                  <a-tab-pane key="小额礼物感谢" title="小额礼物感谢" />
                  <a-tab-pane key="大额礼物感谢" title="大额礼物感谢" />
                </a-tabs>
                
                <!-- 添加条件按钮 -->
                <div class="flex mb-4">
                  <a-button type="primary">
                    <template #icon>
                      <icon-plus />
                    </template>
                    添加引导
                  </a-button>
                </div>
                <!-- 引导内容列表 -->
                <div>
                  <div class="rounded-lg p-4 h-[400px] overflow-y-auto">
                    <template v-if="getGuideList(currentGiftType).length">
                      <div v-for="guide in getGuideList(currentGiftType)" 
                           :key="guide.id"
                           class="border border-gray-600 rounded-lg p-4 mb-3 last:mb-0"
                      >
                        <div class="flex items-center justify-between">
                          <div>{{ guide.content }}</div>
                          <div class="flex items-center gap-2">
                            <a-button type="text" size="mini">
                              <template #icon>
                                <icon-edit />
                              </template>
                            </a-button>
                            <a-button type="text" size="mini" status="danger">
                              <template #icon>
                                <icon-delete />
                              </template>
                            </a-button>
                          </div>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="text-gray-400 text-center py-20">
                        暂无引导内容
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 底部面板 -->
            <div class="flex justify-end items-center h-16 mt-4 pt-4 border-t border-gray-200">
              <a-button type="primary">
                保存当前设置
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <a-modal
      v-model:visible="showEditGuideDialog"
      title="编辑引导内容"
      @ok="handleEditGuideConfirm"
      @cancel="showEditGuideDialog = false"
    >
      <a-textarea
        v-model="editingGuide.content"
        placeholder="请输入引导内容"
        :auto-size="{ minRows: 3, maxRows: 6 }"
      />
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed, ref, reactive, onMounted, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import OverallSituationConfigService, { OverallSituationConfigRecord } from '../../service/OverallSituationConfigService';
import RegularInteractionConfigService from '../../service/RegularInteractionConfigService';

interface Settings {
  runMode: number;
  replyDelay: number;
  priorities: {
    regularInteraction: number;
    ordinaryUser: number;
    giftThank: number;
    qanda: number;
    aiChat: number;
  };
  naturalLanguageSwitch: number;
  anchorNick: string;
}

// 设置数据的默认值
const defaultSettings = {
  runMode: 0,
  replyDelay: 10,
  priorities: {
    regularInteraction: 3,
    ordinaryUser: 2,
    giftThank: 4,
    qanda: 5,
    aiChat: 1
  },
  naturalLanguageSwitch: 1,
  anchorNick: ''
};

// 初始化设置
const settings = ref({ ...defaultSettings });

// 选项卡配置
const tabs = [
  { key: 'global', name: '全局设置' },
  { key: 'timing', name: '定时引导' },
  { key: 'popularity', name: '人气互动' },
  { key: 'gift', name: '礼物感谢' },
];

// 当前选中的选项卡
const currentTab = ref('global');

const props = defineProps<{
  visible: boolean;
  platform?: string;
  liveId?: string;
}>();

const emit = defineEmits(['update:visible', 'close']);

// 使用计算属性处理 v-model
const modalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 处理返回
const handleBack = () => {
  emit('back');
};

// 处理关闭
const handleClose = (e: Event) => {
  // 阻止事件冒泡
  e?.stopPropagation();
  emit('close');
  emit('update:visible', false);
};

// 处理保存
const handleSave = async () => {
  if (!props.liveId) {
    Message.warning('直播间ID未设置');
    return;
  }
  
  try {
    const config = await OverallSituationConfigService.getByLiveId(props.liveId);
    if (config?.id) {
      await OverallSituationConfigService.update(config.id, {
        operation_mode: settings.value.runMode,
        operation_time: settings.value.replyDelay,
        regular_interaction_priority: settings.value.priorities.regularInteraction,
        ordinary_user_priority: settings.value.priorities.ordinaryUser,
        gift_thank_priority: settings.value.priorities.giftThank,
        qanda_priority: settings.value.priorities.qanda,
        aiChat_priority: settings.value.priorities.aiChat,
        globalnatural_language_switch: settings.value.naturalLanguageSwitch,
        globalanchor_nick: settings.value.anchorNick,
        platform: props.platform,
        updater: 'system'
      });
      Message.success('保存成功');
    }
  } catch (error) {
    console.error('保存全局设置失败:', error);
    Message.error('保存失败');
  }
};

// 优先级配置
const priorityItems = [
  { key: 'regularInteraction', label: '常规互动' },
  { key: 'ordinaryUser', label: '普通用户' },
  { key: 'giftThank', label: '礼物感谢' },
  { key: 'qanda', label: '问答' },
  { key: 'aiChat', label: 'AI聊天' }
];

// 加载全局设置
const loadGlobalSettings = async () => {
  if (!props.liveId) return;
  
  try {
    const config = await OverallSituationConfigService.getByLiveId(props.liveId);
    if (config) {
      settings.value = {
        runMode: config.operation_mode ?? defaultSettings.runMode,
        replyDelay: config.operation_time ?? defaultSettings.replyDelay,
        priorities: {
          regularInteraction: config.regular_interaction_priority ?? defaultSettings.priorities.regularInteraction,
          ordinaryUser: config.ordinary_user_priority ?? defaultSettings.priorities.ordinaryUser,
          giftThank: config.gift_thank_priority ?? defaultSettings.priorities.giftThank,
          qanda: config.qanda_priority ?? defaultSettings.priorities.qanda,
          aiChat: config.aiChat_priority ?? defaultSettings.priorities.aiChat
        },
        naturalLanguageSwitch: config.globalnatural_language_switch ?? defaultSettings.naturalLanguageSwitch,
        anchorNick: config.globalanchor_nick || defaultSettings.anchorNick
      };
    } else {
      // 创建新配置，使用默认值
      const id = await OverallSituationConfigService.create({
        live_id: props.liveId,
        platform: props.platform,
        operation_mode: defaultSettings.runMode,
        operation_time: defaultSettings.replyDelay,
        regular_interaction_priority: defaultSettings.priorities.regularInteraction,
        ordinary_user_priority: defaultSettings.priorities.ordinaryUser,
        gift_thank_priority: defaultSettings.priorities.giftThank,
        qanda_priority: defaultSettings.priorities.qanda,
        aiChat_priority: defaultSettings.priorities.aiChat,
        globalnatural_language_switch: defaultSettings.naturalLanguageSwitch,
        creator: 'system'
      });
      settings.value = { ...defaultSettings };
    }
  } catch (error) {
    console.error('加载全局设置失败:', error);
    Message.error('加载设置失败');
    settings.value = { ...defaultSettings };
  }
};

// 监听visible变化
watch(() => props.visible, (val) => {
  modalVisible.value = val;
  if (val) {
    loadGlobalSettings();
  }
});

// 定时引导默认配置
const defaultTimingSettings = {
  enable: 1,
  runMode: 0,  // run_mode: 0=顺序, 1=随机
  intervalTime: 60,  // interval_time
  replyWay: 1,  // reply_way: 0=弹幕, 1=弹幕和助播, 2=助播
  chances: {
    all: 25,     // guide_all_chance
    follow: 25,  // guide_follow_chance
    cost: 25,    // guide_cost_chance
    share: 25    // guide_share_chance
  },
  contents: {
    all: '',     // guide_all_contents
    follow: '',  // guide_follow_contents
    cost: '',    // guide_cost_contents
    share: ''    // guide_share_contents
  }
};

// 初始化定时引导设置
const timingSettings = ref({ ...defaultTimingSettings });

// 加载定时引导配置
const loadTimingSettings = async () => {
  if (!props.liveId) return;
  
  try {
    const config = await RegularInteractionConfigService.getByLiveId(props.liveId);
    if (config) {
      timingSettings.value = {
        enable: config.enable ?? defaultTimingSettings.enable,
        runMode: config.run_mode ?? defaultTimingSettings.runMode,
        intervalTime: config.interval_time ?? defaultTimingSettings.intervalTime,
        replyWay: config.reply_way ?? defaultTimingSettings.replyWay,
        chances: {
          all: config.guide_all_chance ?? defaultTimingSettings.chances.all,
          follow: config.guide_follow_chance ?? defaultTimingSettings.chances.follow,
          cost: config.guide_cost_chance ?? defaultTimingSettings.chances.cost,
          share: config.guide_share_chance ?? defaultTimingSettings.chances.share
        },
        contents: {
          all: config.guide_all_contents || '',
          follow: config.guide_follow_contents || '',
          cost: config.guide_cost_contents || '',
          share: config.guide_share_contents || ''
        }
      };
      // 加载引导内容
      loadGuideContents();
    } else {
      // 创建新配置，使用默认值
      const id = await RegularInteractionConfigService.create({
        live_id: props.liveId,
        platform: props.platform,
        enable: defaultTimingSettings.enable,
        run_mode: defaultTimingSettings.runMode,
        interval_time: defaultTimingSettings.intervalTime,
        reply_way: defaultTimingSettings.replyWay,
        guide_all_chance: defaultTimingSettings.chances.all,
        guide_follow_chance: defaultTimingSettings.chances.follow,
        guide_cost_chance: defaultTimingSettings.chances.cost,
        guide_share_chance: defaultTimingSettings.chances.share,
        creator: 'system'
      });
      timingSettings.value = { ...defaultTimingSettings };
    }
  } catch (error) {
    console.error('加载定时引导配置失败:', error);
    Message.error('加载配置失败');
    timingSettings.value = { ...defaultTimingSettings };
  }
};

// 保存定时引导配置
const saveTimingSettings = async () => {
  if (!props.liveId) {
    Message.warning('直播间ID未设置');
    return;
  }
  
  // 保存引导内容到 timingSettings
  saveGuideContents();
  
  try {
    const config = await RegularInteractionConfigService.getByLiveId(props.liveId);
    if (config?.id) {
      await RegularInteractionConfigService.update(config.id, {
        enable: timingSettings.value.enable,
        run_mode: timingSettings.value.runMode,
        interval_time: timingSettings.value.intervalTime,
        reply_way: timingSettings.value.replyWay,
        guide_all_chance: timingSettings.value.chances.all,
        guide_follow_chance: timingSettings.value.chances.follow,
        guide_cost_chance: timingSettings.value.chances.cost,
        guide_share_chance: timingSettings.value.chances.share,
        guide_all_contents: timingSettings.value.contents.all,
        guide_follow_contents: timingSettings.value.contents.follow,
        guide_cost_contents: timingSettings.value.contents.cost,
        guide_share_contents: timingSettings.value.contents.share,
        platform: props.platform,
        updater: 'system'
      });
      Message.success('保存成功');
    }
  } catch (error) {
    console.error('保存定时引导配置失败:', error);
    Message.error('保存失败');
  }
};

// 监听visible变化
watch(() => props.visible, (val) => {
  modalVisible.value = val;
  if (val) {
    loadGlobalSettings();
    loadTimingSettings();
  }
});

// 当前选中的引导类型
const currentGuideType = ref('综合引导');

// 引导内容列表
const guideList = ref({
  '综合引导': [],
  '关注引导': [],
  '消费引导': [],
  '分享引导': []
});

// 引导类型映射
const guideTypeMap = {
  '综合引导': 'all',
  '关注引导': 'follow',
  '消费引导': 'cost',
  '分享引导': 'share'
};

// 加载引导内容
const loadGuideContents = () => {
  Object.keys(guideList.value).forEach(type => {
    const key = guideTypeMap[type];
    const content = timingSettings.value.contents[key];
    if (content) {
      try {
        guideList.value[type] = JSON.parse(content);
      } catch {
        guideList.value[type] = [];
      }
    } else {
      guideList.value[type] = [];
    }
  });
};

// 保存引导内容到 timingSettings
const saveGuideContents = () => {
  Object.keys(guideList.value).forEach(type => {
    const key = guideTypeMap[type];
    timingSettings.value.contents[key] = JSON.stringify(guideList.value[type]);
  });
};

// 添加引导内容
const addGuide = () => {
  editingGuide.value = { id: Date.now(), content: '' };
  showEditGuideDialog.value = true;
};

// 编辑引导内容
const editGuide = (guide: { id: number; content: string }) => {
  editingGuide.value = { ...guide };
  showEditGuideDialog.value = true;
};

// 删除引导内容
const deleteGuide = (guideId: number) => {
  const list = guideList.value[currentGuideType.value];
  const index = list.findIndex(item => item.id === guideId);
  if (index > -1) {
    list.splice(index, 1);
  }
};

// 获取当前类型的引导列表
const getGuideList = (type: string) => {
  return guideList.value[type] || [];
};

// 监听选项卡变化
const handleTabChange = (key: string) => {
  currentGuideType.value = key;
};

// 人气互动设置
const popularitySettings = reactive({
  replyMode: 'danmu',      // 点赞互动方式
  onlineReplyMode: 'danmu', // 在线人数互动方式
  likeRules: [             // 点赞触发规则列表
    { 
      id: 1, 
      count: 10,
      content: ''
    },
    { 
      id: 2, 
      count: 50,
      content: ''
    }
  ],
  onlineRules: [           // 在线人数触发规则列表
    {
      id: 1,
      count: 10,
      content: ''
    },
    {
      id: 2,
      count: 50,
      content: ''
    }
  ]
});

// 删除点赞规则
const deleteLikeRule = (ruleId: number) => {
  const index = popularitySettings.likeRules.findIndex(rule => rule.id === ruleId);
  if (index > -1) {
    popularitySettings.likeRules.splice(index, 1);
  }
};

// 删除在线人数规则
const deleteOnlineRule = (ruleId: number) => {
  const index = popularitySettings.onlineRules.findIndex(rule => rule.id === ruleId);
  if (index > -1) {
    popularitySettings.onlineRules.splice(index, 1);
  }
};

// 编辑点赞规则
const editLikeRule = (rule: any) => {
  // 这里可以添加编辑逻辑，比如打开编辑对话框
  console.log('编辑点赞规则:', rule);
};

// 编辑在线人数规则
const editOnlineRule = (rule: any) => {
  // 这里可以添加编辑逻辑，比如打开编辑对话框
  console.log('编辑在线人数规则:', rule);
};

// 添加点赞规则
const addLikeRule = () => {
  const newId = popularitySettings.likeRules.length > 0 
    ? Math.max(...popularitySettings.likeRules.map(rule => rule.id)) + 1 
    : 1;
  
  popularitySettings.likeRules.push({
    id: newId,
    count: 0,
    content: ''
  });
};

// 添加在线人数规则
const addOnlineRule = () => {
  const newId = popularitySettings.onlineRules.length > 0 
    ? Math.max(...popularitySettings.onlineRules.map(rule => rule.id)) + 1 
    : 1;
  
  popularitySettings.onlineRules.push({
    id: newId,
    count: 0,
    content: ''
  });
};

// 礼物感谢设置
const giftSettings = reactive({
  replyMode: 'danmu',      // 礼物互动方式
  thankRule: 'all',       // 感谢规则：all-全部感谢，threshold-阈值感谢
  minThreshold: 100,      // 最小感谢阈值（抖币）
  giftThreshold: 500,     // 礼物等级阈值（抖币）
  probabilities: {        // 各类型引导概率
    small: 50,           // 小额礼物感谢概率
    large: 50,           // 大额礼物感谢概率
  },
  sendMode: 'sequence'    // 发送方式
});

// 当前选中的礼物引导类型
const currentGiftType = ref('小额礼物感谢');

// 引导内容列表
const giftGuideList = reactive({
  '小额礼物感谢': [],
  '大额礼物感谢': []
});

// 监听礼物引导选项卡变化
const handleGiftTabChange = (key: string) => {
  currentGiftType.value = key;
};

// 编辑对话框显示状态
const showEditGuideDialog = ref(false);

// 当前编辑的引导内容
const editingGuide = ref<{ id: number; content: string }>({ id: 0, content: '' });

// 添加确认编辑方法
const handleEditGuideConfirm = () => {
  const list = guideList.value[currentGuideType.value];
  const index = list.findIndex(item => item.id === editingGuide.value.id);
  
  if (index > -1) {
    // 更新已存在的引导内容
    list[index] = { ...editingGuide.value };
  } else {
    // 添加新的引导内容
    list.push({ ...editingGuide.value });
  }
  
  showEditGuideDialog.value = false;
};
</script>

<style scoped>
/* 添加过渡效果 */
.py-3 {
  transition: all 0.3s ease;
}

/* 设置初始位置 */
:deep(.platform-settings-modal) {
  z-index: 2000 !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%);
  position: fixed !important;
}

/* 确保遮罩层也在更高层级 */
:deep(.arco-modal-mask) {
  z-index: 1999 !important;
}

/* 添加拖动时的鼠标样式 */
:deep(.arco-modal-header) {
  cursor: move;
}
</style>