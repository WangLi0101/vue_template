/**
 * 文件处理工具函数
 * 用于WebRTC文件传输相关的功能
 */

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

/**
 * 发送文件
 * @param file 要发送的文件
 * @param channel 数据通道
 * @param onProgress 进度回调函数
 * @returns 返回一个Promise，在文件发送完成时解析
 */
export const sendFileInChunks = async (
  file: File,
  channel: RTCDataChannel,
  onProgress: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!file || !channel || channel.readyState !== "open") {
      reject(new Error("无效的文件或数据通道未打开"));
      return;
    }

    // 发送文件信息
    const fileInfo = {
      name: file.name,
      type: file.type,
      size: file.size
    };
    channel.send(JSON.stringify({ type: "file-info", data: fileInfo }));

    // 设置传输参数
    const chunkSize = 64 * 1024; // 64KB分片大小
    let offset = 0;
    const fileReader = new FileReader();
    const bufferThreshold = 1024 * 1024; // 1MB缓冲区阈值
    let sendingPaused = false;
    let pendingChunk: ArrayBuffer | null = null;
    let lastProgressUpdate = Date.now();

    // 监控DataChannel缓冲区状态
    channel.bufferedAmountLowThreshold = bufferThreshold / 2; // 设置为阈值的一半

    channel.onbufferedamountlow = () => {
      if (sendingPaused && pendingChunk) {
        console.log("缓冲区已降至阈值以下，继续发送");
        sendingPaused = false;
        // 发送暂停的分片
        channel.send(pendingChunk);
        pendingChunk = null;
        // 继续读取下一个分片
        if (offset < file.size) {
          setTimeout(() => readSlice(offset), 10); // 添加小延迟避免立即填满缓冲区
        }
      }
    };

    fileReader.onload = e => {
      if (e.target?.result && channel.readyState === "open") {
        if (typeof e.target.result === "string") {
          console.error("文件读取结果类型错误");
          reject(new Error("文件读取结果类型错误"));
          return;
        }

        // 检查缓冲区状态
        if (channel.bufferedAmount > bufferThreshold) {
          console.log("缓冲区已满，暂停发送");
          sendingPaused = true;
          pendingChunk = e.target.result;
          return;
        }

        try {
          channel.send(e.target.result);
          offset += e.target.result.byteLength;

          // 更新进度 - 限制更新频率
          const now = Date.now();
          const newProgress = Math.min(
            100,
            Math.floor((offset / file.size) * 100)
          );

          // 只有进度变化或距离上次更新超过500ms才更新UI
          if (
            newProgress !== Math.floor(newProgress) ||
            now - lastProgressUpdate > 500
          ) {
            onProgress(newProgress);
            lastProgressUpdate = now;

            // 减少日志输出频率
            if (newProgress % 5 === 0 || newProgress === 100) {
              console.log(`文件传输进度: ${newProgress}%`);
            }
          }

          // 继续读取下一个分片
          if (offset < file.size) {
            // 根据缓冲区状态动态调整延迟
            const delay = channel.bufferedAmount > bufferThreshold / 2 ? 50 : 5;
            setTimeout(() => {
              readSlice(offset);
            }, delay);
          } else {
            console.log("文件传输完成");
            channel.send(JSON.stringify({ type: "file-complete" }));
            resolve();
          }
        } catch (error) {
          console.error("发送文件分片失败:", error);
          // 尝试重新发送当前分片
          setTimeout(() => {
            if (channel.readyState === "open") {
              console.log("尝试重新发送分片");
              readSlice(offset);
            } else {
              reject(new Error("文件传输连接已断开"));
            }
          }, 1000);
        }
      }
    };

    fileReader.onerror = error => {
      console.error("文件读取错误:", error);
      reject(new Error("文件读取错误"));
    };

    const readSlice = (o: number) => {
      const slice = file.slice(o, o + chunkSize);
      fileReader.readAsArrayBuffer(slice);
    };

    // 开始读取第一个分片
    readSlice(0);
  });
};

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
  onComplete: (file: Blob) => void
): void => {
  let receivedSize = 0;
  let fileBuffer: ArrayBuffer[] = [];
  let lastProgressUpdate = Date.now();
  let fileWriter: FileSystemWriteStream | null = null;
  let tempFileHandle: FileSystemFileHandle | null = null;
  let fileInfo: { name: string; type: string; size: number } | null = null;

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
          fileInfo = message.data;
          if (fileInfo) {
            onFileInfo(fileInfo);
            console.log("接收文件信息:", fileInfo);

            // 重置接收状态
            fileBuffer = [];
            receivedSize = 0;

            // 对于大文件（超过50MB），尝试使用File System Access API
            if (supportsFileSystem && fileInfo.size > 50 * 1024 * 1024) {
              try {
                // 请求用户选择保存位置
                tempFileHandle = await window.showSaveFilePicker({
                  suggestedName: fileInfo.name,
                  types: [
                    {
                      description: "文件",
                      accept: {
                        [fileInfo.type || "application/octet-stream"]: [".file"]
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
          }
        } else if (message.type === "file-complete") {
          // 文件接收完成处理
          console.log("开始处理接收完成的文件...");

          if (fileWriter) {
            // 使用File System API的情况
            try {
              await fileWriter.close();
              console.log("文件已保存到用户选择的位置");

              // 创建一个空的Blob作为占位符
              onComplete(
                new Blob([], {
                  type: fileInfo?.type || "application/octet-stream"
                })
              );
            } catch (error) {
              console.error("保存文件失败:", error);
              throw new Error("保存文件失败");
            }
          } else {
            // 使用内存模式的情况
            try {
              console.log(`合并 ${fileBuffer.length} 个文件分片...`);
              const blob = new Blob(fileBuffer, {
                type: fileInfo?.type || "application/octet-stream"
              });
              onComplete(blob);
            } catch (error) {
              console.error("合并文件分片失败:", error);
              throw new Error("文件处理失败");
            }
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
          throw new Error("文件写入失败");
        }
      } else {
        // 使用内存模式
        fileBuffer.push(data);
        receivedSize += data.byteLength;
      }

      // 更新进度 - 限制更新频率
      if (fileInfo) {
        const now = Date.now();
        const newProgress = Math.min(
          100,
          Math.floor((receivedSize / fileInfo.size) * 100)
        );

        // 只有进度变化或距离上次更新超过500ms才更新UI
        if (
          newProgress !== Math.floor(newProgress) ||
          now - lastProgressUpdate > 500
        ) {
          onProgress(newProgress);
          lastProgressUpdate = now;

          // 减少日志输出频率，避免控制台阻塞
          if (newProgress % 5 === 0 || newProgress === 100) {
            console.log(`文件接收进度: ${newProgress}%`);
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
