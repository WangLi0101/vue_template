<template>
  <div
    class="flex h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50"
  >
    <!-- 左侧用户列表 -->
    <div
      class="w-1/3 bg-white/90 backdrop-blur-sm border-r border-gray-200/60 flex flex-col shadow-sm"
    >
      <!-- 头部 -->
      <div
        class="p-6 border-b border-gray-200/60 bg-gradient-to-r from-slate-600 to-gray-600 text-white"
      >
        <div class="flex items-center space-x-3 mb-3">
          <div
            class="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <el-icon class="text-xl">
              <ChatDotRound />
            </el-icon>
          </div>
          <div>
            <h2 class="text-xl font-bold">聊天室</h2>
            <p class="text-slate-200 text-sm">{{ socketStore.name }}</p>
          </div>
        </div>
        <div class="flex items-center space-x-2 text-sm text-slate-200">
          <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span>在线 · ID: {{ socketStore.userId }}</span>
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="p-4">
        <div class="relative">
          <el-input
            v-model="searchQuery"
            placeholder="搜索联系人..."
            class="search-input"
            clearable
          >
            <template #prefix>
              <el-icon class="text-gray-400">
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 用户列表 -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          @click="selectUser(user.id)"
          :class="[
            'p-4 cursor-pointer border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 transition-all duration-300 transform hover:scale-[1.01]',
            selectedUser?.id === user.id
              ? 'bg-gradient-to-r from-slate-100 to-gray-100 border-l-4 border-l-slate-500 shadow-sm'
              : ''
          ]"
        >
          <div class="flex items-center space-x-3">
            <div class="relative">
              <div
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300',
                  getUserAvatarColor(user.userName)
                ]"
              >
                {{ user.userName?.charAt(0).toUpperCase() }}
              </div>
              <!-- 在线状态指示器 -->
              <div
                :class="[
                  'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm',
                  user.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                ]"
              />
              <!-- 新消息提示红点 -->
              <div
                v-if="user.isNewMessage"
                class="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-bounce shadow-lg"
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="font-semibold text-gray-900 truncate">
                  {{ user.userName }}
                </p>
                <!-- 新消息徽章 -->
                <el-badge
                  v-if="user.isNewMessage && selectedUser?.id !== user.id"
                  value="新"
                  type="danger"
                  class="animate-pulse"
                />
              </div>
              <div class="flex items-center space-x-2 mt-1">
                <div
                  :class="[
                    'w-2 h-2 rounded-full',
                    user.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  ]"
                />
                <p class="text-sm text-slate-500">
                  {{ user.isOnline ? "在线" : "离线" }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="filteredUsers.length === 0"
          class="p-8 text-center text-slate-500"
        >
          <el-icon class="text-4xl mb-2 text-slate-300">
            <UserIcon />
          </el-icon>
          <p>{{ searchQuery ? "未找到匹配的联系人" : "暂无联系人" }}</p>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="flex-1 flex flex-col bg-white/70 backdrop-blur-sm">
      <!-- 聊天头部 -->
      <div
        class="p-6 bg-white/90 backdrop-blur-sm border-b border-gray-200/60 shadow-sm"
      >
        <div v-if="selectedUser" class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="relative">
              <div
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md',
                  getUserAvatarColor(selectedUser.userName)
                ]"
              >
                {{ selectedUser.userName.charAt(0).toUpperCase() }}
              </div>
              <div
                :class="[
                  'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm',
                  selectedUser.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                ]"
              />
            </div>
            <div>
              <h3 class="font-bold text-slate-900 text-lg">
                {{ selectedUser.userName }}
              </h3>
              <div class="flex items-center space-x-2">
                <div
                  :class="[
                    'w-2 h-2 rounded-full',
                    selectedUser.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  ]"
                />
                <p class="text-sm text-slate-500">
                  {{ selectedUser.isOnline ? "在线" : "离线" }}
                </p>
              </div>
            </div>
          </div>
          <!-- 聊天操作按钮 -->
          <div class="flex items-center space-x-2">
            <el-button
              circle
              size="small"
              class="chat-action-btn"
              @click="callVideo(false)"
            >
              <el-icon><Phone /></el-icon>
            </el-button>
            <el-button
              circle
              size="small"
              class="chat-action-btn"
              @click="callVideo(true)"
            >
              <el-icon><VideoCamera /></el-icon>
            </el-button>
            <el-button
              circle
              size="small"
              class="chat-action-btn"
              @click="testIceServers"
              title="测试ICE服务器"
            >
              <el-icon><Connection /></el-icon>
            </el-button>
            <el-button circle size="small" class="chat-action-btn">
              <el-icon><More /></el-icon>
            </el-button>
          </div>
        </div>
        <div v-else class="flex items-center justify-center py-4">
          <div class="text-center">
            <el-icon class="text-4xl text-slate-300 mb-2">
              <ChatDotRound />
            </el-icon>
            <p class="text-slate-500 text-lg">请选择一个联系人开始聊天</p>
          </div>
        </div>
      </div>

      <!-- 消息区域 -->
      <div
        class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
        ref="messagesContainer"
      >
        <div
          v-if="!selectedUser"
          class="flex items-center justify-center h-full"
        >
          <div class="text-center">
            <div
              class="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-gray-100 rounded-full flex items-center justify-center"
            >
              <el-icon class="text-6xl text-slate-400">
                <ChatDotRound />
              </el-icon>
            </div>
            <h3 class="text-xl font-semibold text-slate-700 mb-2">开始聊天</h3>
            <p class="text-slate-500">选择左侧的联系人开始对话</p>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="[
              'flex items-end space-x-3',
              message.senderId === socketStore.userId
                ? 'justify-end'
                : 'justify-start'
            ]"
          >
            <!-- 其他用户头像（左侧） -->
            <div
              v-if="message.senderId !== socketStore.userId"
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md flex-shrink-0',
                getUserAvatarColor(selectedUser.userName)
              ]"
            >
              {{ selectedUser.userName.charAt(0).toUpperCase() }}
            </div>

            <!-- 消息气泡 -->
            <div
              :class="[
                'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md',
                message.senderId === socketStore.userId
                  ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-br-md ml-auto'
                  : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
              ]"
            >
              <p class="text-sm leading-relaxed">{{ message.data }}</p>
              <div
                :class="[
                  'text-xs mt-2 opacity-70',
                  message.senderId === socketStore.userId
                    ? 'text-slate-200'
                    : 'text-slate-500'
                ]"
              >
                {{ formateTime(message.createTime) }}
              </div>
            </div>

            <!-- 当前用户头像（右侧） -->
            <div
              v-if="message.senderId === socketStore.userId"
              class="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white text-sm font-medium shadow-md flex-shrink-0"
            >
              {{ socketStore.name.charAt(0).toUpperCase() }}
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div v-if="selectedUser" class="p-6 bg-white/90 backdrop-blur-sm">
        <div class="flex items-end space-x-3">
          <!-- 附件按钮 -->
          <el-button circle class="message-action-btn" @click="fileClick">
            <el-icon><Plus /></el-icon>
          </el-button>

          <!-- 输入框 -->
          <div class="flex-1 relative">
            <el-input
              v-model="currentMessage"
              @keyup.enter="sendCurrentMessage"
              type="textarea"
              :rows="1"
              placeholder="输入消息..."
              class="message-input"
              resize="none"
              :autosize="{ minRows: 1, maxRows: 4 }"
            />
          </div>

          <!-- 文件按钮 -->
          <el-button
            @click="fileClick"
            type="default"
            class="file-button mr-2"
            title="发送文件"
          >
            <el-icon><Document /></el-icon>
          </el-button>

          <!-- 发送按钮 -->
          <el-button
            @click="sendCurrentMessage"
            :disabled="!currentMessage.trim()"
            type="primary"
            class="send-button"
            :class="{ 'animate-pulse': currentMessage.trim() }"
          >
            <el-icon class="mr-1"><Promotion /></el-icon>
            发送
          </el-button>

          <!-- 隐藏的文件输入 -->
          <input
            type="file"
            ref="fileInput"
            class="hidden"
            @change="handleFileChange"
          />
        </div>
      </div>
    </div>

    <!-- 来电弹窗 -->
    <IncomingCallDialog
      v-model="incomingCallVisible"
      :caller-name="incomingCallerName"
      :avatar-color="getUserAvatarColor(incomingCallerName)"
      @accept="accept"
      @reject="rejectCall"
    />

    <VideoDialog
      v-model="videoDialogVisible"
      ref="videoDialogRef"
      :peer-connection="pc"
      @hang-up="handleHangUp"
    />
    <!-- 接收文件进度对话框 -->
    <Progress
      v-model="fileDialogVisible"
      :progress="fileProgress"
      :file-info="receivedFileInfo"
      :peer-connection="pc"
    />

    <!-- 发送文件进度对话框 -->
    <Progress
      v-model="sendingFileDialogVisible"
      :progress="sendingProgress"
      :file-info="sendingFileInfo"
      :peer-connection="pc"
    />
  </div>
</template>

<script setup lang="ts">
import { useSocketStore, type CallbackPayload } from "@/store/modules/socket";
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watch
} from "vue";
import {
  useSocket,
  type AnswerPayload,
  type OfferPayload,
  type IceCandidatePayload,
  type CallControlPayload,
  type Message
} from "@/composables/useSocket";
import {
  ChatDotRound,
  Search,
  User as UserIcon,
  Phone,
  VideoCamera,
  More,
  Plus,
  Connection,
  Promotion,
  Document
} from "@element-plus/icons-vue";
import { formateTime, getUserAvatarColor } from "@/utils";
import VideoDialog from "./components/videoDialog.vue";
import IncomingCallDialog from "./components/IncomingCallDialog.vue";
import {
  addLocalStreamToPeerConnection,
  createAnswer,
  createChannel,
  createOffer,
  createPeerConnection,
  getLocalStream,
  testIceServersStatus,
  iceConfiguration
} from "@/utils/rtc";
import Progress from "./components/progress.vue";

// 为File System Access API添加类型声明
interface FileSystemWriteStream {
  write(data: ArrayBuffer | Blob | string): Promise<void>;
  close(): Promise<void>;
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWriteStream>;
}

declare global {
  interface Window {
    showSaveFilePicker(options?: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }): Promise<FileSystemFileHandle>;
  }
}

const messagesContainer = ref<HTMLElement>();
const socketStore = useSocketStore();
const currentMessage = ref<string>("");
const searchQuery = ref<string>("");
// WebRTC 事件处理函数
const handleAnswer = async (answer: AnswerPayload) => {
  console.log("收到 answer", answer);
  if (!pc) return;
  try {
    await pc.setRemoteDescription(new RTCSessionDescription(answer.answer));
    console.log("设置远程描述成功");

    // 处理缓存的ICE candidates
    await processPendingIceCandidates();

    callState.value = CallState.CONNECTED;
    callStartTime.value = new Date();
  } catch (error) {
    console.error("设置远程描述失败:", error);
    callState.value = CallState.ENDED;
  }
};

const handleOffer = async (offer: OfferPayload) => {
  console.log("收到 offer", offer);
  // 检查当前是否已经在通话中
  if (callState.value !== CallState.IDLE) {
    console.log("当前正在通话中，拒绝新的来电");
    sendCallControl("busy", offer.senderId);
    return;
  }
  initPc();
  // 保存来电信息
  incomingCallFrom.value = offer.senderId;
  incomingOffer.value = offer;
  callState.value = CallState.INCOMING;
  // 显示来电界面，等待用户选择接听或拒绝
  console.log("显示来电界面，等待用户操作");
};

// 处理缓存的ICE candidates
const processPendingIceCandidates = async () => {
  if (!pc || !pc.remoteDescription) return;

  console.log(`处理 ${pendingIceCandidates.length} 个缓存的 ICE candidates`);

  for (const candidate of pendingIceCandidates) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("添加缓存的 ICE candidate 成功");
    } catch (error) {
      console.error("添加缓存的 ICE candidate 失败:", error);
    }
  }

  // 清空缓存
  pendingIceCandidates.length = 0;
};

const handleIceCandidate = async (candidateData: IceCandidatePayload) => {
  console.log("收到 ICE candidate", candidateData);
  if (!pc) return;

  // 检查是否已经设置了远程描述
  if (pc.remoteDescription) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidateData.candidate));
      console.log("添加 ICE candidate 成功");
    } catch (error) {
      console.error("添加 ICE candidate 失败:", error);
    }
  } else {
    // 如果远程描述还没有设置，缓存ICE candidate
    console.log("远程描述尚未设置，缓存 ICE candidate");
    pendingIceCandidates.push(candidateData.candidate);
  }
};

const handleCallControl = (control: CallControlPayload) => {
  console.log("收到呼叫控制", control);

  switch (control.action) {
    case "accept":
      // 对方接听了
      if (callState.value === CallState.CALLING) {
        callState.value = CallState.RINGING;
        console.log("对方已接听，等待连接建立");
      }
      break;
    case "reject":
      // 对方拒绝了
      if (callState.value === CallState.CALLING) {
        callState.value = CallState.REJECTED;
        ElMessage.warning("对方拒绝了通话");
        setTimeout(() => {
          handleHangUp();
        }, 2000);
      }
      break;
    case "hangup":
      // 对方挂断了
      ElMessage.info("对方已挂断");
      handleHangUp();
      break;
  }
};
// 使用 socket hooks
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
  initSocket
} = useSocket({
  handleAnswer,
  handleOffer,
  handleIceCandidate,
  handleCallControl
});

onMounted(async () => {
  await initSocket();
});

// 组件卸载时清理资源
onUnmounted(() => {
  console.log("组件卸载，清理WebRTC资源");

  // 停止本地流
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  // 关闭PeerConnection
  destoryPc();
});

// 计算当前选中的用户
const selectedUser = computed(() => {
  return users.value.find(user => user.id === selectedUserId.value);
});

// 过滤用户列表
const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return users.value;
  }
  return users.value.filter(user =>
    user.userName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 来电弹窗显示控制
const incomingCallVisible = computed(() => {
  return callState.value === CallState.INCOMING;
});

// 来电用户名
const incomingCallerName = computed(() => {
  if (!incomingCallFrom.value) return "";
  const caller = users.value.find(user => user.id === incomingCallFrom.value);
  return caller?.userName || "未知用户";
});

// 发送当前消息
const sendCurrentMessage = () => {
  if (!currentMessage.value.trim() || !selectedUser.value) return;
  sendMessage(
    {
      type: "text",
      receiverId: selectedUser.value.id,
      data: currentMessage.value
    },
    (data: CallbackPayload<Message>) => {
      if (data.code === 0) {
        messages.value.push(data.payload!);
      }
    }
  );
  currentMessage.value = "";
};

const scrollToBottom = () => {
  nextTick(() => {
    messagesContainer.value?.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: "instant"
    });
  });
};

watch(
  () => messages.value,
  () => {
    scrollToBottom();
  },
  { deep: true }
);

// 通话状态常量
const CallState = {
  IDLE: "idle", // 空闲
  CALLING: "calling", // 呼叫中
  INCOMING: "incoming", // 来电
  RINGING: "ringing", // 响铃中（等待对方接听）
  CONNECTED: "connected", // 通话中
  REJECTED: "rejected", // 被拒绝
  ENDED: "ended" // 已结束
} as const;

type CallStateType = (typeof CallState)[keyof typeof CallState];

const videoDialogVisible = ref(false);
const videoDialogRef =
  useTemplateRef<InstanceType<typeof VideoDialog>>("videoDialogRef");
const callState = ref<CallStateType>(CallState.IDLE);
const callStartTime = ref<Date | null>(null);
const incomingCallFrom = ref<string>(""); // 来电用户ID
const incomingOffer = ref<OfferPayload | null>(null); // 来电offer
let localStream: MediaStream | null = null;
let pc: RTCPeerConnection | null = null;
const pendingIceCandidates: RTCIceCandidateInit[] = []; // 缓存待处理的ICE candidates

// 打印详细的连接信息到控制台
const logConnectionDetails = async () => {
  if (!pc) return;

  try {
    const stats = await pc.getStats();
    console.log("=== WebRTC 连接详细信息 ===");

    stats.forEach(report => {
      if (report.type === "candidate-pair" && report.state === "succeeded") {
        console.log("✅ 成功的候选者对:");
        console.log(`  - 状态: ${report.state}`);
        console.log(`  - 本地候选者ID: ${report.localCandidateId}`);
        console.log(`  - 远程候选者ID: ${report.remoteCandidateId}`);
        console.log(`  - 提名: ${report.nominated}`);
        console.log(`  - 可写: ${report.writable}`);

        // 查找候选者详情
        stats.forEach(candidateReport => {
          if (candidateReport.id === report.localCandidateId) {
            console.log(`  - 本地候选者类型: ${candidateReport.candidateType}`);
            console.log(`  - 本地协议: ${candidateReport.protocol}`);
            console.log(
              `  - 本地地址: ${candidateReport.address}:${candidateReport.port}`
            );
          }
          if (candidateReport.id === report.remoteCandidateId) {
            console.log(`  - 远程候选者类型: ${candidateReport.candidateType}`);
            console.log(`  - 远程协议: ${candidateReport.protocol}`);
            console.log(
              `  - 远程地址: ${candidateReport.address}:${candidateReport.port}`
            );
          }
        });

        // 判断连接类型
        let connectionType = "未知";
        stats.forEach(candidateReport => {
          if (
            candidateReport.id === report.localCandidateId ||
            candidateReport.id === report.remoteCandidateId
          ) {
            if (candidateReport.candidateType === "host") {
              connectionType =
                connectionType === "未知" ? "P2P 直连" : connectionType;
            } else if (candidateReport.candidateType === "srflx") {
              connectionType = "P2P NAT穿透 (STUN)";
            } else if (candidateReport.candidateType === "relay") {
              connectionType = "TURN 中继";
            }
          }
        });

        console.log(`  - 🔗 连接类型: ${connectionType}`);

        if (connectionType.includes("P2P")) {
          console.log("  - ✅ 使用P2P直连，无需中继服务器");
        } else if (connectionType.includes("TURN")) {
          console.log("  - ⚠️ 使用TURN中继服务器转发数据");
        }
      }
    });

    console.log("=== 完整统计信息 ===");
    console.log(stats);
    console.log("========================");
  } catch (error) {
    console.error("获取连接详情失败:", error);
  }
};

const initPc = () => {
  // 清空缓存的ICE candidates
  pendingIceCandidates.length = 0;
  if (pc) return;
  // 创建RTCPeerConnection
  pc = createPeerConnection();

  // 监听ICE候选者事件
  pc.onicecandidate = event => {
    if (event.candidate && selectedUser.value) {
      console.log("发送 ICE candidate", event.candidate);
      sendIceCandidate(event.candidate.toJSON(), selectedUser.value.id);
    }
  };

  // 监听远程流事件
  pc.ontrack = event => {
    console.log("收到远程流", event.streams[0]);
    console.log("远程流轨道数量:", event.streams[0].getTracks().length);
    console.log("远程流轨道详情:", event.streams[0].getTracks());

    if (videoDialogRef.value) {
      console.log("videoDialogRef 存在，调用 playRemoteStream");
      videoDialogRef.value.playRemoteStream(event.streams[0]);
    } else {
      console.error("videoDialogRef 不存在");
    }
  };

  // 监听连接状态变化
  pc.onconnectionstatechange = () => {
    console.log("连接状态:", pc?.connectionState);
    if (
      pc?.connectionState === "failed" ||
      pc?.connectionState === "disconnected"
    ) {
      console.error("WebRTC连接失败或断开");
      ElMessage.error("视频通话连接失败");
      handleHangUp();
    } else if (pc?.connectionState === "connected") {
      // 连接成功后，打印详细的连接信息
      setTimeout(async () => {
        await logConnectionDetails();
      }, 2000);
    }
  };

  // 监听ICE连接状态变化
  pc.oniceconnectionstatechange = () => {
    console.log("ICE连接状态:", pc?.iceConnectionState);
    if (pc?.iceConnectionState === "failed") {
      console.error("ICE连接失败");
      ElMessage.error("网络连接失败，请检查网络设置");
      handleHangUp();
    }
  };
};
const destoryPc = () => {
  if (pc) {
    pc.close();
    pc = null;
  }
};
// 获取流并播放
const getLocalStreamAndPlay = async (isVideo: boolean) => {
  try {
    const stream = await getLocalStream(true, isVideo);
    localStream = stream;
    videoDialogVisible.value = true;
    videoDialogRef.value?.playLoacalStream(localStream);
  } catch (error) {
    console.error("获取媒体流失败:", error);
    ElMessage.error("无法访问摄像头或麦克风，请检查设备权限");
    callState.value = CallState.ENDED;
    throw error;
  }
};
const callVideo = async (isVideo: boolean) => {
  try {
    callState.value = CallState.CALLING;
    initPc();
    // 1.获取本地流
    await getLocalStreamAndPlay(isVideo);
    addLocalStreamToPeerConnection(pc!, localStream!);
    //4.创建offer
    const offer = await createOffer(pc!);
    sendOffer(offer, selectedUser.value!.id, "call");
    console.log("发送 offer 成功，等待对方响应");
  } catch (error) {
    console.error("发起视频通话失败:", error);
    callState.value = CallState.ENDED;
    handleHangUp();
  }
};
const accept = () => {
  if (!incomingOffer.value) return;
  const { type } = incomingOffer.value;
  switch (type) {
    case "call":
      acceptCall();
      break;
    case "file":
      acceptFile();
      break;
  }
};
// 接收文件
const fileDialogVisible = ref(false);
const fileProgress = ref(0);
const receivedFileInfo = ref<{
  name: string;
  type: string;
  size: number;
} | null>(null);
const receivedFile = ref<Blob | null>(null);

const acceptFile = async () => {
  if (!pc || !incomingOffer.value) return;

  fileDialogVisible.value = true;
  const answer = await createAnswer(pc, incomingOffer.value.offer);
  sendAnswer(answer, incomingCallFrom.value);
  // 处理缓存的ICE candidates
  await processPendingIceCandidates();
  callState.value = CallState.CONNECTED;
  incomingOffer.value = null;
  incomingCallFrom.value = "";
  // 监听数据通道
  pc.ondatachannel = event => {
    const dataChannel = event.channel;
    let receivedSize = 0;
    let fileBuffer: ArrayBuffer[] = [];
    let lastProgressUpdate = Date.now();
    let fileWriter: FileSystemWriteStream | null = null;
    let tempFileHandle: FileSystemFileHandle | null = null;

    // 检查是否支持File System Access API
    const supportsFileSystem = "showSaveFilePicker" in window;

    dataChannel.onmessage = async event => {
      const data = event.data;

      // 如果是字符串，可能是文件信息或完成信号
      if (typeof data === "string") {
        try {
          const message = JSON.parse(data);

          if (message.type === "file-info") {
            // 接收到文件信息
            receivedFileInfo.value = message.data;
            console.log("接收文件信息:", receivedFileInfo.value);

            // 重置接收状态
            fileBuffer = [];
            receivedSize = 0;

            // 对于大文件（超过50MB），尝试使用File System Access API
            if (
              supportsFileSystem &&
              receivedFileInfo.value &&
              receivedFileInfo.value.size > 50 * 1024 * 1024
            ) {
              try {
                // 请求用户选择保存位置
                tempFileHandle = await window.showSaveFilePicker({
                  suggestedName: receivedFileInfo.value.name,
                  types: [
                    {
                      description: "文件",
                      accept: {
                        [receivedFileInfo.value.type ||
                        "application/octet-stream"]: [".file"]
                      }
                    }
                  ]
                });

                // 创建可写流
                const writable = await tempFileHandle.createWritable();
                fileWriter = writable;
                console.log("使用File System API接收大文件");
              } catch (error) {
                console.warn("无法使用File System API，回退到内存模式:", error);
                fileWriter = null;
                tempFileHandle = null;
              }
            }
          } else if (message.type === "file-complete") {
            // 文件接收完成处理
            console.log("开始处理接收完成的文件...");

            if (fileWriter) {
              // 使用File System API的情况
              try {
                await fileWriter.close();
                console.log("文件已保存到用户选择的位置");
                ElMessage.success("文件已保存");

                // 重置状态
                setTimeout(() => {
                  fileDialogVisible.value = false;
                  fileProgress.value = 0;
                  receivedFileInfo.value = null;
                  receivedFile.value = null;
                  fileWriter = null;
                  tempFileHandle = null;

                  // 关闭数据通道
                  if (dataChannel) {
                    dataChannel.close();
                  }

                  // 关闭并重置PeerConnection
                  destoryPc();
                }, 1000);
              } catch (error) {
                console.error("保存文件失败:", error);
                ElMessage.error("保存文件失败，请重试");
              }
            } else {
              // 使用内存模式的情况
              setTimeout(() => {
                try {
                  console.log(`合并 ${fileBuffer.length} 个文件分片...`);
                  const blob = new Blob(fileBuffer, {
                    type:
                      receivedFileInfo.value?.type || "application/octet-stream"
                  });
                  receivedFile.value = blob;

                  // 创建下载链接
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download =
                    receivedFileInfo.value?.name || "downloaded_file";
                  a.click();
                  URL.revokeObjectURL(url);

                  // 重置状态
                  setTimeout(() => {
                    fileDialogVisible.value = false;
                    fileProgress.value = 0;
                    receivedFileInfo.value = null;
                    receivedFile.value = null;
                    fileWriter = null;
                    tempFileHandle = null;

                    // 关闭数据通道
                    if (dataChannel) {
                      dataChannel.close();
                    }

                    // 关闭并重置PeerConnection
                    destoryPc();
                  }, 1000);
                } catch (error) {
                  console.error("合并文件分片失败:", error);
                  ElMessage.error("文件处理失败，请重试");
                }
              }, 100);
            }
          }
        } catch (error) {
          console.error("解析消息失败:", error);
        }
      } else if (data instanceof ArrayBuffer) {
        // 接收文件数据分片
        if (fileWriter) {
          // 使用File System API直接写入文件
          try {
            await fileWriter.write(data);
            receivedSize += data.byteLength;
          } catch (error) {
            console.error("写入文件失败:", error);
            ElMessage.error("文件写入失败");
          }
        } else {
          // 使用内存模式
          fileBuffer.push(data);
          receivedSize += data.byteLength;
        }

        // 更新进度 - 限制更新频率
        if (receivedFileInfo.value) {
          const now = Date.now();
          const newProgress = Math.min(
            100,
            Math.floor((receivedSize / receivedFileInfo.value.size) * 100)
          );

          // 只有进度变化或距离上次更新超过500ms才更新UI
          if (
            newProgress !== fileProgress.value ||
            now - lastProgressUpdate > 500
          ) {
            fileProgress.value = newProgress;
            lastProgressUpdate = now;

            // 减少日志输出频率，避免控制台阻塞
            if (fileProgress.value % 5 === 0 || fileProgress.value === 100) {
              console.log(`文件接收进度: ${fileProgress.value}%`);
            }
          }
        }
      }
    };

    dataChannel.onopen = () => {
      console.log("数据通道已打开，准备接收文件");
    };

    dataChannel.onerror = error => {
      console.error("数据通道错误:", error);
      ElMessage.error("文件传输错误");
    };
    dataChannel.onclose = () => {
      console.log("数据通道已关闭");
      callState.value = CallState.IDLE;
      handleHangUp();
    };
  };
};
// 接听通话
const acceptCall = async () => {
  try {
    // 先打开视频对话框
    videoDialogVisible.value = true;
    // 发送接听信号
    sendCallControl("accept", incomingCallFrom.value);

    // 获取本地流并显示（但不重复打开对话框）
    const stream = await getLocalStream(true, true);
    localStream = stream;

    // 等待下一个tick确保videoDialogRef已经可用
    await nextTick();
    videoDialogRef.value?.playLoacalStream(localStream);
    addLocalStreamToPeerConnection(pc!, localStream!);
    // 创建 answer
    const answer = await createAnswer(pc!, incomingOffer.value!.offer);
    sendAnswer(answer, incomingCallFrom.value);
    console.log("发送 answer 成功");

    // 处理缓存的ICE candidates
    await processPendingIceCandidates();

    callState.value = CallState.CONNECTED;
    callStartTime.value = new Date();

    // 清除来电信息
    incomingOffer.value = null;
    incomingCallFrom.value = "";
  } catch (error) {
    console.error("接听通话失败:", error);
    callState.value = CallState.ENDED;
    handleHangUp();
  }
};

// 拒绝通话
const rejectCall = () => {
  console.log("拒绝通话");

  if (incomingCallFrom.value) {
    sendCallControl("reject", incomingCallFrom.value);
  }

  // 清除来电信息
  incomingOffer.value = null;
  incomingCallFrom.value = "";
  callState.value = CallState.IDLE;
};

// 挂断通话
const handleHangUp = () => {
  console.log("挂断通话");

  // 如果正在通话中，发送挂断信号
  if (
    callState.value === CallState.CONNECTED ||
    callState.value === CallState.CALLING
  ) {
    const targetUserId = incomingCallFrom.value || selectedUser.value?.id;
    if (targetUserId) {
      sendCallControl("hangup", targetUserId);
    }
  }

  callState.value = CallState.ENDED;
  callStartTime.value = null;

  // 停止本地流
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  // 关闭PeerConnection
  destoryPc();
  videoDialogVisible.value = false;

  // 清除来电信息
  incomingOffer.value = null;
  incomingCallFrom.value = "";

  // 重置状态为空闲
  callState.value = CallState.IDLE;
};

// 处理文件上传
let file: File | null = null;
const fileInputRef = useTemplateRef<HTMLInputElement>("fileInput");
const fileClick = () => {
  fileInputRef.value?.click();
};
const handleFileChange = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) {
    file = f;
    sendFile();
  }
};

let channel: RTCDataChannel | null = null;
const sendingFileInfo = ref<{
  name: string;
  type: string;
  size: number;
} | null>(null);
const sendingProgress = ref(0);
const sendingFileDialogVisible = ref(false);

const sendFile = async () => {
  if (!file) return;

  // 设置发送文件信息
  sendingFileInfo.value = {
    name: file.name,
    type: file.type,
    size: file.size
  };
  sendingProgress.value = 0;
  sendingFileDialogVisible.value = true;
  initPc();
  channel = createChannel(pc!, "file");
  if (channel) {
    channel.onopen = () => {
      console.log("DataChannel 已建立，可以传输文件");
      // 发送文件信息
      if (channel && channel.readyState === "open") {
        channel.send(
          JSON.stringify({ type: "file-info", data: sendingFileInfo.value })
        );

        // 开始传输文件数据
        const chunkSize = 64 * 1024; // 增加到64KB分片大小，提高传输效率
        let offset = 0;
        const fileReader = new FileReader();
        // 添加缓冲区监控
        const bufferThreshold = 1024 * 1024; // 1MB缓冲区阈值
        let sendingPaused = false;
        let pendingChunk: ArrayBuffer | null = null;
        let lastProgressUpdate = Date.now();

        // 监控DataChannel缓冲区状态
        if (channel) {
          channel.bufferedAmountLowThreshold = bufferThreshold / 2; // 设置为阈值的一半，提前恢复传输

          channel.onbufferedamountlow = () => {
            if (sendingPaused && pendingChunk) {
              console.log("缓冲区已降至阈值以下，继续发送");
              sendingPaused = false;
              // 发送暂停的分片
              channel!.send(pendingChunk);
              pendingChunk = null;
              // 继续读取下一个分片
              if (offset < file!.size) {
                setTimeout(() => readSlice(offset), 10); // 添加小延迟避免立即填满缓冲区
              }
            }
          };
        }

        fileReader.onload = e => {
          if (e.target?.result && channel?.readyState === "open") {
            if (typeof e.target.result === "string") {
              console.error("文件读取结果类型错误");
              return;
            }

            // 检查缓冲区状态
            if (channel?.bufferedAmount > bufferThreshold) {
              console.log("缓冲区已满，暂停发送");
              sendingPaused = true;
              pendingChunk = e.target.result;
              return;
            }

            try {
              channel.send(e.target.result);
              offset += e.target.result.byteLength;

              // 更新进度 - 限制更新频率，减少UI压力
              if (file) {
                const now = Date.now();
                const newProgress = Math.min(
                  100,
                  Math.floor((offset / file.size) * 100)
                );

                // 只有进度变化超过1%或距离上次更新超过500ms才更新UI
                if (
                  newProgress !== sendingProgress.value ||
                  now - lastProgressUpdate > 500
                ) {
                  sendingProgress.value = newProgress;
                  lastProgressUpdate = now;

                  // 减少日志输出频率
                  if (newProgress % 5 === 0 || newProgress === 100) {
                    console.log(`文件传输进度: ${newProgress}%`);
                  }
                }

                // 继续读取下一个分片
                if (offset < file.size) {
                  // 根据缓冲区状态动态调整延迟
                  const delay =
                    channel?.bufferedAmount > bufferThreshold / 2 ? 50 : 5;
                  setTimeout(() => {
                    readSlice(offset);
                  }, delay);
                } else {
                  console.log("文件传输完成");
                  if (channel) {
                    channel.send(JSON.stringify({ type: "file-complete" }));
                  }

                  // 传输完成后关闭对话框并清理资源
                  setTimeout(() => {
                    sendingFileDialogVisible.value = false;
                    sendingProgress.value = 0;
                    sendingFileInfo.value = null;
                    file = null;
                    callState.value = CallState.IDLE;
                    // 关闭数据通道
                    if (channel) {
                      channel.close();
                      channel = null;
                    }
                    // 关闭并重置PeerConnection
                    destoryPc();
                  }, 1000);
                }
              }
            } catch (error) {
              console.error("发送文件分片失败:", error);
              // 尝试重新发送当前分片
              setTimeout(() => {
                if (channel?.readyState === "open") {
                  console.log("尝试重新发送分片");
                  readSlice(offset);
                } else {
                  ElMessage.error("文件传输连接已断开");
                }
              }, 1000);
            }
          }
        };

        fileReader.onerror = error => {
          console.error("文件读取错误:", error);
          ElMessage.error("文件读取错误");
          sendingFileDialogVisible.value = false;
        };

        const readSlice = (o: number) => {
          if (file) {
            const slice = file.slice(o, o + chunkSize);
            fileReader.readAsArrayBuffer(slice);
          }
        };

        // 开始读取第一个分片
        readSlice(0);
      }
    };

    channel.onerror = error => {
      console.error("数据通道错误:", error);
      ElMessage.error("文件传输错误");
      sendingFileDialogVisible.value = false;
    };
  }

  // 1. 创建offer
  const offer = await createOffer(pc!);
  // 2. 发送offer
  if (selectedUser.value) {
    sendOffer(offer, selectedUser.value.id, "file");
  }
};

// 测试ICE服务器状态
const testIceServers = async () => {
  try {
    ElMessage.info("正在测试ICE服务器状态...");
    const status = await testIceServersStatus(iceConfiguration.iceServers);
    console.log("STUN 可用:", status.stun);
    console.log("TURN 可用:", status.turn);
    console.log("候选地址列表:");
    status.candidates.forEach(c => console.log(c.type, c.candidate));

    // 构建表格HTML
    const stunStatus = status.stun
      ? "<span style='color: #67C23A'>✅ 可用</span>"
      : "<span style='color: #F56C6C'>❌ 不可用</span>";
    const turnStatus = status.turn
      ? "<span style='color: #67C23A'>✅ 可用</span>"
      : "<span style='color: #F56C6C'>❌ 不可用</span>";

    // 统计候选地址类型
    const candidateStats = status.candidates.reduce(
      (acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    let candidateRows = "";
    Object.entries(candidateStats).forEach(([type, count]) => {
      const typeDesc =
        {
          host: "本地地址",
          srflx: "STUN反射地址",
          relay: "TURN中继地址",
          prflx: "对等反射地址"
        }[type] || type;
      candidateRows += `
        <tr>
          <td style='padding: 8px; border: 1px solid #ddd;'>${typeDesc}</td>
          <td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>${count}</td>
        </tr>
      `;
    });

    const tableHTML = `
      <div style='font-family: Arial, sans-serif;'>
        <h3 style='margin-bottom: 15px; color: #303133;'>ICE服务器测试结果</h3>
        <table style='width: 100%; border-collapse: collapse; margin-bottom: 15px;'>
          <thead>
            <tr style='background-color: #f5f7fa;'>
              <th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>服务类型</th>
              <th style='padding: 10px; border: 1px solid #ddd; text-align: center;'>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style='padding: 10px; border: 1px solid #ddd;'>STUN服务器</td>
              <td style='padding: 10px; border: 1px solid #ddd; text-align: center;'>${stunStatus}</td>
            </tr>
            <tr>
              <td style='padding: 10px; border: 1px solid #ddd;'>TURN服务器</td>
              <td style='padding: 10px; border: 1px solid #ddd; text-align: center;'>${turnStatus}</td>
            </tr>
          </tbody>
        </table>
        
        <h4 style='margin: 15px 0 10px 0; color: #303133;'>候选地址统计</h4>
        <table style='width: 100%; border-collapse: collapse;'>
          <thead>
            <tr style='background-color: #f5f7fa;'>
              <th style='padding: 8px; border: 1px solid #ddd; text-align: left;'>地址类型</th>
              <th style='padding: 8px; border: 1px solid #ddd; text-align: center;'>数量</th>
            </tr>
          </thead>
          <tbody>
            ${candidateRows}
          </tbody>
        </table>
        
        <p style='margin-top: 15px; font-size: 12px; color: #909399;'>
          总计: ${status.candidates.length} 个候选地址<br>
          详细信息请查看浏览器控制台
        </p>
      </div>
    `;

    // 使用MessageBox显示表格
    ElMessageBox.alert(tableHTML, "测试结果", {
      dangerouslyUseHTMLString: true,
      customClass: "ice-test-result-dialog",
      confirmButtonText: "确定"
    });
  } catch (error) {
    console.error("测试ICE服务器失败:", error);
    ElMessage.error("测试ICE服务器失败，请查看控制台获取详细信息");
  }
};
</script>

<style lang="scss" scoped>
// ICE测试结果对话框样式
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

// 自定义滚动条
.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    border-radius: 3px;

    &:hover {
      background: linear-gradient(135deg, #475569 0%, #334155 100%);
    }
  }
}

// 搜索输入框样式
:deep(.search-input) {
  .el-input__wrapper {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &.is-focus {
      box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.3);
    }
  }
}

// 聊天操作按钮
.chat-action-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(100, 116, 139, 0.1);
    border-color: rgba(100, 116, 139, 0.3);
    transform: translateY(-1px);
  }
}

// 消息输入框样式
:deep(.message-input) {
  .el-textarea__inner {
    border-radius: 16px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1.5;

    &:focus {
      border-color: #64748b;
      box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.1);
      background: rgba(255, 255, 255, 1);
    }

    &::placeholder {
      color: rgba(0, 0, 0, 0.4);
    }
  }
}

// 消息操作按钮
.message-action-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(100, 116, 139, 0.1);
    border-color: rgba(100, 116, 139, 0.3);
    transform: translateY(-2px);
  }
}

// 发送按钮
.send-button {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #475569 0%, #334155 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(100, 116, 139, 0.4);
  }

  &:disabled {
    background: rgba(0, 0, 0, 0.1);
    box-shadow: none;
    transform: none;
  }
}

// 消息气泡动画
.message-bubble-enter-active {
  transition: all 0.3s ease;
}

.message-bubble-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

// 用户列表项悬停效果
.user-item {
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
  }

  .user-list {
    width: 100%;
    height: 40%;
  }

  .chat-area {
    height: 60%;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .custom-scrollbar {
    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
