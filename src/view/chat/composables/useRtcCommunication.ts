import { computed, nextTick, onUnmounted, ref, useTemplateRef } from "vue";
import type {
  AnswerPayload,
  CallControlPayload,
  IceCandidatePayload,
  OfferPayload,
  User
} from "@/composables/useSocket";
import {
  addLocalStreamToPeerConnection,
  createAnswer,
  createChannel,
  createOffer,
  createPeerConnection,
  getLocalStream,
  logConnectionDetails
} from "@/utils/rtc";
import { downloadFile, receiveFile, sendFileInChunks } from "@/utils/file";
import type VideoDialog from "../components/videoDialog.vue";
import type { Ref } from "vue";

export const CallState = {
  IDLE: "idle",
  CALLING: "calling",
  INCOMING: "incoming",
  RINGING: "ringing",
  CONNECTED: "connected",
  REJECTED: "rejected",
  ENDED: "ended"
} as const;

export type CallStateType = (typeof CallState)[keyof typeof CallState];

interface UseRtcCommunicationOptions {
  selectedUser: Ref<User | undefined>;
  users: Ref<User[]>;
  sendOffer: (
    offer: RTCSessionDescriptionInit,
    receiverId: string,
    type: "call" | "file"
  ) => void;
  sendAnswer: (answer: RTCSessionDescriptionInit, receiverId: string) => void;
  sendIceCandidate: (
    candidate: RTCIceCandidateInit,
    receiverId: string
  ) => void;
  sendCallControl: (
    action: "accept" | "reject" | "hangup" | "busy",
    receiverId: string
  ) => void;
}

export function useRtcCommunication({
  selectedUser,
  users,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
  sendCallControl
}: UseRtcCommunicationOptions) {
  const videoDialogVisible = ref(false);
  const videoDialogRef =
    useTemplateRef<InstanceType<typeof VideoDialog>>("videoDialogRef");
  const callState = ref<CallStateType>(CallState.IDLE);
  const incomingCallFrom = ref("");
  const incomingOffer = ref<OfferPayload | null>(null);
  const currentCallUserId = ref<string | null>(null);

  const fileDialogVisible = ref(false);
  const fileProgress = ref(0);
  const receivedFileInfo = ref<{
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const receivedFile = ref<Blob | null>(null);

  const sendingFileDialogVisible = ref(false);
  const sendingProgress = ref(0);
  const sendingFileInfo = ref<{
    name: string;
    type: string;
    size: number;
  } | null>(null);

  let localStream: MediaStream | null = null;
  const pc = ref<RTCPeerConnection | null>(null);
  let channel: RTCDataChannel | null = null;
  const pendingIceCandidates: RTCIceCandidateInit[] = [];

  const peerConnection = pc;

  const incomingCallVisible = computed(
    () => callState.value === CallState.INCOMING
  );

  const incomingCallerName = computed(() => {
    if (!incomingCallFrom.value) return "";
    const caller = users.value.find(user => user.id === incomingCallFrom.value);
    return caller?.userName || "未知用户";
  });

  const incomingOfferType = computed(() => incomingOffer.value?.type ?? "call");

  const resetPendingIceCandidates = () => {
    pendingIceCandidates.length = 0;
  };

  const destoryPc = () => {
    if (pc.value) {
      pc.value.close();
      pc.value = null;
    }
  };

  // 清理本地媒体流
  const cleanupLocalStream = () => {
    if (!localStream) return;
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  };

  const initPc = () => {
    resetPendingIceCandidates();
    if (pc.value) return;
    pc.value = createPeerConnection();
    pc.value.onicecandidate = event => {
      if (!event.candidate || !selectedUser.value) return;
      sendIceCandidate(event.candidate.toJSON(), selectedUser.value.id);
    };

    pc.value.ontrack = event => {
      if (!event.streams?.[0]) return;
      const stream = event.streams[0];
      if (videoDialogRef.value) {
        videoDialogRef.value.playRemoteStream(stream);
      }
    };

    // 处理连接状态变化
    pc.value.onconnectionstatechange = () => {
      if (pc.value?.connectionState === "connected") {
        logConnectionDetails(pc.value);
      }
      // 处理连接失败或断开连接
      if (
        pc.value?.connectionState === "failed" ||
        pc.value?.connectionState === "disconnected"
      ) {
        ElMessage.error("视频通话连接失败");
        handleHangUp();
      }
    };
    // 处理ICE连接状态变化
    pc.value.oniceconnectionstatechange = () => {
      if (pc.value?.iceConnectionState === "failed") {
        ElMessage.error("网络连接失败，请检查网络设置");
        handleHangUp();
      }
    };
  };

  const processPendingIceCandidates = async () => {
    if (!pc.value || !pc.value.remoteDescription) return;

    for (const candidate of pendingIceCandidates) {
      try {
        await pc.value.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("添加缓存的 ICE candidate 失败:", error);
      }
    }

    resetPendingIceCandidates();
  };

  /**
   * 第四步 发起方处理接收到的 answer
   * 1. 如果当前通话状态不为空闲，则发送忙音
   * 2. 初始化 peer connection
   * 3. 设置当前通话用户 ID
   * 4. 设置当前通话状态为已接听
   */
  const handleAnswer = async (answer: AnswerPayload) => {
    if (!pc.value) return;
    try {
      // 设置远程描述
      await pc.value.setRemoteDescription(
        new RTCSessionDescription(answer.answer)
      );
      // 处理缓存的 ICE candidate
      await processPendingIceCandidates();
      callState.value = CallState.CONNECTED;
    } catch (error) {
      console.error("设置远程描述失败:", error);
      callState.value = CallState.ENDED;
    }
  };

  /**
   * 第二步 处理接收到的 offer
   * 1. 如果当前通话状态不为空闲，则发送忙音
   * 2. 初始化 peer connection
   * 3. 设置当前通话用户 ID
   * 4. 设置当前通话状态为来电中
   */
  const handleOffer = async (offer: OfferPayload) => {
    if (callState.value !== CallState.IDLE) {
      sendCallControl("busy", offer.senderId);
      return;
    }
    initPc();
    incomingCallFrom.value = offer.senderId;
    incomingOffer.value = offer;
    currentCallUserId.value = offer.senderId;
    callState.value = CallState.INCOMING;
  };

  /**
   *
   * 第五步 发起方和接收方处理接收到的 ICE candidate
   * 1. 如果当前通话状态不为空闲，则发送忙音
   * 2. 添加 ICE candidate 到 peer connection
   */
  const handleIceCandidate = async (candidateData: IceCandidatePayload) => {
    if (!pc.value) return;
    if (pc.value.remoteDescription) {
      try {
        // 添加 ICE candidate 到 peer connection
        await pc.value.addIceCandidate(
          new RTCIceCandidate(candidateData.candidate)
        );
      } catch (error) {
        console.error("添加 ICE candidate 失败:", error);
      }
      return;
    }
    /**
     * 如果远程描述不存在，则缓存 ICE candidate
     * 因为本地一旦 createOffer 并 setLocalDescription 后，ICE agent 就开始出候选并通过信令渠道发走。
     */
    pendingIceCandidates.push(candidateData.candidate);
  };

  // 处理通话控制
  const handleCallControl = (control: CallControlPayload) => {
    switch (control.action) {
      case "accept":
        if (callState.value === CallState.CALLING) {
          callState.value = CallState.RINGING;
        }
        break;
      case "reject":
        if (callState.value === CallState.CALLING) {
          callState.value = CallState.REJECTED;
          ElMessage.warning("对方拒绝了通话");
          setTimeout(() => {
            handleHangUp({ silent: true });
          }, 2000);
        }
        break;
      case "hangup":
        ElMessage.info("对方已挂断");
        handleHangUp({ silent: true });
        break;
    }
  };

  // 获取本地媒体流并播放
  const getLocalStreamAndPlay = async (isVideo: boolean) => {
    try {
      const stream = await getLocalStream(true, isVideo);
      localStream = stream;
      videoDialogVisible.value = true;
      await nextTick();
      videoDialogRef.value?.playLoacalStream(stream);
    } catch (error) {
      console.error("获取媒体流失败:", error);
      ElMessage.error("无法访问摄像头或麦克风，请检查设备权限");
      callState.value = CallState.ENDED;
      throw error;
    }
  };

  /**
   * 第一步 发起视频通话
   * 1. 设置通话状态为呼叫中
   * 2. 初始化 peer connection
   * 3. 获取本地媒体流并播放
   * 4. 添加本地媒体流到 peer connection
   * 5. 创建 offer 并发送
   * 6. 发送 offer
   * 7. 设置当前通话用户 ID
   */
  const callVideo = async (isVideo: boolean) => {
    if (!selectedUser.value) return;
    try {
      // 设置通话状态为呼叫中
      callState.value = CallState.CALLING;
      // 初始化 peer connection
      initPc();
      // 获取本地媒体流并播放
      await getLocalStreamAndPlay(isVideo);
      // 添加本地媒体流到 peer connection
      addLocalStreamToPeerConnection(pc.value!, localStream!);
      // 创建 offer 并发送
      const offer = await createOffer(pc.value!);
      // 发送 offer
      sendOffer(offer, selectedUser.value.id, "call");
      currentCallUserId.value = selectedUser.value.id;
    } catch (error) {
      console.error("发起视频通话失败:", error);
      callState.value = CallState.ENDED;
      handleHangUp();
    }
  };

  // 接收文件
  const acceptFile = async () => {
    if (!pc.value || !incomingOffer.value) return;

    fileDialogVisible.value = true;
    const answer = await createAnswer(pc.value, incomingOffer.value.offer);
    sendAnswer(answer, incomingCallFrom.value);
    await processPendingIceCandidates();
    callState.value = CallState.CONNECTED;
    incomingOffer.value = null;
    currentCallUserId.value = incomingCallFrom.value || currentCallUserId.value;
    incomingCallFrom.value = "";

    pc.value.ondatachannel = event => {
      const dataChannel = event.channel;

      receiveFile(
        dataChannel,
        fileInfo => {
          receivedFileInfo.value = fileInfo;
        },
        progress => {
          fileProgress.value = progress;
        },
        blob => {
          receivedFile.value = blob;
          if (receivedFile.value.size > 0) {
            downloadFile(
              blob,
              receivedFileInfo.value?.name || "downloaded_file"
            );
            ElMessage.success("文件已下载");
          } else {
            ElMessage.success("文件已保存到用户选择的位置");
          }

          setTimeout(() => {
            fileDialogVisible.value = false;
            fileProgress.value = 0;
            receivedFileInfo.value = null;
            receivedFile.value = null;
            dataChannel.close();
            destoryPc();
            callState.value = CallState.IDLE;
          }, 1000);
        }
      );

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
        handleHangUp({ silent: true });
      };
    };
  };

  /**
   * 第三步 接听通话
   * 1. 如果当前通话状态不为空闲，则发送忙音
   * 2. 初始化 peer connection
   * 3. 获取本地媒体流并播放
   * 4. 添加本地媒体流到 peer connection
   * 5. 创建 answer 并发送
   * 6. 发送 answer
   * 7. 设置当前通话用户 ID
   * 8. 设置当前通话状态为已接听
   */
  const acceptCall = async () => {
    if (!incomingOffer.value) return;
    try {
      videoDialogVisible.value = true;
      sendCallControl("accept", incomingCallFrom.value);
      // 获取本地媒体流并播放
      const stream = await getLocalStream(true, true);
      localStream = stream;
      await nextTick();
      videoDialogRef.value?.playLoacalStream(stream);
      // 添加本地媒体流到 peer connection
      addLocalStreamToPeerConnection(pc.value!, localStream!);
      // 创建 answer 并发送
      const answer = await createAnswer(pc.value!, incomingOffer.value.offer);
      // 发送 answer
      sendAnswer(answer, incomingCallFrom.value);

      await processPendingIceCandidates();
      // 设置当前通话状态为已接听
      callState.value = CallState.CONNECTED;
      // 清空 incomingOffer
      incomingOffer.value = null;
      // 设置当前通话用户 ID
      currentCallUserId.value =
        incomingCallFrom.value || currentCallUserId.value;
      // 清空 incomingCallFrom
      incomingCallFrom.value = "";
    } catch (error) {
      console.error("接听通话失败:", error);
      callState.value = CallState.ENDED;
      handleHangUp();
    }
  };

  const accept = () => {
    if (!incomingOffer.value) return;
    switch (incomingOffer.value.type) {
      case "call":
        acceptCall();
        break;
      case "file":
        acceptFile();
        break;
    }
  };

  const rejectCall = () => {
    if (incomingCallFrom.value) {
      sendCallControl("reject", incomingCallFrom.value);
    }
    incomingOffer.value = null;
    incomingCallFrom.value = "";
    callState.value = CallState.IDLE;
    currentCallUserId.value = null;
  };

  const notifyHangUp = () => {
    const targetUserId =
      incomingCallFrom.value ||
      currentCallUserId.value ||
      selectedUser.value?.id;
    if (targetUserId) {
      sendCallControl("hangup", targetUserId);
    }
  };

  const handleHangUp = ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      notifyHangUp();
    }

    callState.value = CallState.ENDED;

    cleanupLocalStream();
    destoryPc();
    videoDialogVisible.value = false;
    incomingOffer.value = null;
    incomingCallFrom.value = "";
    callState.value = CallState.IDLE;
    currentCallUserId.value = null;
  };

  // 发送文件
  const sendFile = async (file: File) => {
    if (!selectedUser.value) return;

    sendingFileInfo.value = {
      name: file.name,
      type: file.type,
      size: file.size
    };
    sendingProgress.value = 0;
    sendingFileDialogVisible.value = true;

    initPc();
    channel = createChannel(pc.value!, "file");
    currentCallUserId.value = selectedUser.value.id;

    if (channel) {
      channel.onopen = async () => {
        try {
          await sendFileInChunks(file, channel!, progress => {
            sendingProgress.value = progress;
          });

          setTimeout(() => {
            sendingFileDialogVisible.value = false;
            sendingProgress.value = 0;
            sendingFileInfo.value = null;
            channel?.close();
            channel = null;
            destoryPc();
            callState.value = CallState.IDLE;
          }, 1000);
        } catch (error) {
          console.error("发送文件失败:", error);
          ElMessage.error("文件传输失败");
          sendingFileDialogVisible.value = false;
          sendingProgress.value = 0;
          sendingFileInfo.value = null;
        }
      };

      channel.onerror = error => {
        console.error("数据通道错误:", error);
        ElMessage.error("文件传输错误");
        sendingFileDialogVisible.value = false;
        sendingProgress.value = 0;
        sendingFileInfo.value = null;
      };
    }

    const offer = await createOffer(pc.value!);
    sendOffer(offer, selectedUser.value.id, "file");
  };

  onUnmounted(() => {
    cleanupLocalStream();
    destoryPc();
  });

  return {
    videoDialogVisible,
    videoDialogRef,
    callState,
    incomingCallVisible,
    incomingCallerName,
    incomingOfferType,
    peerConnection,
    handleAnswer,
    handleOffer,
    handleIceCandidate,
    handleCallControl,
    callVideo,
    accept,
    acceptCall,
    rejectCall,
    handleHangUp,
    sendFile,
    fileDialogVisible,
    fileProgress,
    receivedFileInfo,
    sendingFileDialogVisible,
    sendingProgress,
    sendingFileInfo
  };
}
