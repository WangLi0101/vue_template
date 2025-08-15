<template>
  <div
    class="flex h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50"
  >
    <!-- 左侧用户列表 -->
    <div
      class="w-1/3 bg-white/90 backdrop-blur-sm border-r border-gray-200/60 flex flex-col shadow-sm"
    >
      <!-- 头部 -->
      <div
        class="p-6 border-b border-gray-200/60 bg-gradient-to-r from-slate-600 to-gray-600 text-white"
      >
        <div class="flex items-center space-x-3 mb-3">
          <div
            class="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <el-icon class="text-xl">
              <ChatDotRound />
            </el-icon>
          </div>
          <div>
            <h2 class="text-xl font-bold">聊天室</h2>
            <p class="text-slate-200 text-sm">{{ socketStore.name }}</p>
          </div>
        </div>
        <div class="flex items-center space-x-2 text-sm text-slate-200">
          <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span>在线 · ID: {{ socketStore.userId }}</span>
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="p-4">
        <div class="relative">
          <el-input
            v-model="searchQuery"
            placeholder="搜索联系人..."
            class="search-input"
            clearable
          >
            <template #prefix>
              <el-icon class="text-gray-400">
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 用户列表 -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          @click="selectUser(user.id)"
          :class="[
            'p-4 cursor-pointer border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 transition-all duration-300 transform hover:scale-[1.01]',
            selectedUser?.id === user.id
              ? 'bg-gradient-to-r from-slate-100 to-gray-100 border-l-4 border-l-slate-500 shadow-sm'
              : ''
          ]"
        >
          <div class="flex items-center space-x-3">
            <div class="relative">
              <div
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300',
                  getUserAvatarColor(user.userName)
                ]"
              >
                {{ user.userName?.charAt(0).toUpperCase() }}
              </div>
              <!-- 在线状态指示器 -->
              <div
                :class="[
                  'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm',
                  user.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                ]"
              />
              <!-- 新消息提示红点 -->
              <div
                v-if="user.isNewMessage"
                class="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-bounce shadow-lg"
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="font-semibold text-gray-900 truncate">
                  {{ user.userName }}
                </p>
                <!-- 新消息徽章 -->
                <el-badge
                  v-if="user.isNewMessage && selectedUser?.id !== user.id"
                  value="新"
                  type="danger"
                  class="animate-pulse"
                />
              </div>
              <div class="flex items-center space-x-2 mt-1">
                <div
                  :class="[
                    'w-2 h-2 rounded-full',
                    user.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  ]"
                />
                <p class="text-sm text-slate-500">
                  {{ user.isOnline ? "在线" : "离线" }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="filteredUsers.length === 0"
          class="p-8 text-center text-slate-500"
        >
          <el-icon class="text-4xl mb-2 text-slate-300">
            <User />
          </el-icon>
          <p>{{ searchQuery ? "未找到匹配的联系人" : "暂无联系人" }}</p>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="flex-1 flex flex-col bg-white/70 backdrop-blur-sm">
      <!-- 聊天头部 -->
      <div
        class="p-6 bg-white/90 backdrop-blur-sm border-b border-gray-200/60 shadow-sm"
      >
        <div v-if="selectedUser" class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="relative">
              <div
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md',
                  getUserAvatarColor(selectedUser.userName)
                ]"
              >
                {{ selectedUser.userName.charAt(0).toUpperCase() }}
              </div>
              <div
                :class="[
                  'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm',
                  selectedUser.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                ]"
              />
            </div>
            <div>
              <h3 class="font-bold text-slate-900 text-lg">
                {{ selectedUser.userName }}
              </h3>
              <div class="flex items-center space-x-2">
                <div
                  :class="[
                    'w-2 h-2 rounded-full',
                    selectedUser.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  ]"
                />
                <p class="text-sm text-slate-500">
                  {{ selectedUser.isOnline ? "在线" : "离线" }}
                </p>
              </div>
            </div>
          </div>
          <!-- 聊天操作按钮 -->
          <div class="flex items-center space-x-2">
            <el-button circle size="small" class="chat-action-btn">
              <el-icon><Phone /></el-icon>
            </el-button>
            <el-button circle size="small" class="chat-action-btn">
              <el-icon><VideoCamera /></el-icon>
            </el-button>
            <el-button circle size="small" class="chat-action-btn">
              <el-icon><More /></el-icon>
            </el-button>
          </div>
        </div>
        <div v-else class="flex items-center justify-center py-4">
          <div class="text-center">
            <el-icon class="text-4xl text-slate-300 mb-2">
              <ChatDotRound />
            </el-icon>
            <p class="text-slate-500 text-lg">请选择一个联系人开始聊天</p>
          </div>
        </div>
      </div>

      <!-- 消息区域 -->
      <div
        class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
        ref="messagesContainer"
      >
        <div
          v-if="!selectedUser"
          class="flex items-center justify-center h-full"
        >
          <div class="text-center">
            <div
              class="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-gray-100 rounded-full flex items-center justify-center"
            >
              <el-icon class="text-6xl text-slate-400">
                <ChatDotRound />
              </el-icon>
            </div>
            <h3 class="text-xl font-semibold text-slate-700 mb-2">开始聊天</h3>
            <p class="text-slate-500">选择左侧的联系人开始对话</p>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="message in socketStore.messages"
            :key="message.id"
            :class="[
              'flex items-end space-x-3',
              message.senderId === socketStore.userId
                ? 'justify-end'
                : 'justify-start'
            ]"
          >
            <!-- 其他用户头像（左侧） -->
            <div
              v-if="message.senderId !== socketStore.userId"
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md flex-shrink-0',
                getUserAvatarColor(selectedUser.userName)
              ]"
            >
              {{ selectedUser.userName.charAt(0).toUpperCase() }}
            </div>

            <!-- 消息气泡 -->
            <div
              :class="[
                'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md',
                message.senderId === socketStore.userId
                  ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-br-md ml-auto'
                  : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
              ]"
            >
              <p class="text-sm leading-relaxed">{{ message.data }}</p>
              <div
                :class="[
                  'text-xs mt-2 opacity-70',
                  message.senderId === socketStore.userId
                    ? 'text-slate-200'
                    : 'text-slate-500'
                ]"
              >
                {{ formateTime(message.createTime) }}
              </div>
            </div>

            <!-- 当前用户头像（右侧） -->
            <div
              v-if="message.senderId === socketStore.userId"
              class="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white text-sm font-medium shadow-md flex-shrink-0"
            >
              {{ socketStore.name.charAt(0).toUpperCase() }}
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div v-if="selectedUser" class="p-6 bg-white/90 backdrop-blur-sm">
        <div class="flex items-end space-x-3">
          <!-- 附件按钮 -->
          <el-button circle class="message-action-btn">
            <el-icon><Plus /></el-icon>
          </el-button>

          <!-- 输入框 -->
          <div class="flex-1 relative">
            <el-input
              v-model="currentMessage"
              @keyup.enter="sendCurrentMessage"
              type="textarea"
              :rows="1"
              placeholder="输入消息..."
              class="message-input"
              resize="none"
              :autosize="{ minRows: 1, maxRows: 4 }"
            />
          </div>

          <!-- 表情按钮 -->
          <el-button circle class="message-action-btn">
            <el-icon><ChatDotRound /></el-icon>
          </el-button>

          <!-- 发送按钮 -->
          <el-button
            @click="sendCurrentMessage"
            :disabled="!currentMessage.trim()"
            type="primary"
            class="send-button"
            :class="{ 'animate-pulse': currentMessage.trim() }"
          >
            <el-icon class="mr-1"><Promotion /></el-icon>
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSocketStore } from "@/store/modules/socket";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  ChatDotRound,
  Search,
  User,
  Phone,
  VideoCamera,
  More,
  Plus,
  Promotion
} from "@element-plus/icons-vue";
import { formateTime } from "@/utils";

const messagesContainer = ref<HTMLElement>();
const socketStore = useSocketStore();
const { reconnect, selectUser } = socketStore;
const currentMessage = ref<string>("");
const searchQuery = ref<string>("");

onMounted(async () => {
  await reconnect();
});
// 计算当前选中的用户
const selectedUser = computed(() => {
  return socketStore.users.find(user => user.id === socketStore.selectedUserId);
});

// 过滤用户列表
const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return socketStore.users;
  }
  return socketStore.users.filter(user =>
    user.userName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 获取用户头像颜色
const getUserAvatarColor = (userName: string) => {
  const colors = [
    "bg-gradient-to-br from-slate-400 to-slate-500",
    "bg-gradient-to-br from-stone-400 to-stone-500",
    "bg-gradient-to-br from-neutral-400 to-neutral-500",
    "bg-gradient-to-br from-zinc-400 to-zinc-500",
    "bg-gradient-to-br from-gray-400 to-gray-500",
    "bg-gradient-to-br from-emerald-400 to-emerald-500",
    "bg-gradient-to-br from-teal-400 to-teal-500",
    "bg-gradient-to-br from-cyan-400 to-cyan-500"
  ];

  const hash = userName.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

// 发送当前消息
const sendCurrentMessage = () => {
  if (!currentMessage.value.trim() || !selectedUser.value) return;
  socketStore.sendMessage({
    type: "text",
    receiverId: selectedUser.value.id,
    data: currentMessage.value
  });
  currentMessage.value = "";
};

const scrollToBottom = () => {
  nextTick(() => {
    messagesContainer.value?.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: "instant"
    });
  });
};

watch(
  () => socketStore.messages,
  () => {
    scrollToBottom();
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
// 自定义滚动条
.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    border-radius: 3px;

    &:hover {
      background: linear-gradient(135deg, #475569 0%, #334155 100%);
    }
  }
}

// 搜索输入框样式
:deep(.search-input) {
  .el-input__wrapper {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &.is-focus {
      box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.3);
    }
  }
}

// 聊天操作按钮
.chat-action-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(100, 116, 139, 0.1);
    border-color: rgba(100, 116, 139, 0.3);
    transform: translateY(-1px);
  }
}

// 消息输入框样式
:deep(.message-input) {
  .el-textarea__inner {
    border-radius: 16px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1.5;

    &:focus {
      border-color: #64748b;
      box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.1);
      background: rgba(255, 255, 255, 1);
    }

    &::placeholder {
      color: rgba(0, 0, 0, 0.4);
    }
  }
}

// 消息操作按钮
.message-action-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(100, 116, 139, 0.1);
    border-color: rgba(100, 116, 139, 0.3);
    transform: translateY(-2px);
  }
}

// 发送按钮
.send-button {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #475569 0%, #334155 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(100, 116, 139, 0.4);
  }

  &:disabled {
    background: rgba(0, 0, 0, 0.1);
    box-shadow: none;
    transform: none;
  }
}

// 消息气泡动画
.message-bubble-enter-active {
  transition: all 0.3s ease;
}

.message-bubble-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

// 用户列表项悬停效果
.user-item {
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
  }

  .user-list {
    width: 100%;
    height: 40%;
  }

  .chat-area {
    height: 60%;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .custom-scrollbar {
    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
