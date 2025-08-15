import { generateId } from "@/utils/nanoid";
import { defineStore } from "pinia";
import { io, Socket } from "socket.io-client";
import { ref } from "vue";

export interface CallbackPayload<T> {
  code: number;
  payload?: T;
}

export const useSocketStore = defineStore(
  "socketStore",
  () => {
    const isConnected = ref(false);
    const name = ref("");
    const userId = ref("");
    let socket: Socket | null = null;

    const login = (userName: string): Promise<string> => {
      userId.value = userId.value || generateId();
      name.value = userName; // 保存用户名
      return new Promise((resolve, reject) => {
        socket = io("https://socket.guxiaotong.cn", {
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
    const reconnect = async () => {
      if (socket) return;
      console.log("自动重连");
      await login(name.value);
    };

    // 断开连接
    const disconnect = () => {
      if (socket) {
        socket.disconnect();
        socket = null;
        isConnected.value = false;
      }
    };

    // 获取socket实例
    const getSocket = () => socket;

    return {
      isConnected,
      name,
      userId,

      login,
      reconnect,
      disconnect,
      getSocket
    };
  },
  {
    persist: {
      key: "socketStore",
      pick: ["name", "userId"],
      storage: sessionStorage
    }
  }
);
