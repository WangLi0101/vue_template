<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="90%"
    :max-width="500"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="progress-dialog"
  >
    <div class="dialog-content">
      <div class="file-info flex items-center mb-3 md:mb-4" v-if="fileInfo">
        <el-icon class="text-blue-500 text-lg md:text-xl mr-2 md:mr-3"
          ><Document
        /></el-icon>
        <div class="flex-1">
          <div class="font-medium text-sm md:text-base">
            {{ fileInfo.name }}
          </div>
          <div class="text-gray-500 text-xs md:text-sm">
            {{ formatFileSize(fileInfo.size) }}
          </div>
          <div class="text-gray-500 text-xs md:text-sm">
            {{ fileInfo.type || "未知类型" }}
          </div>
        </div>
      </div>

      <div class="progress-container mb-3 md:mb-4">
        <el-progress
          :percentage="progress"
          :format="percentageFormat"
          :stroke-width="16"
          class="w-full"
        />
        <div class="text-center text-xs md:text-sm text-gray-500 mt-2">
          {{ statusText }}
        </div>
      </div>

      <!-- 连接信息显示 -->
      <ConnectionInfo
        v-if="showConnectionInfo"
        :peer-connection="peerConnection"
        :visible="dialogVisible"
      />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Document } from "@element-plus/icons-vue";
import ConnectionInfo from "./ConnectionInfo.vue";

interface Props {
  modelValue: boolean;
  title?: string;
  progress?: number;
  fileInfo?: {
    name: string;
    type: string;
    size: number;
  } | null;
  peerConnection?: RTCPeerConnection | null;
  showConnectionInfo?: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "文件传输",
  progress: 0,
  fileInfo: null,
  peerConnection: null,
  showConnectionInfo: true
});

const emit = defineEmits<Emits>();

// 对话框显示状态
const dialogVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 格式化百分比
const percentageFormat = (percentage: number): string => {
  return percentage === 100 ? "完成" : `${percentage}%`;
};

// 状态文本
const statusText = computed(() => {
  if (props.progress === 0) return "准备传输...";
  if (props.progress === 100) return "传输完成！";
  return "传输中...";
});
</script>

<style lang="scss" scoped>
.progress-dialog {
  :deep(.el-dialog) {
    margin: 0.5rem auto !important;
    width: 90% !important;
    max-width: 500px !important;
    border-radius: 12px;
    overflow: hidden;

    .el-dialog__header {
      padding: 12px 16px;

      @media (min-width: 768px) {
        padding: 16px 20px;
      }

      .el-dialog__title {
        font-size: 15px;

        @media (min-width: 768px) {
          font-size: 16px;
        }
      }
    }

    .el-dialog__body {
      padding: 12px;

      @media (min-width: 768px) {
        padding: 16px 20px;
      }
    }
  }
}

.dialog-content {
  padding: 8px;

  @media (min-width: 768px) {
    padding: 10px;
  }
}

.connection-info {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 10px;

  @media (min-width: 768px) {
    padding: 12px;
  }

  font-size: 12px;

  @media (min-width: 768px) {
    font-size: 14px;
  }
}
</style>
