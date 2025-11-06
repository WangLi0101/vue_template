import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type Ref
} from "vue";
import type { Message, User } from "@/composables/useSocket";

interface UseChatUIOptions {
  users: Ref<User[]>;
  messages: Ref<Message[]>;
  selectedUser: Ref<User | undefined>;
}

export function useChatUI({ users, messages, selectedUser }: UseChatUIOptions) {
  const searchQuery = ref("");
  const showChatArea = ref(false);
  const isMobileView = ref(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const messagesContainer = ref<HTMLElement | null>(null);

  const filteredUsers = computed(() => {
    const keyword = searchQuery.value.trim().toLowerCase();
    if (!keyword) {
      return users.value;
    }
    return users.value.filter(user =>
      user.userName.toLowerCase().includes(keyword)
    );
  });

  const handleResize = () => {
    if (typeof window === "undefined") return;

    isMobileView.value = window.innerWidth < 768;

    if (!isMobileView.value) {
      showChatArea.value = false;
    }
  };

  const scrollToBottom = () => {
    nextTick(() => {
      const container = messagesContainer.value;
      if (!container) return;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "auto"
      });
    });
  };

  watch(messages, scrollToBottom, { deep: true });

  watch(selectedUser, newVal => {
    if (newVal && isMobileView.value) {
      showChatArea.value = true;
    }
  });

  onMounted(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("resize", handleResize);
    handleResize();
  });

  onUnmounted(() => {
    if (typeof window === "undefined") return;
    window.removeEventListener("resize", handleResize);
  });

  const setShowChatArea = (value: boolean) => {
    showChatArea.value = value;
  };

  const setMessagesContainer = (el: HTMLElement | null) => {
    messagesContainer.value = el;
  };

  return {
    searchQuery,
    showChatArea,
    isMobileView,
    filteredUsers,
    messagesContainer,
    handleResize,
    scrollToBottom,
    setShowChatArea,
    setMessagesContainer
  };
}
