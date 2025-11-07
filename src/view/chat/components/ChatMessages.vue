<template>
  <div
    :class="[
      'conversation-surface',
      isDarkMode ? 'conversation-dark' : 'conversation-light'
    ]"
    :ref="setContainer"
  >
    <div v-if="!selectedUser" :class="getEmptyStateClasses()">
      <div :class="getEmptyIconClasses()">
        <el-icon class="text-6xl">
          <ChatDotRound />
        </el-icon>
      </div>
      <h3 :class="isDarkMode ? 'text-white/85' : 'text-slate-700'">开始聊天</h3>
      <p :class="isDarkMode ? 'text-white/60' : 'text-slate-500'">
        选择左侧的联系人开始对话
      </p>
    </div>

    <transition-group v-else class="space-y-4" name="message-list" tag="div">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="getMessageWrapperClasses(message)"
      >
        <div
          v-if="message.senderId !== currentUserId"
          :class="getPeerAvatarClasses(message)"
        >
          {{ selectedUser?.userName.charAt(0).toUpperCase() }}
        </div>

        <div :class="getBubbleClasses(message)">
          <p class="bubble-text">{{ message.data }}</p>
          <div
            :class="[
              'bubble-meta',
              isDarkMode ? 'text-white/60' : 'text-slate-500'
            ]"
          >
            {{ formateTime(message.createTime) }}
          </div>
        </div>

        <div
          v-if="message.senderId === currentUserId"
          :class="getSelfAvatarClasses()"
        >
          {{ currentUserName.charAt(0).toUpperCase() }}
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound } from "@element-plus/icons-vue";
import { getUserAvatarColor, formateTime } from "@/utils";
import type { Message, User } from "@/composables/useSocket";
import type { ComponentPublicInstance } from "vue";
import { toRefs } from "vue";

const props = defineProps<{
  messages: Message[];
  selectedUser?: User;
  currentUserId: string;
  currentUserName: string;
  isDarkMode: boolean;
}>();

const emit = defineEmits<{
  (e: "register-container", el: HTMLElement | null): void;
}>();

const { messages, selectedUser, currentUserId, currentUserName, isDarkMode } =
  toRefs(props);

const getEmptyStateClasses = () => [
  "empty-state",
  isDarkMode.value ? "empty-state-dark" : "empty-state-light"
];

const getEmptyIconClasses = () => [
  "empty-icon",
  isDarkMode.value ? "empty-icon-dark" : "empty-icon-light"
];

const getMessageWrapperClasses = (message: Message) => [
  "flex items-end gap-3",
  message.senderId === currentUserId.value
    ? "justify-end message-outgoing"
    : "justify-start message-incoming"
];

const getPeerAvatarClasses = (_message: Message) => {
  const base = [
    "peer-avatar",
    isDarkMode.value ? "peer-avatar-dark" : "peer-avatar-light"
  ];
  const colorClass = selectedUser.value
    ? getUserAvatarColor(selectedUser.value.userName)
    : isDarkMode.value
      ? "bg-slate-600"
      : "bg-slate-400";
  return [...base, colorClass];
};

const getBubbleClasses = (message: Message) => {
  const base = ["bubble"];
  if (message.senderId === currentUserId.value) {
    base.push(isDarkMode.value ? "bubble-self-dark" : "bubble-self-light");
  } else {
    base.push(isDarkMode.value ? "bubble-peer-dark" : "bubble-peer-light");
  }
  return base;
};

const getSelfAvatarClasses = () => [
  "peer-avatar self",
  isDarkMode.value ? "self-dark" : "self-light"
];

const setContainer = (el: Element | ComponentPublicInstance | null) => {
  emit("register-container", el instanceof HTMLElement ? el : null);
};
</script>

<style scoped lang="scss">
.conversation-surface {
  flex: 1;
  overflow-y: auto;
  padding: clamp(16px, 4vw, 32px);
  padding-bottom: clamp(28px, 6vw, 56px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  transition: background 0.3s ease;
}

.conversation-dark {
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.6),
    rgba(2, 6, 23, 0.75)
  );
  backdrop-filter: blur(24px);
}

.conversation-dark::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(99, 102, 241, 0.12),
      transparent 45%
    ),
    radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.15), transparent 40%);
  mix-blend-mode: screen;
  opacity: 0.9;
}

.conversation-light {
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, 0.85),
    rgba(226, 232, 240, 0.9)
  );
  backdrop-filter: blur(18px);
}

.empty-state {
  margin: auto;
  text-align: center;
  padding: 48px 36px;
  border-radius: 28px;
  border: 1px dashed;
  max-width: 320px;
  position: relative;
  z-index: 1;
}

.empty-state-dark {
  background: rgba(148, 163, 184, 0.08);
  border-color: rgba(148, 163, 184, 0.2);
  color: #cbd5f5;
}

.empty-state-light {
  background: rgba(226, 232, 240, 0.65);
  border-color: rgba(148, 163, 184, 0.3);
  color: #475569;
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 999px;
  border: 1px solid;
}

.empty-icon-dark {
  background: linear-gradient(
    145deg,
    rgba(148, 163, 184, 0.2),
    rgba(148, 163, 184, 0.05)
  );
  border-color: rgba(148, 163, 184, 0.2);
  color: #cbd5f5;
}

.empty-icon-light {
  background: linear-gradient(
    145deg,
    rgba(148, 163, 184, 0.18),
    rgba(226, 232, 240, 0.28)
  );
  border-color: rgba(148, 163, 184, 0.35);
  color: #64748b;
}

.peer-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f8fafc;
  position: relative;
  z-index: 1;
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.35);
}

.peer-avatar-dark {
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.35);
}

.peer-avatar-light {
  box-shadow: 0 16px 28px rgba(148, 163, 184, 0.35);
}

.peer-avatar.self {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.85),
    rgba(59, 130, 246, 0.85)
  );
}

.peer-avatar.self.self-dark {
  color: #e8edff;
}

.peer-avatar.self.self-light {
  background: linear-gradient(
    135deg,
    rgba(129, 140, 248, 0.88),
    rgba(56, 189, 248, 0.78)
  );
  color: #1f2937;
}

.bubble {
  max-width: clamp(180px, 60vw, 480px);
  border-radius: 20px;
  padding: 14px 18px;
  position: relative;
  box-shadow: 0 24px 45px rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(12px);
  transition: transform 0.2s ease;
  z-index: 1;
}

.bubble::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.bubble:hover::before {
  opacity: 0.15;
}

.bubble-self-dark {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.95),
    rgba(67, 56, 202, 0.95)
  );
  color: #e0e7ff;
}

.bubble-self-dark::before {
  background: radial-gradient(
    circle at top,
    rgba(255, 255, 255, 0.35),
    transparent 60%
  );
}

.bubble-self-light {
  background: linear-gradient(
    135deg,
    rgba(129, 140, 248, 0.9),
    rgba(56, 189, 248, 0.85)
  );
  color: #1f2937;
}

.bubble-self-light::before {
  background: radial-gradient(
    circle at top,
    rgba(255, 255, 255, 0.6),
    transparent 55%
  );
}

.bubble-peer-dark {
  background: rgba(15, 23, 42, 0.68);
  border: 1px solid rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
}

.bubble-peer-dark::before {
  background: radial-gradient(
    circle at top,
    rgba(148, 163, 184, 0.28),
    transparent 60%
  );
}

.bubble-peer-light {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: #1f2937;
  box-shadow: 0 16px 32px rgba(148, 163, 184, 0.35);
}

.bubble-peer-light::before {
  background: radial-gradient(
    circle at top,
    rgba(148, 163, 184, 0.35),
    transparent 55%
  );
}

.bubble-text {
  font-size: 0.95rem;
  line-height: 1.6;
  word-break: break-word;
}

.bubble-meta {
  margin-top: 10px;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.message-list-enter-active,
.message-list-leave-active {
  transition: all 0.25s ease;
}

.message-list-enter-from,
.message-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 767px) {
  .conversation-surface {
    padding: 16px 16px calc(112px + env(safe-area-inset-bottom, 0));
    gap: 12px;
  }

  .bubble {
    max-width: min(85vw, 420px);
    padding: 12px 16px;
  }

  .bubble-text {
    font-size: 0.92rem;
    line-height: 1.55;
  }

  .bubble-meta {
    margin-top: 8px;
    font-size: 0.68rem;
  }

  .peer-avatar {
    width: 2.4rem;
    height: 2.4rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .bubble {
    max-width: calc(100vw - 96px);
  }
}

.conversation-surface::-webkit-scrollbar {
  width: 6px;
}

.conversation-surface::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    rgba(99, 102, 241, 0.75),
    rgba(56, 189, 248, 0.6)
  );
  border-radius: 999px;
}
</style>
