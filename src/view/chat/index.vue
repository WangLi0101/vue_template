<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 左侧用户列表 -->
    <div class="w-1/3 bg-white border-r border-gray-200 flex flex-col">
      <!-- 头部 -->
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-800">联系人</h2>
        <p class="text-sm text-gray-500">
          当前用户: {{ socketStore.name }}{{ socketStore.userId }}
        </p>
      </div>

      <!-- 用户列表 -->
      <div class="flex-1 overflow-y-auto">
        <div
          v-for="user in socketStore.users"
          :key="user.id"
          @click="selectUser(user.id)"
          :class="[
            'p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors',
            selectedUser?.id === user.id
              ? 'bg-blue-50 border-l-4 border-l-blue-500'
              : ''
          ]"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center"
            >
              <span class="text-sm font-medium text-gray-600">{{
                user.userName?.charAt(0).toUpperCase()
              }}</span>
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ user.userName }}</p>
              <p class="text-sm text-gray-500" v-if="user.isOnline">在线</p>
              <p class="text-sm text-gray-500" v-else>离线</p>
            </div>
          </div>
        </div>

        <div
          v-if="socketStore.users.length === 0"
          class="p-4 text-center text-gray-500"
        >
          暂无联系人
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="flex-1 flex flex-col">
      <!-- 聊天头部 -->
      <div class="p-4 bg-white border-b border-gray-200">
        <div v-if="selectedUser" class="flex items-center space-x-3">
          <div
            class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center"
          >
            <span class="text-sm font-medium text-gray-600">{{
              selectedUser.userName.charAt(0).toUpperCase()
            }}</span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">
              {{ selectedUser.userName }}
            </h3>
            <p class="text-sm text-gray-500">在线</p>
          </div>
        </div>
        <div v-else class="text-gray-500">请选择一个联系人开始聊天</div>
      </div>

      <!-- 消息区域 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
        <div
          v-if="!selectedUser"
          class="flex items-center justify-center h-full"
        >
          <p class="text-gray-500 text-lg">选择一个联系人开始聊天</p>
        </div>

        <div v-else>
          <div
            v-for="message in socketStore.messages"
            :key="message.id"
            class="mb-4"
            :class="[
              'flex',
              message.senderId === socketStore.userId
                ? 'justify-end'
                : 'justify-start'
            ]"
          >
            <div
              :class="[
                'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                message.senderId === socketStore.userId
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              ]"
            >
              <p class="text-sm">{{ message.data }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div v-if="selectedUser" class="p-4 bg-white border-t border-gray-200">
        <div class="flex space-x-2">
          <input
            v-model="currentMessage"
            @keyup.enter="sendCurrentMessage"
            type="text"
            placeholder="输入消息..."
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            @click="sendCurrentMessage"
            :disabled="!currentMessage.trim()"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSocketStore } from "@/store/modules/socket";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const userName = route.query.userName;
const id = route.query.userId;

const messagesContainer = ref<HTMLElement>();

const socketStore = useSocketStore();
const { reconnect, selectUser } = socketStore;

// 本地状态管理

const currentMessage = ref<string>("");

// 计算当前选中的用户
const selectedUser = computed(() => {
  return socketStore.users.find(user => user.id === socketStore.selectedUserId);
});

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

onMounted(async () => {
  await reconnect(userName as string, id as string);
});
</script>

<style lang="scss" scoped></style>
