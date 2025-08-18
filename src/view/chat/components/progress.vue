<template>
  <el-dialog
    v-model="dialogVisible"
    title="文件传输"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <div class="dialog-content flex flex-col items-center p-4">
      <div class="file-info mb-4 w-full" v-if="fileInfo">
        <div class="text-lg font-medium mb-2">{{ fileInfo.name }}</div>
        <div class="text-sm text-gray-500 mb-1">
          {{ formatFileSize(fileInfo.size) }}
        </div>
        <div class="text-sm text-gray-500">
          {{ fileInfo.type || "未知类型" }}
        </div>
      </div>

      <el-progress
        :percentage="progress"
        :format="percentageFormat"
        :stroke-width="10"
        class="w-full"
      />
      <div class="status-text mt-4 text-center">
        {{ statusText }}
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
import ConnectionInfo from "./ConnectionInfo.vue";

interface Props {
  modelValue: boolean;
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
