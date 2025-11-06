<template>
  <div
    :class="[
      'flex flex-col md:flex-row h-screen transition-colors duration-500',
      isDarkMode
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 theme-dark'
        : 'bg-gradient-to-br from-slate-100 via-white to-slate-100 text-slate-800 theme-light'
    ]"
  >
    <ChatSidebar
      v-model:search-query="searchQuery"
      :filtered-users="filteredUsers"
      :selected-user-id="selectedUser?.id"
      :show-chat-area="showChatArea"
      :socket-name="socketStore.name"
      :socket-user-id="socketStore.userId"
      :is-dark-mode="isDarkMode"
      @select="handleSelectUser"
    />

    <div
      :class="[
        'flex-1 flex flex-col',
        isDarkMode
          ? 'bg-slate-900/35 backdrop-blur-2xl border-l border-white/10'
          : 'bg-white/80 backdrop-blur-xl border-l border-slate-200/70',
        !showChatArea ? 'hidden md:flex' : 'w-full'
      ]"
    >
      <ChatHeader
        :selected-user="selectedUser"
        :show-chat-area="showChatArea"
        :is-dark-mode="isDarkMode"
        @toggle-theme="toggleTheme"
        @back="setShowChatArea(false)"
        @call="callVideo"
        @test-ice="testIceServers"
      />

      <ChatMessages
        :messages="messages"
        :selected-user="selectedUser"
        :current-user-id="socketStore.userId"
        :current-user-name="socketStore.name"
        :is-dark-mode="isDarkMode"
        @register-container="setMessagesContainer"
      />

      <ChatComposer
        v-if="selectedUser"
        v-model="currentMessage"
        :is-dark-mode="isDarkMode"
        @send="sendCurrentMessage"
        @select-file="handleSendFile"
      />
    </div>

    <IncomingCallDialog
      v-model="incomingCallVisible"
      :caller-name="incomingCallerName"
      :avatar-color="getUserAvatarColor(incomingCallerName)"
      :call-type="incomingOfferType"
      @accept="accept"
      @reject="rejectCall"
    />

    <VideoDialog
      v-model="videoDialogVisible"
      ref="videoDialogRef"
      :peer-connection="peerConnection"
      @hang-up="handleHangUp"
    />

    <Progress
      v-model="fileDialogVisible"
      title="接收文件"
      :progress="fileProgress"
      :file-info="receivedFileInfo"
      :peer-connection="peerConnection"
    />

    <Progress
      v-model="sendingFileDialogVisible"
      title="发送文件"
      :progress="sendingProgress"
      :file-info="sendingFileInfo"
      :peer-connection="peerConnection"
    />

    <MobileNav
      :visible="Boolean(selectedUser)"
      :show-chat-area="showChatArea"
      @back-to-list="setShowChatArea(false)"
      @go-chat="setShowChatArea(true)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import ChatSidebar from "./components/ChatSidebar.vue";
import ChatHeader from "./components/ChatHeader.vue";
import ChatMessages from "./components/ChatMessages.vue";
import ChatComposer from "./components/ChatComposer.vue";
import MobileNav from "./components/MobileNav.vue";
import VideoDialog from "./components/videoDialog.vue";
import IncomingCallDialog from "./components/IncomingCallDialog.vue";
import Progress from "./components/progress.vue";
import { useSocketStore, type CallbackPayload } from "@/store/modules/socket";
import { useSocket, type Message } from "@/composables/useSocket";
import { useChatUI } from "./composables/useChatUI";
import { useRtcCommunication } from "./composables/useRtcCommunication";
import { testIceServers } from "@/utils/rtc";
import { getUserAvatarColor } from "@/utils";

const socketStore = useSocketStore();
const currentMessage = ref("");
const isDarkMode = ref(true);
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
};

const {
  users,
  messages,
  selectedUserId,
  sendMessage,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
  sendCallControl,
  selectUser,
  initSocket,
  setSignalHandlers
} = useSocket();

const selectedUser = computed(() =>
  users.value.find(user => user.id === selectedUserId.value)
);

const {
  searchQuery,
  showChatArea,
  isMobileView,
  filteredUsers,

  setShowChatArea,
  setMessagesContainer
} = useChatUI({
  users,
  messages,
  selectedUser
});

const {
  videoDialogVisible,
  videoDialogRef,
  incomingCallVisible,
  incomingCallerName,
  peerConnection,
  handleAnswer: rtcHandleAnswer,
  handleOffer: rtcHandleOffer,
  handleIceCandidate: rtcHandleIceCandidate,
  handleCallControl: rtcHandleCallControl,
  callVideo,
  accept,
  rejectCall,
  handleHangUp,
  sendFile,
  fileDialogVisible,
  fileProgress,
  receivedFileInfo,
  sendingFileDialogVisible,
  sendingProgress,
  sendingFileInfo,
  incomingOfferType
} = useRtcCommunication({
  selectedUser,
  users,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
  sendCallControl
});

setSignalHandlers({
  handleAnswer: rtcHandleAnswer,
  handleOffer: rtcHandleOffer,
  handleIceCandidate: rtcHandleIceCandidate,
  handleCallControl: rtcHandleCallControl
});

const sendCurrentMessage = () => {
  if (!currentMessage.value.trim() || !selectedUser.value) return;
  sendMessage(
    {
      type: "text",
      receiverId: selectedUser.value.id,
      data: currentMessage.value
    },
    (data: CallbackPayload<Message>) => {
      if (data.code === 0 && data.payload) {
        messages.value.push(data.payload);
      }
    }
  );
  currentMessage.value = "";
};

const handleSelectUser = (userId: string) => {
  selectUser(userId);
  if (isMobileView.value) {
    setShowChatArea(true);
  }
};

const handleSendFile = (file: File) => {
  sendFile(file);
};

onMounted(async () => {
  await initSocket();
});
</script>

<style lang="scss" scoped>
:deep(.ice-test-result-dialog) {
  .el-message-box {
    width: 600px;
    max-width: 90vw;
  }

  .el-message-box__content {
    max-height: 70vh;
    overflow-y: auto;
  }
}
</style>
