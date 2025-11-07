<template>
  <div
    :class="[
      'chat-header',
      isDarkMode ? 'chat-header-dark' : 'chat-header-light'
    ]"
  >
    <el-button
      v-if="showChatArea"
      circle
      size="small"
      :class="[
        'back-btn md:hidden',
        isDarkMode ? 'back-btn-dark' : 'back-btn-light'
      ]"
      @click="emit('back')"
    >
      <el-icon><ArrowLeft /></el-icon>
    </el-button>

    <div class="header-content">
      <div class="flex-1 min-w-0">
        <div v-if="selectedUser" class="flex items-center space-x-4">
          <div class="relative">
            <div
              :class="[
                'user-avatar',
                getUserAvatarColor(selectedUser.userName)
              ]"
            >
              {{ selectedUser.userName.charAt(0).toUpperCase() }}
            </div>
            <div
              :class="[
                'status-dot',
                isDarkMode ? 'status-dot-dark' : 'status-dot-light',
                selectedUser.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
              ]"
            />
          </div>
          <div class="min-w-0">
            <h3
              :class="[
                'text-lg font-semibold flex items-center gap-2 truncate',
                isDarkMode ? 'text-white/90' : 'text-slate-800'
              ]"
            >
              <span class="truncate">{{ selectedUser.userName }}</span>
              <span
                v-if="selectedUser.isSelf"
                :class="[
                  'tag-self',
                  isDarkMode ? 'tag-self-dark' : 'tag-self-light'
                ]"
              >
                我
              </span>
            </h3>
            <div
              :class="[
                'flex items-center space-x-2 text-xs',
                isDarkMode ? 'text-white/60' : 'text-slate-500'
              ]"
            >
              <div
                :class="[
                  'inline-flex h-1.5 w-1.5 rounded-full',
                  selectedUser.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                ]"
              />
              <p>{{ selectedUser.isOnline ? "在线" : "离线" }}</p>
            </div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center py-3 w-full">
          <div
            :class="[
              'text-center space-y-2',
              isDarkMode ? 'text-white/70' : 'text-slate-500'
            ]"
          >
            <el-icon
              :class="[
                'text-4xl',
                isDarkMode ? 'opacity-60' : 'text-slate-400/80'
              ]"
            >
              <ChatDotRound />
            </el-icon>
            <p class="text-sm">请选择一个联系人开始聊天</p>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <div
          v-if="selectedUser && selectedUser.isOnline && !selectedUser.isSelf"
          :class="[
            'control-dock',
            isDarkMode ? 'control-dock-dark' : 'control-dock-light'
          ]"
        >
          <button
            :class="dockBtnClasses"
            @click="emit('call', false)"
            title="语音通话"
          >
            <el-icon><Phone /></el-icon>
          </button>
          <button
            :class="dockBtnClasses"
            @click="emit('call', true)"
            title="视频通话"
          >
            <el-icon><VideoCamera /></el-icon>
          </button>
          <button
            :class="dockBtnClasses"
            @click="emit('test-ice')"
            title="测试 ICE"
          >
            <el-icon><Connection /></el-icon>
          </button>
          <button
            :class="dockBtnClasses"
            @click="emit('more')"
            title="更多操作"
          >
            <el-icon><More /></el-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from "vue";
import {
  ArrowLeft,
  ChatDotRound,
  Connection,
  More,
  Phone,
  VideoCamera
} from "@element-plus/icons-vue";
import { getUserAvatarColor } from "@/utils";
import type { User } from "@/composables/useSocket";

const props = defineProps<{
  selectedUser?: User;
  showChatArea: boolean;
  isDarkMode: boolean;
}>();

const emit = defineEmits<{
  (e: "back"): void;
  (e: "call", isVideo: boolean): void;
  (e: "test-ice"): void;
  (e: "more"): void;
}>();

const { isDarkMode, selectedUser, showChatArea } = toRefs(props);

const dockBtnClasses = computed(() => [
  "dock-btn",
  isDarkMode.value ? "dock-btn-dark" : "dock-btn-light"
]);
</script>

<style scoped lang="scss">
.chat-header {
  display: flex;
  align-items: center;
  padding: 20px clamp(18px, 4vw, 28px);
  border-bottom: 1px solid transparent;
  backdrop-filter: blur(20px);
  gap: 16px;
  transition:
    background 0.3s ease,
    border-color 0.3s ease;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header-dark {
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.85),
    rgba(15, 23, 42, 0.75)
  );
  border-color: rgba(148, 163, 184, 0.12);
}

.chat-header-light {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95),
    rgba(241, 245, 249, 0.95)
  );
  border-color: rgba(148, 163, 184, 0.26);
}

.back-btn {
  transition: all 0.2s ease;
}

.back-btn-dark {
  background: rgba(148, 163, 184, 0.12);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.2);

  &:hover {
    background: rgba(99, 102, 241, 0.25);
    border-color: rgba(99, 102, 241, 0.45);
  }
}

.back-btn-light {
  background: rgba(148, 163, 184, 0.15);
  color: #1f2937;
  border: 1px solid rgba(148, 163, 184, 0.25);

  &:hover {
    background: rgba(59, 130, 246, 0.18);
    border-color: rgba(59, 130, 246, 0.4);
  }
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1.125rem;
  box-shadow: 0 18px 30px rgba(15, 23, 42, 0.35);
  transition: transform 0.2s ease;
}

.status-dot {
  position: absolute;
  bottom: -6px;
  right: -6px;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.3);
}

.status-dot-dark {
  border: 2px solid rgba(15, 23, 42, 0.95);
}

.status-dot-light {
  border: 2px solid rgba(248, 250, 252, 0.95);
}

.tag-self {
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tag-self-dark {
  background: rgba(129, 140, 248, 0.2);
  color: #c7d2fe;
}

.tag-self-light {
  background: rgba(129, 140, 248, 0.18);
  color: #4f46e5;
}

.control-dock {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 0.4rem;
  border-radius: 999px;
  border: 1px solid transparent;
  backdrop-filter: blur(18px);
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.control-dock-dark {
  background: rgba(15, 23, 42, 0.55);
  border-color: rgba(148, 163, 184, 0.16);
}

.control-dock-light {
  background: rgba(226, 232, 240, 0.65);
  border-color: rgba(148, 163, 184, 0.3);
}

.dock-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.dock-btn-dark {
  color: #e2e8f0;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.25),
    rgba(99, 102, 241, 0.2)
  );

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(129, 140, 248, 0.45);
    box-shadow: 0 12px 24px rgba(59, 130, 246, 0.25);
  }
}

.dock-btn-light {
  color: #1f2937;
  background: linear-gradient(
    135deg,
    rgba(129, 140, 248, 0.3),
    rgba(56, 189, 248, 0.28)
  );
  border-color: rgba(148, 163, 184, 0.3);

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(56, 189, 248, 0.45);
    box-shadow: 0 12px 24px rgba(56, 189, 248, 0.2);
  }
}

@media (max-width: 1023px) {
  .chat-header {
    padding: 16px clamp(16px, 6vw, 24px);
  }
}

@media (max-width: 767px) {
  .chat-header {
    padding: 14px 16px;
    gap: 12px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
    gap: 10px;
  }

  .control-dock {
    flex: 1;
    width: 100%;
    justify-content: space-between;
    gap: 10px;
    padding: 0.35rem 0.6rem;
  }

  .dock-btn {
    width: 36px;
    height: 36px;
  }

  .user-avatar {
    width: 2.65rem;
    height: 2.65rem;
    font-size: 1rem;
  }

  .status-dot {
    width: 0.75rem;
    height: 0.75rem;
  }

  .theme-toggle-btn {
    padding: 0.55rem 0.8rem;
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .control-dock {
    justify-content: center;
    gap: 12px;
    padding: 0.4rem 0.6rem;
    flex-wrap: wrap;
  }

  .dock-btn {
    width: 34px;
    height: 34px;
  }

  .theme-toggle-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
