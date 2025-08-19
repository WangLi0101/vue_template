<template>
  <el-dialog
    v-model="visible"
    title="来电"
    width="90%"
    :max-width="400"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
    class="incoming-call-dialog"
  >
    <div class="text-center py-6">
      <div class="mb-6">
        <div
          class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-2xl font-bold animate-pulse"
          :style="{ backgroundColor: avatarColor }"
        >
          {{ callerName.charAt(0).toUpperCase() }}
        </div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">
          {{ callerName }}
        </h3>
        <p class="text-gray-500">视频通话邀请</p>
      </div>

      <div class="flex justify-center space-x-4 md:space-x-6">
        <el-button
          type="danger"
          size="large"
          circle
          @click="handleReject"
          class="w-14 h-14 md:w-16 md:h-16 text-lg md:text-xl"
        >
          <el-icon><Phone /></el-icon>
        </el-button>
        <el-button
          type="success"
          size="large"
          circle
          @click="handleAccept"
          class="w-14 h-14 md:w-16 md:h-16 text-lg md:text-xl"
        >
          <el-icon><VideoCamera /></el-icon>
        </el-button>
      </div>

      <div class="mt-4 text-sm text-gray-400">
        <span>拒绝</span>
        <span class="mx-8">接听</span>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Phone, VideoCamera } from "@element-plus/icons-vue";

interface Props {
  modelValue: boolean;
  callerName: string;
  avatarColor: string;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "accept"): void;
  (e: "reject"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 控制弹窗显示
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value)
});

// 处理接听
const handleAccept = () => {
  emit("accept");
};

// 处理拒绝
const handleReject = () => {
  emit("reject");
};
</script>

<style lang="scss" scoped>
// 来电弹窗样式
:deep(.incoming-call-dialog) {
  .el-dialog {
    border-radius: 16px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
    margin: 0.5rem auto !important;
    width: 90% !important;
    max-width: 400px !important;
  }

  .el-dialog__header {
    padding: 16px 16px 0;
    text-align: center;

    .el-dialog__title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;

      @media (min-width: 768px) {
        font-size: 18px;
      }
    }
  }

  .el-dialog__body {
    padding: 8px 16px 16px;

    @media (min-width: 768px) {
      padding: 10px 20px 20px;
    }
  }
}
</style>
