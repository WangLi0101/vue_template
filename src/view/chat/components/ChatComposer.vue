<template>
  <div
    :class="[
      'composer-shell',
      isDarkMode ? 'composer-shell-dark' : 'composer-shell-light'
    ]"
  >
    <div
      :class="[
        'composer-inner',
        isDarkMode ? 'composer-inner-dark' : 'composer-inner-light'
      ]"
    >
      <button
        :class="[
          'icon-button',
          isDarkMode ? 'icon-button-dark' : 'icon-button-light'
        ]"
        @click="triggerFilePicker"
        title="添加附件"
      >
        <el-icon><Plus /></el-icon>
      </button>

      <div class="flex-1">
        <el-input
          :model-value="modelValue"
          @update:model-value="value => emit('update:modelValue', value)"
          @keyup.enter.exact.prevent="handleEnter"
          type="textarea"
          :rows="1"
          placeholder="输入消息，按 Enter 发送"
          class="message-input"
          resize="none"
          :autosize="{ minRows: 1, maxRows: 4 }"
        />
      </div>

      <button
        :class="[
          'icon-button file',
          isDarkMode ? 'icon-button-file-dark' : 'icon-button-file-light'
        ]"
        @click="triggerFilePicker"
        title="发送文件"
      >
        <el-icon><Document /></el-icon>
      </button>

      <button
        :class="[
          'send-button',
          isDarkMode ? 'send-button-dark' : 'send-button-light'
        ]"
        :disabled="!canSend"
        @click="emitSend"
      >
        <el-icon class="mr-1 text-base"><Promotion /></el-icon>
        <span class="hidden xs:inline">发送</span>
      </button>

      <input
        type="file"
        ref="fileInputRef"
        class="hidden"
        @change="handleFileChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRefs } from "vue";
import { Document, Plus, Promotion } from "@element-plus/icons-vue";

const props = defineProps<{ modelValue: string; isDarkMode: boolean }>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "send"): void;
  (e: "select-file", file: File): void;
}>();

const { modelValue, isDarkMode } = toRefs(props);

const fileInputRef = ref<HTMLInputElement | null>(null);

const canSend = computed(() => modelValue.value.trim().length > 0);

const emitSend = () => {
  if (!canSend.value) return;
  emit("send");
};

const handleEnter = () => {
  emitSend();
};

const triggerFilePicker = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit("select-file", file);
  }
  if (target.value) {
    target.value = "";
  }
};
</script>

<style scoped lang="scss">
.composer-shell {
  padding: clamp(14px, 3vw, 24px);
  border-top: 1px solid transparent;
  backdrop-filter: blur(26px);
  transition:
    background 0.3s ease,
    border-color 0.3s ease;
}

.composer-shell-dark {
  background: linear-gradient(
    180deg,
    rgba(9, 14, 24, 0.85),
    rgba(2, 6, 23, 0.9)
  );
  border-color: rgba(148, 163, 184, 0.12);
}

.composer-shell-light {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.92),
    rgba(226, 232, 240, 0.9)
  );
  border-color: rgba(148, 163, 184, 0.25);
}

.composer-inner {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 24px;
  border: 1px solid transparent;
  transition:
    background 0.3s ease,
    border-color 0.3s ease;
}

.composer-inner-dark {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(148, 163, 184, 0.15);
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.45);
}

.composer-inner-light {
  background: rgba(248, 250, 252, 0.78);
  border-color: rgba(148, 163, 184, 0.25);
  box-shadow: 0 18px 36px rgba(148, 163, 184, 0.35);
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 16px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.icon-button-dark {
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.2);
  color: #e2e8f0;

  &:hover {
    background: rgba(129, 140, 248, 0.2);
    border-color: rgba(129, 140, 248, 0.4);
    transform: translateY(-1px);
  }
}

.icon-button-light {
  background: rgba(226, 232, 240, 0.9);
  border-color: rgba(148, 163, 184, 0.35);
  color: #1f2937;

  &:hover {
    background: rgba(129, 140, 248, 0.2);
    border-color: rgba(129, 140, 248, 0.45);
    transform: translateY(-1px);
  }
}

.icon-button-file-dark {
  background: rgba(14, 165, 233, 0.12);
  border-color: rgba(56, 189, 248, 0.2);
  color: #e0f2fe;

  &:hover {
    background: rgba(56, 189, 248, 0.18);
    border-color: rgba(56, 189, 248, 0.45);
  }
}

.icon-button-file-light {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.35);
  color: #0369a1;

  &:hover {
    background: rgba(56, 189, 248, 0.24);
    border-color: rgba(56, 189, 248, 0.5);
  }
}

::v-deep(.message-input) {
  .el-textarea__inner {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    padding: 12px 16px;
    font-size: 0.95rem;
    line-height: 1.6;
    transition: all 0.2s ease;
    overflow-y: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
}

.composer-inner-dark :deep(.message-input .el-textarea__inner) {
  background: rgba(15, 23, 42, 0.35);
  color: #e2e8f0;

  &:focus {
    border-color: rgba(129, 140, 248, 0.5);
    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.18);
    background: rgba(15, 23, 42, 0.5);
  }

  &::placeholder {
    color: rgba(203, 213, 225, 0.5);
  }
}

.composer-inner-light :deep(.message-input .el-textarea__inner) {
  background: rgba(255, 255, 255, 0.95);
  color: #1f2937;

  &:focus {
    border-color: rgba(129, 140, 248, 0.5);
    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.2);
    background: rgba(255, 255, 255, 1);
  }

  &::placeholder {
    color: rgba(100, 116, 139, 0.6);
  }
}

.send-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 18px;
  height: 42px;
  border-radius: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border: none;
  transition: all 0.2s ease;
}

.send-button-dark {
  background: linear-gradient(
    135deg,
    rgba(129, 140, 248, 0.95),
    rgba(99, 102, 241, 0.95)
  );
  color: #f8fafc;
  box-shadow: 0 18px 30px rgba(99, 102, 241, 0.35);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 20px 36px rgba(129, 140, 248, 0.45);
  }

  &:disabled {
    background: rgba(148, 163, 184, 0.22);
    box-shadow: none;
    cursor: not-allowed;
  }
}

.send-button-light {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.9),
    rgba(56, 189, 248, 0.85)
  );
  color: #1f2937;
  box-shadow: 0 18px 28px rgba(99, 102, 241, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 20px 34px rgba(56, 189, 248, 0.4);
  }

  &:disabled {
    background: rgba(148, 163, 184, 0.3);
    color: rgba(71, 85, 105, 0.7);
    box-shadow: none;
    cursor: not-allowed;
  }
}
</style>
