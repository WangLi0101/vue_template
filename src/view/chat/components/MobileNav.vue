<template>
  <div
    v-if="visible"
    :class="[
      'mobile-nav fixed bottom-0 left-0 right-0 border-t shadow-lg md:hidden z-20 backdrop-blur-xl transition-colors duration-300',
      isDarkMode
        ? 'bg-slate-950/85 border-slate-700/60 text-slate-100'
        : 'bg-white/90 border-slate-200 text-slate-900'
    ]"
  >
    <div class="nav-actions">
      <button
        type="button"
        class="nav-item"
        :class="[
          isDarkMode ? 'nav-item-dark' : 'nav-item-light',
          !showChatArea ? 'nav-item-active' : ''
        ]"
        :aria-pressed="String(!showChatArea)"
        @click="emit('back-to-list')"
      >
        <el-icon class="nav-icon"><UserIcon /></el-icon>
        <span>联系人</span>
      </button>
      <button
        type="button"
        class="nav-item"
        :class="[
          isDarkMode ? 'nav-item-dark' : 'nav-item-light',
          showChatArea ? 'nav-item-active' : ''
        ]"
        :aria-pressed="String(showChatArea)"
        @click="emit('go-chat')"
      >
        <el-icon class="nav-icon"><ChatDotRound /></el-icon>
        <span>聊天</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound, User as UserIcon } from "@element-plus/icons-vue";

const { showChatArea, visible, isDarkMode } = defineProps<{
  showChatArea: boolean;
  visible: boolean;
  isDarkMode: boolean;
}>();

const emit = defineEmits<{
  (e: "back-to-list"): void;
  (e: "go-chat"): void;
}>();
</script>

<style scoped lang="scss">
.mobile-nav {
  padding: 0.75rem 1.75rem calc(0.75rem + env(safe-area-inset-bottom, 0));
  display: flex;
  justify-content: center;
}

.nav-actions {
  width: min(420px, 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.nav-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.6rem 1rem;
  border-radius: 1.1rem;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.nav-item span {
  font-size: 0.7rem;
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-item-light {
  color: #475569;
}

.nav-item-dark {
  color: rgba(241, 245, 249, 0.75);
}

.nav-item:hover {
  transform: translateY(-1px);
}

.nav-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.35);
}

.nav-item-active {
  transform: translateY(-2px);
}

.nav-item-active.nav-item-light {
  background: rgba(129, 140, 248, 0.16);
  border-color: rgba(99, 102, 241, 0.32);
  color: #1f2937;
  box-shadow: 0 14px 28px rgba(99, 102, 241, 0.25);
}

.nav-item-active.nav-item-dark {
  background: rgba(99, 102, 241, 0.28);
  border-color: rgba(129, 140, 248, 0.42);
  color: #f8fafc;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.55);
}

@media (max-width: 420px) {
  .mobile-nav {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }

  .nav-actions {
    gap: 0.75rem;
  }

  .nav-item {
    padding: 0.5rem 0.85rem;
  }

  .nav-icon {
    font-size: 1.15rem;
  }
}

@media (max-width: 360px) {
  .nav-actions {
    gap: 0.6rem;
  }

  .nav-item {
    padding: 0.45rem 0.75rem;
  }

  .nav-item span {
    font-size: 0.65rem;
  }
}
</style>
