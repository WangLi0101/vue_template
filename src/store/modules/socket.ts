import { generateId } from "@/utils/nanoid";
import { defineStore } from "pinia";
import { io, Socket } from "socket.io-client";
import { ref } from "vue";
interface User {
  id: string;
  userName: string;
  isOnline: boolean;
  isSelf: boolean;
}
interface Message {
  id: string;
  type: string;
  senderId: string;
  receiverId: string;
  data: string;
}
interface Event {
  type: string;
  payload: any;
}
interface SendMessage {
  type: string;
  receiverId: string;
  data: string;
}

export interface CallbackPayload<T> {
  code: number;
  payload?: T;
}

export const useSocketStore = defineStore("socketStore", () => {
  const users = ref<User[]>([]);
  const messages = ref<Message[]>([]);
  const isConnected = ref(false);
  const name = ref("");
  const userId = ref("");
  const selectedUserId = ref<string>("");
  let socket: Socket | null = null;
  const login = (userName: string, id?: string): Promise<string> => {
    userId.value = id || generateId();
    name.value = userName; // 保存用户名
    return new Promise((resolve, reject) => {
      socket = io("http://localhost:3000", {
        auth: {
          userName,
          userId: userId.value
        },
        reconnection: true, // 启用自动重连
        reconnectionAttempts: 5, // 最大重连次数
        reconnectionDelay: 1000 // 重连延迟时间
      });
      socket.on("connect", () => {
        isConnected.value = true;
        resolve(userId.value);
        handlerEvent();
      });
      socket.on("connect_error", err => {
        isConnected.value = false;
        reject(err);
      });
      socket.on("disconnect", () => {
        isConnected.value = false;
      });
    });
  };

  // 自动重连函数
  const reconnect = async (userName: string, id: string) => {
    if (name.value) return;
    console.log("自动重连", id);
    name.value = userName;
    await login(userName, id);
  };

  const handlerEvent = () => {
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
      }
    });
  };
  const handleGetUsers = (data: User[]) => {
    users.value = data
      .map(user => ({
        ...user,
        isSelf: user.id === userId.value
      }))
      .sort((a, b) => {
        if (a.isSelf) return -1;
        if (b.isSelf) return 1;
        return 0;
      });
  };
  const handleGetMessages = (data: Message[]) => {
    messages.value = data;
  };
  const handleChat = (data: Message) => {
    if (selectedUserId.value === data.senderId) {
      messages.value.push(data);
    }
  };

  const getUsers = () => {
    socket?.emit("message", {
      type: "getUsers"
    });
  };
  const getMessages = (receiverId: string) => {
    socket?.emit("message", {
      type: "getMessages",
      payload: receiverId
    });
  };
  const sendMessage = (message: SendMessage) => {
    socket?.emit(
      "message",
      {
        type: "chat",
        payload: message
      },
      (data: CallbackPayload<Message>) => {
        if (data.code === 0) {
          messages.value.push(data.payload!);
        }
      }
    );
  };
  // 断开连接
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      isConnected.value = false;
    }
  };

  // 选择用户
  const selectUser = (userId: string) => {
    selectedUserId.value = userId;
    getMessages(userId);
  };

  return {
    users,
    messages,
    isConnected,
    name,
    userId,
    selectedUserId,

    login,
    reconnect,
    getUsers,
    getMessages,
    sendMessage,
    disconnect,
    selectUser
  };
});
