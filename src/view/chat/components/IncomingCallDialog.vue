<template>
  <el-dialog
    v-model="visible"
    :title="headerTitle"
    width="90%"
    :max-width="420"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
    class="incoming-call-dialog"
  >
    <div class="dialog-content">
      <div class="status-pill">{{ statusText }}</div>

      <div class="avatar-wrapper">
        <div class="avatar-ring">
          <div class="avatar" :style="{ backgroundColor: avatarColor }">
            {{ callerInitial }}
          </div>
        </div>
      </div>

      <h3 class="caller-name">{{ callerName }}</h3>
      <p class="caller-hint">{{ actionHint }}</p>
      <p class="caller-meta">{{ supportingText }}</p>

      <div class="actions">
        <el-button
          circle
          size="large"
          class="action-btn reject"
          @click="handleReject"
        >
          <el-icon>
            <component :is="RejectIcon" />
          </el-icon>
        </el-button>
        <el-button
          circle
          size="large"
          class="action-btn accept"
          @click="handleAccept"
        >
          <el-icon>
            <component :is="AcceptIcon" />
          </el-icon>
        </el-button>
      </div>

      <div class="actions-label">
        <span>拒绝</span>
        <span>{{ acceptLabel }}</span>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  CloseBold,
  Document,
  Phone,
  VideoCamera
} from "@element-plus/icons-vue";

interface Props {
  modelValue: boolean;
  callerName: string;
  avatarColor: string;
  callType?: "call" | "file";
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "accept"): void;
  (e: "reject"): void;
}

const props = withDefaults(defineProps<Props>(), {
  callerName: "未知用户",
  avatarColor: "#6366f1",
  callType: "call"
});

const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value)
});

const callerInitial = computed(() => props.callerName.charAt(0).toUpperCase());
const isFileRequest = computed(() => props.callType === "file");

const headerTitle = computed(() => (isFileRequest.value ? "文件请求" : "来电"));
const statusText = computed(() =>
  isFileRequest.value ? "文件传输请求" : "视频通话邀请"
);
const actionHint = computed(() =>
  isFileRequest.value
    ? `${props.callerName} 想向你发送文件`
    : `${props.callerName} 正在呼叫你`
);
const supportingText = computed(() =>
  isFileRequest.value
    ? "确认后将建立数据通道传输文件"
    : "接听后将访问摄像头和麦克风"
);
const acceptLabel = computed(() => (isFileRequest.value ? "接收" : "接听"));

const AcceptIcon = computed(() =>
  isFileRequest.value ? Document : VideoCamera
);
const RejectIcon = computed(() => (isFileRequest.value ? CloseBold : Phone));

const handleAccept = () => emit("accept");
const handleReject = () => emit("reject");
</script>

<style lang="scss" scoped>
::deep(.incoming-call-dialog) {
  .el-dialog {
    border-radius: 20px;
    box-shadow: 0 30px 70px rgba(15, 23, 42, 0.28);
    backdrop-filter: blur(14px);
    background: linear-gradient(
      160deg,
      rgba(248, 250, 252, 0.97),
      rgba(226, 232, 240, 0.92)
    );
    margin: 0.5rem auto !important;
    width: 90% !important;
    max-width: 420px !important;
  }

  .el-dialog__header {
    padding: 16px 16px 0;
    text-align: center;

    .el-dialog__title {
      font-size: 17px;
      font-weight: 600;
      color: #1f2937;

      @media (min-width: 768px) {
        font-size: 18px;
      }
    }
  }

  .el-dialog__body {
    padding: 12px 18px 24px;

    @media (min-width: 768px) {
      padding: 16px 28px 28px;
    }
  }
}

.dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
}

.status-pill {
  background: linear-gradient(120deg, #6366f1, #8b5cf6);
  color: #fff;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin-bottom: 18px;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.35);
}

.avatar-wrapper {
  margin-bottom: 18px;
}

.avatar-ring {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: linear-gradient(
    140deg,
    rgba(99, 102, 241, 0.2),
    rgba(14, 165, 233, 0.25)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.avatar {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 34px;
  font-weight: 700;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.25);
}

.caller-name {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.caller-hint {
  font-size: 15px;
  color: #4b5563;
  margin-bottom: 6px;
}

.caller-meta {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 26px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 12px;
}

.action-btn {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 18px 35px rgba(15, 23, 42, 0.2);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  @media (min-width: 768px) {
    width: 70px;
    height: 70px;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(79, 70, 229, 0.25);
  }

  .el-icon {
    font-size: 24px;
  }
}

.action-btn.reject {
  background: linear-gradient(140deg, #f87171, #ef4444);
  color: #fff;
}

.action-btn.accept {
  background: linear-gradient(140deg, #34d399, #10b981);
  color: #fff;
}

.actions-label {
  display: flex;
  justify-content: center;
  gap: 72px;
  font-size: 13px;
  color: #9ca3af;
  letter-spacing: 0.02em;
}

@media (max-width: 480px) {
  .status-pill {
    margin-bottom: 14px;
  }

  .avatar-ring {
    width: 96px;
    height: 96px;
  }

  .avatar {
    width: 74px;
    height: 74px;
    font-size: 28px;
  }

  .caller-name {
    font-size: 20px;
  }

  .caller-hint {
    font-size: 14px;
  }

  .caller-meta {
    font-size: 12px;
    margin-bottom: 20px;
  }

  .actions-label {
    gap: 56px;
    font-size: 12px;
  }
}
</style>
