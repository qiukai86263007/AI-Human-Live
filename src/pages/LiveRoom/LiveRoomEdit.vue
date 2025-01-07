<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentTab = ref('主播选择');
const currentPage = ref(1);
const pageSize = 4; // 每页显示4个主播
const isEditing = ref(false);
const roomName = ref(router.currentRoute.value.query.name?.toString() || '未命名直播间');
const searchText = ref('');
const manualText = ref('');
const aiKeyword = ref('');
const aiGeneratedText = ref('');
const scriptList = ref([]);
const scriptSearchText = ref('');
const questionSearchText = ref('');
const replyDelay = ref(60);
const replyMode = ref('1');

const tabs = [
  { key: '主播选择', icon: 'icon-user' },
  { key: '产品台词', icon: 'icon-file' },
  { key: '产品问答', icon: 'icon-question' },
  { key: '商品讲解', icon: 'icon-shopping' }
];

// 模拟主播数据
const anchors = ref([
  { id: 1, name: '主播名称1' },
  { id: 2, name: '主播名称2' },
  { id: 3, name: '主播名称3' },
  { id: 4, name: '主播名称4' },
  { id: 5, name: '主播名称5' },
  { id: 6, name: '主播名称6' },
  { id: 7, name: '主播名称7' },
  { id: 8, name: '主播名称8' },
]);

// 过滤后的主播列表
const filteredAnchors = computed(() => {
  if (!searchText.value) return anchors.value;
  return anchors.value.filter(anchor => 
    anchor.name.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 计算当前页显示的主播
const currentAnchors = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredAnchors.value.slice(start, start + pageSize);
});

const toggleEdit = () => {
  if (isEditing.value) {
    // 保存逻辑
    isEditing.value = false;
  } else {
    isEditing.value = true;
  }
};

// 处理搜索
const handleSearch = (value: string) => {
  searchText.value = value;
  currentPage.value = 1; // 重置页码
};

// 添加到列表
const addToList = (type: 'manual' | 'ai') => {
  const text = type === 'manual' ? manualText.value : aiGeneratedText.value;
  scriptList.value.push({
    id: Date.now(),
    text,
    type
  });
  
  // 清空输入
  if (type === 'manual') {
    manualText.value = '';
  } else {
    aiGeneratedText.value = '';
    aiKeyword.value = '';
  }
};

// 处理脚本搜索
const handleScriptSearch = (value: string) => {
  scriptSearchText.value = value;
  currentPage.value = 1; // 重置页码
};

// 生成AI内容
const generateAiContent = () => {
  if (!aiKeyword.value) return;
  // TODO: 调用AI生成接口
  aiGeneratedText.value = `基于关键词"${aiKeyword.value}"生成的AI内容...`;
};

// 处理问题搜索
const handleQuestionSearch = (value: string) => {
  questionSearchText.value = value;
};

interface QA {
  id: number;
  question: string;
  answer: string;
}

interface QuestionCategory {
  id: number;
  name: string;
  qas: QA[];
}

const questionCategories = ref<QuestionCategory[]>([
  {
    id: 1,
    name: '价格',
    qas: [
      { id: 1, question: '这个产品多少钱？', answer: '这个产品的价格是99元。' }
    ]
  },
  {
    id: 2,
    name: '规格',
    qas: [
      { id: 2, question: '有什么规格可选？', answer: '我们有大中小三种规格可选。' }
    ]
  }
]);

// 新增问题种类
const addNewCategory = () => {
  editingCategory.value = {
    id: Date.now(),
    name: '',
    qas: []
  };
  showEditCategoryDialog.value = true;
};

// 添加新的Q&A
const addQA = (categoryId: number) => {
  const category = questionCategories.value.find(c => c.id === categoryId);
  if (category) {
    editingQA.value = {
      id: Date.now(),
      question: '',
      answer: ''
    };
    // 保存当前操作的分类ID
    editingQA.value._categoryId = categoryId;
    showEditQADialog.value = true;
  }
};

// 编辑状态
const editingQA = ref<QA>({ id: 0, question: '', answer: '' });
const editingCategory = ref<QuestionCategory>({ id: 0, name: '', qas: [] });
const showEditQADialog = ref(false);
const showEditCategoryDialog = ref(false);

// 编辑问题种类
const editCategory = (category: QuestionCategory) => {
  editingCategory.value = JSON.parse(JSON.stringify(category));
  showEditCategoryDialog.value = true;
};

// 删除问题种类
const deleteCategory = (categoryId: number) => {
  questionCategories.value = questionCategories.value.filter(c => c.id !== categoryId);
};

// 编辑Q&A
const editQA = (categoryId: number, qa: QA) => {
  const category = questionCategories.value.find(c => c.id === categoryId);
  if (category) {
    editingQA.value = JSON.parse(JSON.stringify(qa));
    showEditQADialog.value = true;
  }
};

// 删除Q&A
const deleteQA = (categoryId: number, qaId: number) => {
  const category = questionCategories.value.find(c => c.id === categoryId);
  if (category) {
    category.qas = category.qas.filter(qa => qa.id !== qaId);
  }
};

// 保存编辑的Q&A
const saveQA = () => {
  // 如果问题和答案都为空，则不保存
  if (!editingQA.value.question.trim() || !editingQA.value.answer.trim()) {
    showEditQADialog.value = false;
    editingQA.value = { id: 0, question: '', answer: '' };
    return;
  }
  
  questionCategories.value = questionCategories.value.map(category => {
    // 只在对应的分类中添加或更新Q&A
    if (category.id === editingQA.value._categoryId) {
      const qaIndex = category.qas.findIndex(qa => qa.id === editingQA.value?.id);
      if (qaIndex !== -1) {
        category.qas[qaIndex] = { ...editingQA.value };
      } else {
        // 如果找不到现有的QA，说明是新增
        category.qas.push({ ...editingQA.value });
      }
    }
    return category;
  });
  
  showEditQADialog.value = false;
  editingQA.value = { id: 0, question: '', answer: '' };
};

// 保存编辑的问题种类
const saveCategory = () => {
  if (!editingCategory.value.name.trim()) {
    showEditCategoryDialog.value = false;
    editingCategory.value = { id: 0, name: '', qas: [] };
    return;
  }
  
  const index = questionCategories.value.findIndex(c => c.id === editingCategory.value?.id);
  if (index !== -1) {
    questionCategories.value[index] = { ...editingCategory.value };
  } else {
    // 如果找不到现有的种类，说明是新增
    questionCategories.value.push({ ...editingCategory.value });
  }
  
  showEditCategoryDialog.value = false;
  editingCategory.value = { id: 0, name: '', qas: [] };
};

</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- 顶部导航栏 -->
    <div class="h-[60px] flex items-center justify-between px-4 border-b border-gray-800">
      <div class="flex items-center flex-1">
        <a-button type="text" class="text-gray-400 w-24" @click="router.push('/live')">
          <template #icon>
            <icon-left />
          </template>
          返回主页
        </a-button>
        <div class="mx-4 flex items-center">
          <a-input
            v-model="roomName"
            :readonly="!isEditing"
            class="w-48 bg-transparent"
            :class="{ 'cursor-default': !isEditing }"
          />
          <a-button type="text" class="text-gray-400 ml-2" @click="toggleEdit">
            <template #icon>
              <icon-edit v-if="!isEditing" />
              <icon-check v-else />
            </template>
            {{ isEditing ? '保存' : '编辑' }}
          </a-button>
        </div>
      </div>
      <div class="flex-shrink-0">
        <a-button type="outline" status="success">
          <template #icon>
            <icon-robot />
          </template>
          AI智能互动设置
        </a-button>
      </div>
    </div>
    
    <div class="flex-1 flex">
      <!-- 左侧产品列表 -->
      <div class="w-60 flex-shrink-0 border-r border-gray-800 flex flex-col">
        <div class="px-4 pt-4 pb-2">
          <div class="text-lg mb-2 font-medium">产品列表</div>
          <div class="flex items-center gap-4">
            <a-checkbox>全选</a-checkbox>
            <a-checkbox>多选</a-checkbox>
            <a-button size="mini" status="danger">
              <template #icon>
                <icon-delete />
              </template>
              删除
            </a-button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto flex items-center justify-center text-gray-500">
          <div class="text-center">
            <div class="mb-4">
              <icon-box class="text-4xl" />
            </div>
            <div>暂无产品</div>
          </div>
        </div>
        <div class="p-4">
          <a-button type="outline" class="w-full mb-2" status="primary">
            <template #icon>
              <icon-plus />
            </template>
            新建产品
          </a-button>
          <a-button type="primary" class="w-full mb-2">
            <template #icon>
              <icon-play />
            </template>
            开始克隆
          </a-button>
        </div>
      </div>

      <!-- 左侧导航栏 -->
      <div class="w-20 flex-shrink-0 border-r border-gray-800">
        <div v-for="tab in tabs" 
             :key="tab.key"
             class="py-4 px-2 cursor-pointer flex flex-col items-center"
             :class="currentTab === tab.key ? 'bg-blue-500/10 text-blue-500' : 'text-gray-400'"
             @click="currentTab = tab.key"
        >
          <i :class="tab.icon" class="text-xl mb-1"></i>
          <span class="text-xs">{{ tab.key }}</span>
        </div>
      </div>

      <!-- 中间主内容区 -->
      <div class="flex-grow p-4">
        <!-- 主播选择面板 -->
        <div v-if="currentTab === '主播选择'">
          <div class="flex items-center mb-4">
            <div>当前主播 /</div>
          </div>
          <div class="aspect-video rounded-lg flex items-center justify-center text-gray-500">
            请选择主播
          </div>
          <div class="mt-4 flex justify-center">
            <a-button type="outline">
              保存当前设置
            </a-button>
          </div>
        </div>
        
        <!-- 其他选项卡的内容 -->
        <div v-else-if="currentTab === '产品台词'" class="flex flex-col h-full">
          <!-- 主要内容区域 -->
          <div class="flex flex-grow -mt-4">
            <!-- 左侧台词列表 -->
            <div class="flex-grow pr-4 pt-4">
              <div class="bg-white rounded-lg p-4 mb-4 shadow">
                <!-- 操作按钮和搜索框 -->
                <div class="flex items-center gap-2 mb-4">
                  <a-checkbox>全选</a-checkbox>
                  <a-checkbox>多选</a-checkbox>
                  <a-button size="mini" status="danger">
                    <template #icon>
                      <icon-delete />
                    </template>
                    删除
                  </a-button>
                </div>
                <!-- 搜索框 -->
                <div class="mt-4 mb-4">
                  <a-input-search
                    v-model="scriptSearchText"
                    placeholder="搜索台词内容"
                    allow-clear
                    @search="handleScriptSearch"
                    @clear="handleScriptSearch('')"
                  />
                </div>
                <!-- 台词列表 -->
                <div class="grid grid-cols-2 gap-4">
                  <!-- 左侧文本台词 -->
                  <div class="bg-white rounded-lg p-4 shadow">
                    <div class="flex items-center justify-between mb-4">
                      <div>123567</div>
                      <div class="flex items-center gap-2">
                        <a-tag>文本</a-tag>
                        <a-button size="mini">
                          <template #icon>
                            <icon-play />
                          </template>
                          试听
                        </a-button>
                      </div>
                    </div>
                    <div class="text-gray-400">
                      AI解析: 0
                    </div>
                  </div>
                  
                  <!-- 右侧文本台词 -->
                  <div class="bg-white rounded-lg p-4 shadow">
                    <div class="flex items-center justify-between mb-4">
                      <div>456</div>
                      <div class="flex items-center gap-2">
                        <a-tag>文本</a-tag>
                        <a-button size="mini">
                          <template #icon>
                            <icon-play />
                          </template>
                          试听
                        </a-button>
                      </div>
                    </div>
                    <div class="text-gray-400">
                      AI解析: 0
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧面板 -->
            <div class="w-96 flex-shrink-0 border-l border-gray-800 pl-4 pt-4 min-h-full">
              <!-- 台词编辑 -->
              <div>
                <div class="mb-2">台词编辑</div>
                <!-- 文本/音频台词编辑选项卡 -->
                <a-tabs>
                  <!-- 文本台词编辑选项卡 -->
                  <a-tab-pane key="text" title="文本台词编辑">
                    <!-- 主播选择 -->
                    <div class="mb-4">
                      <div class="mb-2">当前主播</div>
                      <div class="bg-white rounded-lg p-4 shadow">
                        <div class="flex items-center gap-4">
                          <img src="" alt="" class="w-16 h-16 rounded-lg bg-gray-700" />
                          <div>
                            <div class="mb-1">小范/女/普通话</div>
                            <a-button size="mini" type="outline">
                              更换主播
                            </a-button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 手动/AI撰写选项卡 -->
                    <div class="mb-4">
                      <a-tabs class="w-full">
                        <a-tab-pane key="manual" title="手动撰写">
                          <div class="bg-white rounded-lg p-4 shadow">
                            <a-textarea
                              v-model="manualText"
                              placeholder="在此输入您的台词"
                              :auto-size="{ minRows: 12, maxRows: 16 }"
                              class="w-full"
                              style="min-height: 300px;"
                            />
                            <div class="flex justify-end mt-4">
                              <a-button type="primary" size="small" @click="addToList('manual')">
                                添加到列表
                              </a-button>
                            </div>
                          </div>
                        </a-tab-pane>
                        <a-tab-pane key="ai" title="AI撰写">
                          <div class="bg-white rounded-lg p-4 shadow">
                            <div class="flex items-center gap-2 mb-4">
                              <img src="" alt="" class="w-8 h-8 rounded-full bg-gray-200" />
                              <div class="text-gray-400">AI启动中...</div>
                            </div>
                            <!-- AI生成内容显示区域 -->
                            <div class="bg-[#1D1E2B] rounded-lg p-4 min-h-[200px] mb-4">
                              <div class="text-gray-300">
                                {{ aiGeneratedText || '等待生成内容...' }}
                              </div>
                            </div>
                            <!-- 关键词输入区域 -->
                            <div class="mb-4 flex gap-2">
                              <a-input
                                v-model="aiKeyword"
                                placeholder="请输入关键字"
                                class="flex-grow"
                              />
                              <a-button type="primary" @click="generateAiContent">
                                发送
                              </a-button>
                            </div>
                            <div class="flex justify-end">
                              <a-button 
                                type="primary" 
                                size="small"
                                @click="addToList('ai')"
                                :disabled="!aiGeneratedText"
                              >
                                添加到列表
                              </a-button>
                            </div>
                          </div>
                        </a-tab-pane>
                      </a-tabs>
                    </div>
                  </a-tab-pane>
                  
                  <!-- 音频台词编辑选项卡 -->
                  <a-tab-pane key="audio" title="音频台词编辑">
                    <div class="bg-white rounded-lg p-4 shadow">
                      <!-- 音频编辑相关内容 -->
                      <div class="text-gray-400">
                        音频编辑功能开发中...
                      </div>
                    </div>
                  </a-tab-pane>
                </a-tabs>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="currentTab === '产品问答'" class="flex flex-col h-full">
          <!-- 主要内容区域 -->
          <div class="flex flex-grow -mt-4">
            <!-- 左侧问答列表 -->
            <div class="flex-grow pr-4 pt-4 min-h-full">
              <!-- 标题 -->
              <div class="mb-4">添加关键词问答</div>
              
              <!-- 内容区域 -->
              <div class="bg-white rounded-lg p-4 mb-4 shadow">
                <!-- 操作按钮和搜索框 -->
                <div class="flex items-center gap-2 mb-4">
                  <a-input-search
                    v-model="questionSearchText"
                    placeholder="搜索内容"
                    allow-clear
                    @search="handleQuestionSearch"
                    @clear="handleQuestionSearch('')"
                  />
                  <a-button type="primary" size="small" @click="addNewCategory">
                    新增问题
                  </a-button>
                  <a-button type="primary" size="small">
                    选择问题
                  </a-button>
                </div>
                
                <!-- 问答列表 -->
                <div class="space-y-4">
                  <!-- 问题种类列表 -->
                  <div v-for="category in questionCategories" :key="category.id" class="bg-[#1D1E2B] rounded-lg p-4">
                    <div class="flex items-center justify-between mb-4">
                      <div class="text-gray-300 font-medium">{{ category.name }}</div>
                      <div class="flex items-center gap-2">
                        <a-button type="text" size="mini" @click="addQA(category.id)">
                          <template #icon>
                            <icon-plus />
                          </template>
                          添加Q&A
                        </a-button>
                        <a-button type="text" size="mini" @click="editCategory(category)">
                          <template #icon>
                            <icon-edit />
                          </template>
                        </a-button>
                        <a-button type="text" size="mini" status="danger" @click="deleteCategory(category.id)">
                          <template #icon>
                            <icon-delete />
                          </template>
                        </a-button>
                      </div>
                    </div>
                    <!-- Q&A列表 -->
                    <div class="space-y-2 pl-4">
                      <div v-for="qa in category.qas" 
                           :key="qa.id" 
                           class="flex flex-col gap-2 py-2">
                        <div class="flex items-center justify-between">
                          <div class="text-gray-400">Q: {{ qa.question }}</div>
                          <div class="flex items-center gap-2">
                            <a-button type="text" size="mini" @click="editQA(category.id, qa)">
                              <template #icon>
                                <icon-edit />
                              </template>
                            </a-button>
                            <a-button type="text" size="mini" status="danger" @click="deleteQA(category.id, qa.id)">
                              <template #icon>
                                <icon-delete />
                              </template>
                            </a-button>
                          </div>
                        </div>
                        <div class="text-gray-500 pl-4">
                          A: {{ qa.answer }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧面板 -->
            <div class="w-96 flex-shrink-0 border-l border-gray-800 p-4 min-h-full">
              <div class="mb-2">回答设置</div>
              <!-- 回答设置选项 -->
              <div class="bg-white rounded-lg p-4 shadow">
                <div class="mb-4">回复源设置</div>
                <div class="mb-4">
                  <a-checkbox>关键词问答</a-checkbox>
                </div>
                <div class="mb-4">
                  回复设置
                  <div class="flex items-center gap-2 mt-2">
                    <a-input-number
                      v-model="replyDelay"
                      :min="0"
                      :max="100"
                      class="w-24"
                    />
                    <span>秒内一次关键词不重复回复</span>
                  </div>
                </div>
                <div class="mb-4">
                  选择回答方式
                  <div class="mt-2">
                    <a-radio-group v-model="replyMode">
                      <a-radio value="1">弹幕</a-radio>
                      <a-radio value="2">弹幕和助播</a-radio>
                      <a-radio value="3">助播</a-radio>
                    </a-radio-group>
                  </div>
                </div>
                <div class="flex justify-end">
                  <a-button type="primary">
                    保存当前设置
                  </a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="currentTab === '商品讲解'">
          商品讲解内容
        </div>
      </div>

      <!-- 右侧主播列表 -->
      <div v-if="currentTab === '主播选择'" class="w-72 flex-shrink-0 border-l border-gray-800 p-4">
        <div class="mb-4">
          <a-tabs>
            <a-tab-pane key="1" title="主播广场" />
            <a-tab-pane key="2" title="我的主播" />
          </a-tabs>
        </div>
        <div class="mb-4">
          <a-input-search 
            placeholder="搜索主播" 
            allow-clear
            v-model="searchText"
            @search="handleSearch"
            @clear="handleSearch('')"
          />
        </div>
        
        <!-- 主播列表 -->
        <div class="grid grid-cols-2 gap-4 min-h-[500px]">
          <div v-for="anchor in currentAnchors" 
               :key="anchor.id" 
               class="aspect-[3/4] rounded-lg overflow-hidden relative group">
            <img src="" alt="" class="w-full h-full object-cover" />
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-2">
              <div class="text-sm">{{ anchor.name }}</div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="flex justify-center mt-4">
          <a-pagination
            v-model:current="currentPage"
            :total="filteredAnchors.length"
            :page-size="pageSize"
            size="small"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- 编辑Q&A对话框 -->
  <a-modal
    v-model:visible="showEditQADialog"
    title="编辑问答"
    @ok="saveQA"
    @cancel="showEditQADialog = false"
  >
    <div class="space-y-4">
      <a-input
        v-model="editingQA.question"
        placeholder="请输入问题"
      />
      <a-textarea
        v-model="editingQA.answer"
        placeholder="请输入回答"
        :auto-size="{ minRows: 3, maxRows: 6 }"
      />
    </div>
  </a-modal>

  <!-- 编辑问题种类对话框 -->
  <a-modal
    v-model:visible="showEditCategoryDialog"
    title="编辑问题种类"
    @ok="saveCategory"
    @cancel="showEditCategoryDialog = false"
  >
    <a-input
      v-model="editingCategory.name"
      placeholder="请输入问题种类名称"
    />
  </a-modal>
</template>

<style scoped>
:deep(.arco-tabs-nav) {
  padding: 0;
}

:deep(.arco-pagination) {
  background-color: transparent;
  color: #fff;
}

:deep(.arco-pagination-item) {
  background-color: transparent;
  color: #86909c;
}

:deep(.arco-pagination-item:hover),
:deep(.arco-pagination-item.arco-pagination-item-active) {
  background-color: #165DFF;
  color: #fff;
}
</style> 