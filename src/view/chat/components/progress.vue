<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="520px"
    :max-width="500"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="progress-dialog"
  >
    <div class="dialog-content">
      <div v-if="fileInfo" class="file-header">
        <span class="file-icon-wrap">
          <el-icon class="file-icon"><Document /></el-icon>
        </span>
        <div class="file-meta">
          <div class="file-name">{{ fileInfo.name }}</div>
          <div class="file-extra">
            <span>{{ formatFileSize(fileInfo.size) }}</span>
            <span class="dot" aria-hidden="true">•</span>
            <span>{{ fileInfo.type || "未知类型" }}</span>
          </div>
        </div>
        <span class="status-chip" :class="statusChipClass">
          {{ statusChipText }}
        </span>
      </div>

      <div class="progress-card">
        <el-progress
          class="progress-bar"
          :percentage="progress"
          :format="percentageFormat"
          :stroke-width="14"
          :color="progressColors"
          :status="progressStatus"
        />
        <div class="status-text">{{ statusText }}</div>
        <div class="secondary-text">{{ secondaryStatusText }}</div>
      </div>

      <div v-if="showCancelButton" class="action-row">
        <el-button
          class="cancel-button"
          type="danger"
          plain
          size="small"
          @click="handleCancel"
        >
          {{ cancelText }}
        </el-button>
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
  cancelable?: boolean;
  cancelText?: string;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "cancel"): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "文件传输",
  progress: 0,
  fileInfo: null,
  peerConnection: null,
  showConnectionInfo: true,
  cancelable: false,
  cancelText: "取消传输"
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

const progressColors: Array<{ color: string; percentage: number }> = [
  { color: "#409EFF", percentage: 20 },
  { color: "#36D1DC", percentage: 60 },
  { color: "#4CAF50", percentage: 100 }
];

const progressStatus = computed<
  "success" | "warning" | "exception" | undefined
>(() => (props.progress >= 100 ? "success" : undefined));

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

const statusChipText = computed(() => {
  if (props.progress >= 100) return "已完成";
  if (props.progress <= 0) return "等待中";
  return "传输中";
});

const statusChipClass = computed(() => {
  if (props.progress >= 100) return "status-chip--success";
  if (props.progress <= 0) return "status-chip--pending";
  return "status-chip--active";
});

// 状态文本
const statusText = computed(() => {
  if (props.progress === 0) return "正在准备传输";
  if (props.progress === 100) return "传输完成";
  return "文件传输进行中";
});

const secondaryStatusText = computed(() => {
  if (props.progress === 0) return "正在初始化数据通道，请稍候...";
  if (props.progress === 100) return "传输完成，您可以安全关闭此窗口";
  return "请保持窗口开启以确保传输不中断";
});

const showCancelButton = computed(
  () => props.cancelable && props.progress < 100
);

const cancelText = computed(() => props.cancelText ?? "取消传输");

const handleCancel = () => {
  emit("cancel");
};
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
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px;

  @media (min-width: 768px) {
    padding: 12px;
    gap: 18px;
  }
}

.file-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    rgba(64, 158, 255, 0.12),
    rgba(198, 239, 255, 0.2)
  );
  border: 1px solid rgba(64, 158, 255, 0.1);
  box-shadow: 0 8px 18px rgba(64, 158, 255, 0.12);

  @media (min-width: 768px) {
    padding: 16px 18px;
  }
}

.file-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, #409eff, #36d1dc);
  color: #fff;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.25);

  @media (min-width: 768px) {
    width: 52px;
    height: 52px;
  }
}

.file-icon {
  font-size: 22px;

  @media (min-width: 768px) {
    font-size: 24px;
  }
}

.file-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.file-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (min-width: 768px) {
    font-size: 16px;
  }
}

.file-extra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;

  @media (min-width: 768px) {
    font-size: 13px;
  }
}

.file-extra .dot {
  font-size: 14px;
  opacity: 0.6;
}

.status-chip {
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
  white-space: nowrap;

  @media (min-width: 768px) {
    font-size: 12px;
  }
}

.status-chip--pending {
  background-color: rgba(255, 153, 0, 0.12);
  color: #e6a23c;
}

.status-chip--active {
  background-color: rgba(64, 158, 255, 0.12);
  color: #409eff;
}

.status-chip--success {
  background-color: rgba(103, 194, 58, 0.16);
  color: #529b2e;
}

.progress-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(64, 158, 255, 0.12);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9),
    rgba(238, 248, 255, 0.85)
  );
  box-shadow: 0 10px 24px rgba(31, 45, 61, 0.08);

  @media (min-width: 768px) {
    padding: 18px 20px;
    gap: 12px;
  }
}

.progress-bar {
  :deep(.el-progress-bar__outer) {
    background-color: rgba(31, 45, 61, 0.08);
  }

  :deep(.el-progress-bar__inner) {
    transition:
      width 0.4s ease-out,
      background-color 0.4s ease-out;
  }

  :deep(.el-progress__text) {
    font-size: 12px;
    color: #1f2d3d;

    @media (min-width: 768px) {
      font-size: 13px;
    }
  }
}

.status-text {
  font-size: 13px;
  font-weight: 500;
  color: #1f2d3d;

  @media (min-width: 768px) {
    font-size: 14px;
  }
}

.secondary-text {
  font-size: 12px;
  color: #606266;

  @media (min-width: 768px) {
    font-size: 12.5px;
  }
}

.action-row {
  display: flex;
  justify-content: flex-end;

  .cancel-button {
    min-width: 112px;
    border-radius: 999px;
    border-color: rgba(245, 108, 108, 0.4);
    color: #f56c6c;
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(245, 108, 108, 0.6);
      background-color: rgba(245, 108, 108, 0.08);
    }
  }
}

.connection-info {
  background: rgba(31, 45, 61, 0.04);
  border: 1px dashed rgba(31, 45, 61, 0.08);
  border-radius: 12px;
  padding: 12px;
  font-size: 12px;

  @media (min-width: 768px) {
    font-size: 13px;
    padding: 14px;
  }
}
</style>
