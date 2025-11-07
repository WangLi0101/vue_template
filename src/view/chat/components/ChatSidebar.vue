<template>
  <div :class="containerClasses">
    <div class="px-4 pt-5 pb-4 sm:px-6 sm:pt-6">
      <div
        :class="[
          'sidebar-card',
          isDarkMode ? 'sidebar-card-dark' : 'sidebar-card-light'
        ]"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <div class="avatar-shell">
              <el-icon class="text-2xl">
                <ChatDotRound />
              </el-icon>
            </div>
            <div>
              <h2
                :class="[
                  'mt-1 text-2xl font-semibold tracking-tight',
                  isDarkMode ? 'text-white/90' : 'text-slate-800'
                ]"
              >
                {{ socketName || "访客用户" }}
              </h2>
            </div>
          </div>
          <button
            type="button"
            :class="[
              'theme-toggle-btn',
              isDarkMode ? 'theme-toggle-btn-dark' : 'theme-toggle-btn-light'
            ]"
            :data-mode="isDarkMode ? 'dark' : 'light'"
            :aria-label="themeToggleLabel"
            @click="emit('toggle-theme')"
          >
            <span class="theme-toggle-icon">
              <el-icon>
                <component :is="themeToggleIcon" />
              </el-icon>
            </span>
            <span
              class="theme-toggle-text hidden xl:inline"
              :data-mode="isDarkMode ? 'dark' : 'light'"
            >
              {{ themeToggleText }}
            </span>
          </button>
        </div>

        <div
          class="mt-3 text-xs font-mono tracking-wide flex items-center gap-2"
          :class="isDarkMode ? 'text-white/70' : 'text-slate-500'"
        >
          <p
            :class="[
              'text-xs',
              isDarkMode ? 'text-white/60' : 'text-slate-500'
            ]"
          >
            我的ID:
          </p>
          {{ socketUserId }}
        </div>
      </div>
    </div>

    <div class="px-4 pb-4 sm:px-6">
      <div
        :class="[
          'search-card',
          isDarkMode ? 'search-card-dark' : 'search-card-light'
        ]"
      >
        <el-input
          :model-value="searchQuery"
          placeholder="搜索联系人"
          class="search-input"
          clearable
          @update:model-value="value => emit('update:searchQuery', value)"
        >
          <template #prefix>
            <el-icon :class="isDarkMode ? 'text-slate-300' : 'text-slate-500'">
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <div
      class="flex-1 overflow-y-auto px-4 pb-24 md:pb-6 sm:px-6 custom-scrollbar"
    >
      <transition-group
        name="fade-list"
        tag="div"
        class="space-y-2 sm:space-y-3"
      >
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          @click="() => emit('select', user.id)"
          :class="[
            'contact-card group cursor-pointer rounded-2xl border transition duration-300',
            isDarkMode
              ? 'border-white/10 bg-white/10 hover:bg-white/20 text-white'
              : 'border-slate-200/70 bg-white/85 hover:bg-white text-slate-800',
            selectedUserId === user.id
              ? isDarkMode
                ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-indigo-400/80 scale-[1.01]'
                : 'ring-2 ring-offset-2 ring-offset-white ring-indigo-500/70 scale-[1.01]'
              : 'hover:scale-[1.01]'
          ]"
        >
          <div class="flex items-center space-x-4">
            <div class="relative">
              <div
                :class="[
                  'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-semibold text-lg shadow-xl transition-all duration-300',
                  getUserAvatarColor(user.userName)
                ]"
              >
                {{ user.userName?.charAt(0).toUpperCase() }}
              </div>
              <span
                :class="[
                  'absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-full border shadow-md',
                  isDarkMode ? 'border-slate-950' : 'border-white',
                  user.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                ]"
              />
              <span
                v-if="user.isNewMessage"
                class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 border border-white animate-ping"
              />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p
                  :class="[
                    'text-sm font-semibold tracking-wide truncate',
                    isDarkMode ? 'text-white/90' : 'text-slate-800'
                  ]"
                >
                  {{ user.userName }}
                </p>
                <el-badge
                  v-if="user.isNewMessage && selectedUserId !== user.id"
                  value="新"
                  :type="isDarkMode ? 'danger' : 'primary'"
                />
              </div>
              <div class="mt-1 flex items-center justify-between text-xs">
                <div
                  :class="[
                    'flex items-center space-x-2',
                    isDarkMode ? 'text-white/60' : 'text-slate-500'
                  ]"
                >
                  <span
                    :class="[
                      'inline-flex h-1.5 w-1.5 rounded-full',
                      user.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                    ]"
                  />
                  <span>{{ user.isOnline ? "在线" : "离线" }}</span>
                </div>
                <span
                  v-if="user.isSelf"
                  :class="[
                    'px-2 py-0.5 rounded-full text-[11px]',
                    isDarkMode
                      ? 'bg-indigo-500/20 text-indigo-200'
                      : 'bg-indigo-500/15 text-indigo-500'
                  ]"
                >
                  我
                </span>
              </div>
            </div>
          </div>
        </div>
      </transition-group>

      <div
        v-if="filteredUsers.length === 0"
        :class="[
          'empty-state',
          isDarkMode ? 'empty-state-dark' : 'empty-state-light'
        ]"
      >
        <el-icon
          class="text-4xl mb-2"
          :class="isDarkMode ? 'text-white/40' : 'text-slate-400/80'"
        >
          <UserIcon />
        </el-icon>
        <p :class="isDarkMode ? 'text-white/60' : 'text-slate-500'">
          {{ searchQuery ? "未找到匹配的联系人" : "暂无联系人" }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from "vue";
import {
  ChatDotRound,
  Search,
  User as UserIcon,
  Moon,
  Sunny
} from "@element-plus/icons-vue";
import type { User } from "@/composables/useSocket";
import { getUserAvatarColor } from "@/utils";

const props = defineProps<{
  filteredUsers: User[];
  selectedUserId?: string;
  searchQuery: string;
  showChatArea: boolean;
  socketName: string;
  socketUserId: string;
  isDarkMode: boolean;
}>();

const emit = defineEmits<{
  (e: "update:searchQuery", value: string): void;
  (e: "select", userId: string): void;
  (e: "toggle-theme"): void;
}>();

const {
  filteredUsers,
  selectedUserId,
  searchQuery,
  showChatArea,
  socketName,
  socketUserId,
  isDarkMode
} = toRefs(props);

const containerClasses = computed(() => [
  "flex h-full flex-col transition-all duration-300",
  showChatArea.value
    ? "hidden md:flex md:w-[320px] lg:w-[360px]"
    : "w-full md:w-[320px] lg:w-[360px]",
  isDarkMode.value
    ? "border-r border-white/10 bg-slate-900/35 backdrop-blur-2xl shadow-[0_25px_60px_rgba(15,23,42,0.45)]"
    : "border-r border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-[0_20px_45px_rgba(148,163,184,0.35)]"
]);

const themeToggleIcon = computed(() => (isDarkMode.value ? Sunny : Moon));
const themeToggleLabel = computed(() =>
  isDarkMode.value ? "切换至亮色" : "切换至暗色"
);
const themeToggleText = computed(() =>
  isDarkMode.value ? "暗色模式" : "亮色模式"
);
</script>

<style scoped lang="scss">
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.4) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(
      180deg,
      rgba(129, 140, 248, 0.8),
      rgba(59, 130, 246, 0.7)
    );
    border-radius: 999px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.sidebar-card {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 0 28px 70px rgba(30, 64, 175, 0.35);
}

.sidebar-card-dark {
  background: linear-gradient(
    140deg,
    rgba(30, 48, 90, 0.9),
    rgba(79, 70, 229, 0.8)
  );
}

.sidebar-card-light {
  background: linear-gradient(
    140deg,
    rgba(226, 232, 240, 0.9),
    rgba(192, 213, 255, 0.85)
  );
  border-color: rgba(148, 163, 184, 0.3);
}

.sidebar-card.gradient::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: radial-gradient(
    circle at top,
    rgba(255, 255, 255, 0.25),
    transparent 55%
  );
  pointer-events: none;
  opacity: 0.3;
}

.avatar-shell {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
}

.avatar-shell :deep(.el-icon) {
  width: 1.5rem;
  height: 1.5rem;
  font-size: 1.5rem;
  line-height: 1;
}

.search-card {
  border-radius: 18px;
  padding: 10px 14px;
}

.search-card-dark {
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.08);
}

.search-card-light {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.8);
}

::v-deep(.search-input) {
  .el-input__wrapper {
    border-radius: 16px;
    box-shadow: none;
    background: rgba(148, 163, 184, 0.12);
    border: 1px solid rgba(148, 163, 184, 0.2);
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(129, 140, 248, 0.45);
    }

    &.is-focus {
      border-color: rgba(99, 102, 241, 0.9);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
      background: rgba(148, 163, 184, 0.18);
    }
  }
}

.contact-card {
  padding: 16px;
  backdrop-filter: blur(18px);
}

.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s ease;
  backdrop-filter: blur(14px);
  flex-shrink: 0;

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.35);
  }
}

.theme-toggle-btn-dark {
  background: rgba(15, 23, 42, 0.55);
  color: #e2e8f0;
  border-color: rgba(99, 102, 241, 0.25);

  &:hover {
    background: rgba(99, 102, 241, 0.45);
    border-color: rgba(129, 140, 248, 0.5);
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.45);
  }
}

.theme-toggle-btn-light {
  background: rgba(241, 245, 249, 0.9);
  color: #1f2937;
  border-color: rgba(148, 163, 184, 0.3);

  &:hover {
    background: rgba(129, 140, 248, 0.18);
    border-color: rgba(129, 140, 248, 0.35);
    box-shadow: 0 16px 28px rgba(148, 163, 184, 0.32);
  }
}

.theme-toggle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(241, 245, 249, 0.85);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.35);
  transition: all 0.22s ease;
}

.theme-toggle-btn-dark .theme-toggle-icon {
  background: rgba(15, 23, 42, 0.85);
  box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.5);
}

.theme-toggle-text {
  letter-spacing: 0.04em;
  transition: color 0.2s ease;
}

.theme-toggle-text[data-mode="dark"] {
  color: rgba(226, 232, 240, 0.85);
}

.theme-toggle-text[data-mode="light"] {
  color: rgba(30, 41, 59, 0.85);
}

@media (max-width: 767px) {
  .sidebar-card {
    border-radius: 20px;
    padding: 18px;
  }

  .avatar-shell {
    width: 2.5rem;
    height: 2.5rem;
  }

  .search-card {
    padding: 8px 12px;
  }

  .contact-card {
    padding: 12px;
    border-radius: 18px;
  }

  .theme-toggle-btn {
    padding: 0.5rem 0.6rem;
    gap: 6px;
  }

  .theme-toggle-icon {
    width: 28px;
    height: 28px;
  }

  .empty-state {
    margin-top: 24px;
    padding: 28px 24px;
  }
}

.empty-state {
  margin-top: 32px;
  padding: 36px;
  text-align: center;
  border-radius: 20px;
  backdrop-filter: blur(12px);
  border: 1px dashed;
}

.empty-state-dark {
  background: rgba(148, 163, 184, 0.08);
  border-color: rgba(148, 163, 184, 0.25);
}

.empty-state-light {
  background: rgba(226, 232, 240, 0.45);
  border-color: rgba(148, 163, 184, 0.35);
}

.fade-list-enter-active,
.fade-list-leave-active {
  transition: all 0.25s ease;
}

.fade-list-enter-from,
.fade-list-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
