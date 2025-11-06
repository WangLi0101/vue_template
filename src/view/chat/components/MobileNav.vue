<template>
  <div
    v-if="visible"
    class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-10"
  >
    <div class="flex justify-around items-center p-3">
      <div
        class="flex flex-col items-center cursor-pointer"
        @click="emit('back-to-list')"
        :class="{
          'text-slate-900 font-medium': !showChatArea,
          'text-slate-400': showChatArea
        }"
      >
        <el-icon class="text-xl mb-1"><UserIcon /></el-icon>
        <span class="text-xs">联系人</span>
      </div>
      <div
        class="flex flex-col items-center cursor-pointer"
        @click="emit('go-chat')"
        :class="{
          'text-slate-900 font-medium': showChatArea,
          'text-slate-400': !showChatArea
        }"
      >
        <el-icon class="text-xl mb-1"><ChatDotRound /></el-icon>
        <span class="text-xs">聊天</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound, User as UserIcon } from "@element-plus/icons-vue";

const { showChatArea, visible } = defineProps<{
  showChatArea: boolean;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "back-to-list"): void;
  (e: "go-chat"): void;
}>();
</script>
