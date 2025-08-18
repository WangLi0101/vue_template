import { ref, onUnmounted } from "vue";
import { useSocketStore, type CallbackPayload } from "@/store/modules/socket";

// Socket 相关类型定义
export interface User {
  id: string;
  userName: string;
  isOnline: boolean;
  isSelf: boolean;
  isNewMessage: boolean;
}

export interface Message {
  id: string;
  type: string;
  senderId: string;
  receiverId: string;
  data: string;
  createTime: string;
}

export interface Event {
  type: string;
  payload: any;
}

export interface SendMessage {
  type: string;
  receiverId: string;
  data: string;
}

export interface AnswerPayload {
  answer: RTCSessionDescriptionInit;
  senderId: string;
}

export interface OfferPayload {
  offer: RTCSessionDescriptionInit;
  senderId: string;
}

export interface IceCandidatePayload {
  candidate: RTCIceCandidateInit;
  senderId: string;
}

export interface CallControlPayload {
  action: "accept" | "reject" | "hangup" | "busy";
  senderId: string;
}

interface UseSocketOptions {
  handleAnswer: (answer: AnswerPayload) => void;
  handleOffer: (offer: OfferPayload) => void;
  handleIceCandidate: (candidate: IceCandidatePayload) => void;
  handleCallControl: (control: CallControlPayload) => void;
}

export function useSocket({
  handleAnswer,
  handleOffer,
  handleIceCandidate,
  handleCallControl
}: UseSocketOptions) {
  const socketStore = useSocketStore();
  const { getSocket } = socketStore;

  // 本地状态管理
  const users = ref<User[]>([]);
  const messages = ref<Message[]>([]);
  const selectedUserId = ref<string>("");

  // Socket 通信方法
  const getUsers = () => {
    const socket = getSocket();
    socket?.emit("message", {
      type: "getUsers"
    });
  };

  const getMessages = (receiverId: string) => {
    const socket = getSocket();
    socket?.emit("message", {
      type: "getMessages",
      payload: receiverId
    });
  };

  const sendMessage = (
    message: SendMessage,
    callback?: (data: CallbackPayload<Message>) => void
  ) => {
    const socket = getSocket();
    socket?.emit(
      "message",
      {
        type: "chat",
        payload: message
      },
      callback
    );
  };

  const sendOffer = (offer: RTCSessionDescriptionInit, receiverId: string) => {
    const socket = getSocket();
    socket?.emit("message", {
      type: "offer",
      payload: {
        receiverId,
        offer
      }
    });
  };

  const sendAnswer = (
    answer: RTCSessionDescriptionInit,
    receiverId: string
  ) => {
    const socket = getSocket();
    socket?.emit("message", {
      type: "answer",
      payload: {
        receiverId,
        answer
      }
    });
  };

  const sendIceCandidate = (
    candidate: RTCIceCandidateInit,
    receiverId: string
  ) => {
    const socket = getSocket();
    socket?.emit("message", {
      type: "ice-candidate",
      payload: {
        receiverId,
        candidate
      }
    });
  };

  const sendCallControl = (
    action: "accept" | "reject" | "hangup" | "busy",
    receiverId: string
  ) => {
    const socket = getSocket();
    socket?.emit("message", {
      type: "call-control",
      payload: {
        receiverId,
        action
      }
    });
  };

  // 事件处理函数
  const handleGetUsers = (data: User[]) => {
    users.value = data
      .map(user => ({
        ...user,
        isSelf: user.id === socketStore.userId
      }))
      .sort((a, b) => {
        // 首先按 isSelf 排序（自己排在前面）
        if (a.isSelf !== b.isSelf) {
          return a.isSelf ? -1 : 1;
        }
        // 然后按 isOnline 排序（在线用户排在前面）
        if (a.isOnline !== b.isOnline) {
          return a.isOnline ? -1 : 1;
        }
        return 0;
      });
  };

  const handleGetMessages = (data: Message[]) => {
    messages.value = data;
  };

  const handleChat = (data: Message) => {
    const findUser = users.value.find(user => user.id === data.senderId);
    if (findUser) {
      findUser.isNewMessage = true;
    }
    if (selectedUserId.value === data.senderId) {
      messages.value.push(data);
    }
  };

  // 事件监听器
  const handlerEvent = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.on("message", (data: Event) => {
      const { type, payload } = data;
      switch (type) {
        case "getUsers":
          handleGetUsers(payload as User[]);
          break;
        case "getMessages":
          handleGetMessages(payload as Message[]);
          break;
        case "chat":
          handleChat(payload as Message);
          break;
        case "offer":
          handleOffer(payload as OfferPayload);
          break;
        case "answer":
          handleAnswer(payload as AnswerPayload);
          break;
        case "ice-candidate":
          handleIceCandidate(payload as IceCandidatePayload);
          break;
        case "call-control":
          handleCallControl(payload as CallControlPayload);
          break;
      }
    });
  };

  // 选择用户函数
  const selectUser = (userId: string) => {
    selectedUserId.value = userId;
    // 清除该用户的新消息标记
    const user = users.value.find(user => user.id === userId);
    if (user) {
      user.isNewMessage = false;
    }
    getMessages(userId);
  };

  // 初始化函数
  const initSocket = async () => {
    await socketStore.reconnect();
    handlerEvent();
    getUsers();
  };

  // 清理函数
  const cleanup = () => {
    const socket = getSocket();
    if (socket) {
      socket.off("message");
    }
  };

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup();
  });

  return {
    // 状态
    users,
    messages,
    selectedUserId,

    // 方法
    getUsers,
    getMessages,
    sendMessage,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    sendCallControl,
    selectUser,
    initSocket,
    cleanup,

    // 事件处理
    handleGetUsers,
    handleGetMessages,
    handleChat,
    handleAnswer
  };
}
