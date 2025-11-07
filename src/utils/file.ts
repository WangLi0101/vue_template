/**
 * 文件处理工具函数
 * 用于WebRTC文件传输相关的功能
 */

// 为File System Access API添加类型声明
interface FileSystemWriteStream {
  write(data: ArrayBuffer | Blob | string): Promise<void>;
  close(): Promise<void>;
  abort?: (reason?: unknown) => Promise<void>;
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

export const FILE_MESSAGE_TYPE = {
  INFO: "file-info",
  COMPLETE: "file-complete",
  CANCEL: "file-cancel",
  ERROR: "file-error"
} as const;

type FileMessageType =
  (typeof FILE_MESSAGE_TYPE)[keyof typeof FILE_MESSAGE_TYPE];

const DEFAULT_CHUNK_SIZE = 64 * 1024; // 64KB
const DEFAULT_BUFFER_THRESHOLD = 1024 * 1024; // 1MB

export interface SendFileOptions {
  signal?: AbortSignal;
  chunkSize?: number;
}

/**
 * 发送文件
 * @param file 要发送的文件
 * @param channel 数据通道
 * @param onProgress 进度回调函数
 * @returns 返回一个Promise，在文件发送完成时解析
 */
export async function sendFileInChunks(
  file: File,
  channel: RTCDataChannel,
  onProgress: (progress: number) => void,
  options: SendFileOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const { signal, chunkSize = DEFAULT_CHUNK_SIZE } = options;

    if (!file) {
      reject(new Error("文件不存在"));
      return;
    }

    if (!channel) {
      reject(new Error("数据通道不可用"));
      return;
    }

    if (channel.readyState !== "open") {
      reject(new Error("数据通道未打开"));
      return;
    }

    if (chunkSize <= 0) {
      reject(new Error("无效的分片大小"));
      return;
    }

    if (!Number.isFinite(file.size) || file.size < 0) {
      reject(new Error("文件大小无效"));
      return;
    }

    let offset = 0;
    let isSending = true;
    let isFinished = false;
    let isCancelled = false;
    let lastProgressUpdate = Date.now();
    let lastReportedProgress = -1;
    let cancelNotified = false;

    const bufferThreshold = Math.max(DEFAULT_BUFFER_THRESHOLD, chunkSize * 4);

    const cleanup = () => {
      isSending = false;
      channel.onbufferedamountlow = null;
      channel.removeEventListener("close", handleClose);
      channel.removeEventListener("error", handleError as EventListener);
      signal?.removeEventListener("abort", handleAbort);
    };

    const safeSend = (payload: ArrayBuffer | string) => {
      if (channel.readyState !== "open") {
        throw new Error("数据通道已关闭");
      }

      if (typeof payload === "string") {
        channel.send(payload);
        return;
      }

      channel.send(new Uint8Array(payload));
    };

    const sendJson = (message: Record<string, unknown>) => {
      safeSend(JSON.stringify(message));
    };

    const notifyCancel = (reason?: string) => {
      if (cancelNotified || channel.readyState !== "open") return;
      try {
        sendJson({ type: FILE_MESSAGE_TYPE.CANCEL, reason });
        cancelNotified = true;
      } catch (error) {
        console.warn("发送取消通知失败:", error);
      }
    };

    const handleAbort = () => {
      if (isFinished || isCancelled) return;
      isCancelled = true;
      const abortSignal = signal as
        | (AbortSignal & { reason?: unknown })
        | undefined;
      const abortReason = abortSignal?.reason;
      notifyCancel(
        typeof abortReason === "string" && abortReason.trim()
          ? abortReason
          : "sender-abort"
      );
      cleanup();
      reject(new DOMException("文件发送已取消", "AbortError"));
    };

    const handleClose = () => {
      if (isFinished || isCancelled) return;
      cleanup();
      reject(new Error("文件传输连接已关闭"));
    };

    const handleError = (event: Event) => {
      if (isFinished || isCancelled) return;
      console.error("数据通道错误:", event);
      cleanup();
      reject(new Error("文件传输错误"));
    };

    const updateProgress = (sentBytes: number) => {
      if (!file.size) {
        onProgress(100);
        return;
      }

      const now = Date.now();
      const progress = Math.min(100, Math.floor((sentBytes / file.size) * 100));

      if (progress !== lastReportedProgress || now - lastProgressUpdate > 500) {
        onProgress(progress);
        lastProgressUpdate = now;
        lastReportedProgress = progress;

        if (progress % 5 === 0 || progress === 100) {
          console.log(`文件传输进度: ${progress}%`);
        }
      }
    };

    const pump = async (): Promise<void> => {
      while (
        isSending &&
        offset < file.size &&
        !isCancelled &&
        channel.readyState === "open"
      ) {
        if (signal?.aborted) {
          handleAbort();
          return;
        }

        if (channel.bufferedAmount > bufferThreshold) {
          isSending = false;
          return;
        }

        try {
          const slice = file.slice(offset, offset + chunkSize);
          const buffer = await slice.arrayBuffer();

          if (buffer.byteLength === 0) {
            console.warn("读取到空的文件分片，提前结束传输");
            break;
          }

          safeSend(buffer);
          offset += buffer.byteLength;
          updateProgress(offset);
        } catch (error) {
          console.error("发送文件分片失败:", error);

          if (signal?.aborted) {
            handleAbort();
            return;
          }

          if (channel.readyState !== "open") {
            handleClose();
            return;
          }

          await new Promise(r => setTimeout(r, 500));
        }
      }

      if (!isCancelled && offset >= file.size && !isFinished) {
        isFinished = true;
        updateProgress(file.size);

        try {
          sendJson({ type: FILE_MESSAGE_TYPE.COMPLETE });
        } catch (error) {
          cleanup();
          reject(error as Error);
          return;
        }

        cleanup();
        resolve();
      }
    };

    channel.bufferedAmountLowThreshold = bufferThreshold / 2;
    channel.onbufferedamountlow = () => {
      if (!isSending && !isCancelled && channel.readyState === "open") {
        isSending = true;
        void pump();
      }
    };

    signal?.addEventListener("abort", handleAbort, { once: true });
    channel.addEventListener("close", handleClose);
    channel.addEventListener("error", handleError);

    try {
      updateProgress(0);

      sendJson({
        type: FILE_MESSAGE_TYPE.INFO,
        data: {
          name: file.name,
          type: file.type,
          size: file.size
        }
      });

      if (signal?.aborted) {
        handleAbort();
        return;
      }

      if (file.size === 0) {
        isFinished = true;
        sendJson({ type: FILE_MESSAGE_TYPE.COMPLETE });
        cleanup();
        resolve();
        return;
      }

      void pump();
    } catch (error) {
      cleanup();
      reject(error as Error);
    }
  });
}

/**
 * 接收文件
 * @param dataChannel 数据通道
 * @param onFileInfo 文件信息回调
 * @param onProgress 进度回调
 * @param onComplete 完成回调
 */
export const receiveFile = (
  dataChannel: RTCDataChannel,
  onFileInfo: (fileInfo: { name: string; type: string; size: number }) => void,
  onProgress: (progress: number) => void,
  onComplete: (file: Blob) => void,
  onCancel?: (reason?: string) => void
): void => {
  let receivedSize = 0;
  let fileBuffer: ArrayBuffer[] = [];
  let lastProgressUpdate = Date.now();
  let lastReportedProgress = -1;
  let fileWriter: FileSystemWriteStream | null = null;
  let tempFileHandle: FileSystemFileHandle | null = null;
  let fileInfo: { name: string; type: string; size: number } | null = null;

  // 检查是否支持File System Access API
  const supportsFileSystem = "showSaveFilePicker" in window;

  const resetState = () => {
    fileBuffer = [];
    receivedSize = 0;
    lastProgressUpdate = Date.now();
    lastReportedProgress = -1;
  };

  const updateProgress = () => {
    if (!fileInfo) return;

    if (!fileInfo.size) {
      onProgress(100);
      return;
    }

    const now = Date.now();
    const progress = Math.min(
      100,
      Math.floor((receivedSize / fileInfo.size) * 100)
    );

    if (progress !== lastReportedProgress || now - lastProgressUpdate > 500) {
      onProgress(progress);
      lastProgressUpdate = now;
      lastReportedProgress = progress;

      if (progress % 5 === 0 || progress === 100) {
        console.log(`文件接收进度: ${progress}%`);
      }
    }
  };

  const closeWriterSafely = async (reason?: string) => {
    if (!fileWriter) return;
    try {
      if (typeof fileWriter.abort === "function") {
        await fileWriter.abort(reason);
      } else {
        await fileWriter.close();
      }
    } catch (error) {
      console.warn("关闭文件写入流失败:", error);
    } finally {
      fileWriter = null;
      tempFileHandle = null;
    }
  };

  const handleCancel = async (reason = "对方取消了文件发送") => {
    await closeWriterSafely(reason);
    resetState();
    fileInfo = null;
    onProgress(0);
    if (onCancel) {
      onCancel(reason);
    }
  };

  dataChannel.onmessage = async event => {
    const data = event.data;

    // 如果是字符串，可能是文件信息或完成信号
    if (typeof data === "string") {
      try {
        const message = JSON.parse(data) as {
          type: FileMessageType;
          data?: { name: string; type: string; size: number };
          reason?: string;
        };

        switch (message.type) {
          case FILE_MESSAGE_TYPE.INFO: {
            const info = message.data;
            if (!info || typeof info.size !== "number") {
              console.warn("接收到的文件信息无效:", message.data);
              return;
            }

            fileInfo = info;
            onFileInfo(info);
            console.log("接收文件信息:", info);

            resetState();
            updateProgress();

            // 对于大文件（超过50MB），尝试使用File System Access API
            if (supportsFileSystem && info.size > 50 * 1024 * 1024) {
              try {
                tempFileHandle = await window.showSaveFilePicker({
                  suggestedName: info.name,
                  types: [
                    {
                      description: "文件",
                      accept: {
                        [info.type || "application/octet-stream"]: [".file"]
                      }
                    }
                  ]
                });

                const writable = await tempFileHandle.createWritable();
                fileWriter = writable;
                console.log("使用File System API接收大文件");
              } catch (error) {
                console.warn("无法使用File System API，回退到内存模式:", error);
                fileWriter = null;
                tempFileHandle = null;
              }
            }
            break;
          }
          case FILE_MESSAGE_TYPE.COMPLETE: {
            if (!fileInfo) {
              console.warn("未收到文件信息就收到完成消息");
              return;
            }

            console.log("开始处理接收完成的文件...");

            if (fileWriter) {
              try {
                await fileWriter.close();
                console.log("文件已保存到用户选择的位置");
                onComplete(
                  new Blob([], {
                    type: fileInfo.type || "application/octet-stream"
                  })
                );
              } catch (error) {
                console.error("保存文件失败:", error);
                throw new Error("保存文件失败");
              } finally {
                fileWriter = null;
                tempFileHandle = null;
                resetState();
                fileInfo = null;
              }
            } else {
              try {
                console.log(`合并 ${fileBuffer.length} 个文件分片...`);
                const blob = new Blob(fileBuffer, {
                  type: fileInfo.type || "application/octet-stream"
                });
                onComplete(blob);
              } catch (error) {
                console.error("合并文件分片失败:", error);
                throw new Error("文件处理失败");
              } finally {
                resetState();
                fileInfo = null;
              }
            }
            break;
          }
          case FILE_MESSAGE_TYPE.CANCEL: {
            await handleCancel(message.reason);
            break;
          }
          case FILE_MESSAGE_TYPE.ERROR: {
            console.error("发送端报告错误:", message);
            await handleCancel(message.reason || "对方终止了文件传输");
            break;
          }
          default: {
            console.warn("收到未知的文件消息类型:", message.type);
          }
        }
      } catch (error) {
        console.error("解析消息失败:", error);
      }
      return;
    }

    if (!(data instanceof ArrayBuffer)) {
      console.warn("收到未知的数据类型:", typeof data);
      return;
    }

    if (!fileInfo) {
      console.warn("在收到文件信息之前接收到了数据分片，已忽略");
      return;
    }

    if (fileWriter) {
      try {
        await fileWriter.write(data);
        receivedSize += data.byteLength;
      } catch (error) {
        console.error("写入文件失败:", error);
        await handleCancel("文件写入失败");
        throw new Error("文件写入失败");
      }
    } else {
      fileBuffer.push(data);
      receivedSize += data.byteLength;
    }

    updateProgress();
  };

  dataChannel.onopen = () => {
    console.log("数据通道已打开，准备接收文件");
  };

  dataChannel.onerror = async error => {
    console.error("数据通道错误:", error);
    await handleCancel("数据通道发生错误");
    throw new Error("文件传输错误");
  };
};

/**
 * 下载文件
 * @param blob 文件Blob对象
 * @param fileName 文件名
 */
export const downloadFile = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
