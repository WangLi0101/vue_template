<template>
  <el-dialog
    v-model="dialogVisible"
    title="视频通话"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="video-dialog"
  >
    <div class="dialog-content">
      <div class="call-header">
        <div class="status-badge">实时通话进行中</div>
        <p class="call-hint">保持网络稳定，获得更佳音视频体验</p>
      </div>

      <div class="video-layout">
        <div class="remote-panel">
          <div class="remote-feed-wrapper">
            <video ref="remoteVideo" autoplay playsinline class="remote-feed" />
            <audio ref="remoteAudio" autoplay style="display: none" />

            <div v-if="showPlayButton" class="play-overlay">
              <el-button
                type="primary"
                size="large"
                @click="manualPlay"
                class="play-button"
              >
                <el-icon class="mr-2"><VideoCamera /></el-icon>
                点击播放远程视频
              </el-button>
            </div>

            <div
              v-if="!hasRemoteMedia && !showPlayButton"
              class="remote-placeholder"
            >
              <div class="placeholder-art">
                <el-icon class="placeholder-icon"><VideoCamera /></el-icon>
                <p>等待远程媒体流…</p>
              </div>
            </div>

            <div class="feed-label remote">远程画面</div>
          </div>
        </div>

        <div class="local-panel">
          <div class="local-card">
            <video
              ref="localVideo"
              autoplay
              muted
              playsinline
              class="local-feed"
            />
            <div v-if="isLocalVideoDisabled" class="overlay-badge">
              <el-icon class="overlay-icon"><VideoCamera /></el-icon>
              <span>摄像头已关闭</span>
            </div>
            <div v-if="isMuted" class="status-pill muted">
              <el-icon class="pill-icon"><Microphone /></el-icon>
              <span>已静音</span>
            </div>
            <div class="feed-label local">本地预览</div>
          </div>
        </div>
      </div>
      <div class="info-section">
        <ConnectionInfo
          class="connection-card"
          :peer-connection="props.peerConnection"
          :visible="dialogVisible"
        />

        <div class="control-bar">
          <el-button
            circle
            size="default"
            class="control-button"
            :class="
              isMuted ? 'control-button--danger' : 'control-button--primary'
            "
            @click="toggleMute"
            :title="isMuted ? '取消静音' : '静音'"
            :aria-pressed="isMuted"
            aria-label="切换静音"
          >
            <el-icon><Microphone /></el-icon>
          </el-button>

          <el-button
            circle
            size="default"
            class="control-button"
            :class="
              isVideoOff ? 'control-button--warning' : 'control-button--primary'
            "
            @click="toggleVideo"
            :title="isVideoOff ? '开启摄像头' : '关闭摄像头'"
            :aria-pressed="isVideoOff"
            aria-label="切换摄像头"
          >
            <el-icon><VideoCamera /></el-icon>
          </el-button>

          <el-button
            circle
            size="default"
            class="control-button control-button--danger"
            @click="hangUp"
            title="挂断"
            aria-label="挂断通话"
          >
            <el-icon><Phone /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, onUnmounted } from "vue";
import { Microphone, VideoCamera, Phone } from "@element-plus/icons-vue";
import ConnectionInfo from "./ConnectionInfo.vue";

interface Props {
  modelValue: boolean;
  peerConnection?: RTCPeerConnection | null;
}
interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "hangUp"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 对话框显示状态
const dialogVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

// 视频和音频元素引用
const localVideoRef = useTemplateRef<HTMLVideoElement>("localVideo");
const remoteVideoRef = useTemplateRef<HTMLVideoElement>("remoteVideo");
const remoteAudioRef = useTemplateRef<HTMLAudioElement>("remoteAudio");

// 通话控制状态
const isMuted = ref(false);
const isVideoOff = ref(false);
const showPlayButton = ref(false);
const hasRemoteMedia = ref(false);
let localStream: MediaStream | null = null;

// 根据真实轨道状态与按钮状态综合判断是否显示“摄像头关闭”角标
const isLocalVideoDisabled = computed(() => {
  if (isVideoOff.value) return true;
  if (!localStream) return false;
  const tracks = localStream.getVideoTracks();
  if (tracks.length === 0) return true;
  return !tracks.some(t => t.enabled && t.readyState === "live");
});

// 播放本地流
const playLoacalStream = (stream: MediaStream) => {
  console.log("playLoacalStream 被调用", stream);
  localStream = stream;
  nextTick(() => {
    if (!localVideoRef.value) {
      console.error("localVideoRef.value 为空");
      return;
    }
    console.log("设置本地视频流");
    localVideoRef.value.srcObject = stream;
  });
};

// 播放远程流
const playRemoteStream = (stream: MediaStream) => {
  console.log("playRemoteStream 被调用", stream);
  console.log("rmotestream tracks:", stream.getTracks());

  nextTick(async () => {
    if (!remoteVideoRef.value || !remoteAudioRef.value) {
      console.error("remoteVideoRef 或 remoteAudioRef 为空");
      return;
    }

    console.log("设置远程视频流");
    remoteVideoRef.value.srcObject = stream;

    // 同时设置音频流到专门的音频元素
    console.log("设置远程音频流");
    remoteAudioRef.value.srcObject = stream;

    // 确保远程视频不被静音，以便播放音频
    remoteVideoRef.value.muted = false;
    remoteAudioRef.value.muted = false;

    // 初始根据轨道设置占位状态
    hasRemoteMedia.value = stream.getTracks().length > 0;

    // 处理音频播放
    const playAudio = async () => {
      try {
        await remoteAudioRef.value?.play();
        console.log("远程音频播放成功");
      } catch (audioErr) {
        console.error("远程音频播放失败:", audioErr);
        console.log("音频自动播放失败，显示手动播放按钮");
        showPlayButton.value = true; // 显示手动播放按钮
      }
    };

    // 处理视频播放
    const playVideo = async () => {
      try {
        await remoteVideoRef.value?.play();
        console.log("远程视频播放成功");
        showPlayButton.value = false; // 播放成功后隐藏按钮
      } catch (videoErr) {
        console.error("远程视频播放失败:", videoErr);
        console.log("视频自动播放失败，显示手动播放按钮");
        showPlayButton.value = true; // 显示手动播放按钮
      }
    };

    // 添加事件监听器来调试
    remoteVideoRef.value.onloadedmetadata = async () => {
      console.log("远程视频元数据加载完成");
      console.log("音频轨道数量:", stream.getAudioTracks().length);
      console.log("视频轨道数量:", stream.getVideoTracks().length);
      console.log(
        "视频尺寸:",
        remoteVideoRef.value?.videoWidth,
        "x",
        remoteVideoRef.value?.videoHeight
      );
      hasRemoteMedia.value = true;
      await playVideo();
    };

    // 音频元素事件监听器
    remoteAudioRef.value.onloadedmetadata = async () => {
      console.log("远程音频元数据加载完成");
      await playAudio();
    };

    remoteAudioRef.value.onplay = () => {
      console.log("远程音频开始播放");
    };

    remoteAudioRef.value.onplaying = () => {
      console.log("远程音频正在播放");
    };

    remoteAudioRef.value.onerror = err => {
      console.error("远程音频播放错误:", err);
    };

    // 视频元素事件监听器
    remoteVideoRef.value.onplay = () => {
      console.log("远程视频开始播放");
    };

    remoteVideoRef.value.onplaying = () => {
      console.log("远程视频正在播放");
    };

    remoteVideoRef.value.onerror = err => {
      console.error("远程视频播放错误:", err);
    };

    remoteVideoRef.value.oncanplay = () => {
      console.log("远程视频可以播放");
      hasRemoteMedia.value = true;
    };
  });
};

// 切换静音
const toggleMute = () => {
  if (!localStream) return;
  const audioTracks = localStream.getAudioTracks();
  audioTracks.forEach(track => {
    track.enabled = !track.enabled;
  });
  isMuted.value = !isMuted.value;
};

// 切换视频
const toggleVideo = () => {
  if (!localStream) return;
  const videoTracks = localStream.getVideoTracks();
  videoTracks.forEach(track => {
    track.enabled = !track.enabled;
  });
  isVideoOff.value = !isVideoOff.value;
};

// 手动播放视频和音频
const manualPlay = async () => {
  console.log("用户手动点击播放按钮");

  try {
    // 尝试播放视频
    if (remoteVideoRef.value) {
      await remoteVideoRef.value.play();
      console.log("手动播放视频成功");
    }

    // 尝试播放音频
    if (remoteAudioRef.value) {
      await remoteAudioRef.value.play();
      console.log("手动播放音频成功");
    }

    // 隐藏播放按钮
    showPlayButton.value = false;
  } catch (error) {
    console.error("手动播放失败:", error);
  }
};

// 挂断通话
const hangUp = () => {
  emit("hangUp");
  dialogVisible.value = false;
  showPlayButton.value = false;
  hasRemoteMedia.value = false;
};

// 组件卸载时清理
onUnmounted(() => {
  // 清理资源
  try {
    if (remoteVideoRef.value) remoteVideoRef.value.srcObject = null;
    if (remoteAudioRef.value) remoteAudioRef.value.srcObject = null;
    if (localVideoRef.value) localVideoRef.value.srcObject = null;
  } catch (err) {
    console.warn("清理媒体资源失败", err);
  }
  showPlayButton.value = false;
  hasRemoteMedia.value = false;
  localStream = null;
});

defineExpose({
  playLoacalStream,
  playRemoteStream
});
</script>

<style lang="scss" scoped>
.video-dialog {
  :deep(.el-dialog) {
    margin: 0.75rem auto !important;
    width: 90% !important;
    max-width: 820px !important;
    border-radius: 18px;
    overflow: hidden;
    background: radial-gradient(
      circle at top,
      rgba(255, 255, 255, 0.98),
      rgba(226, 232, 240, 0.94)
    );
    box-shadow: 0 30px 70px rgba(15, 23, 42, 0.22);

    .el-dialog__header {
      padding: 14px 18px 0;

      @media (min-width: 768px) {
        padding: 18px 24px 0;
      }

      .el-dialog__title {
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
      }
    }

    .el-dialog__body {
      padding: 12px 16px 22px;

      @media (min-width: 768px) {
        padding: 18px 24px 28px;
      }
    }
  }
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.call-header {
  text-align: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #fff;
  background: linear-gradient(120deg, #6366f1, #8b5cf6, #3b82f6);
  box-shadow: 0 12px 30px rgba(99, 102, 241, 0.35);
}

.call-hint {
  margin-top: 10px;
  font-size: 14px;
  color: #475569;
}

.video-layout {
  display: grid;
  --panel-max-h: clamp(280px, 52vh, 460px);
  /* 两列等宽，确保同一 4:3 比例下高度一致 */
  grid-template-columns: repeat(2, minmax(360px, 1fr));
  gap: clamp(14px, 3vw, 28px);
  align-items: start;
}

.remote-panel {
  flex: 1 1 60%;
  display: flex;
}

.remote-feed-wrapper {
  position: relative;
  width: 100%;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(14, 23, 42, 0.45);
  background: #0f172a;
  aspect-ratio: 4 / 3;
  min-height: 260px;
  max-height: var(--panel-max-h);
}

.remote-feed {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #0f172a;
}

.remote-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    160deg,
    rgba(15, 23, 42, 0.6),
    rgba(15, 23, 42, 0.3)
  );
  backdrop-filter: blur(4px);
}

.placeholder-art {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #cbd5e1;
  font-size: 14px;
}

.placeholder-icon {
  font-size: 28px;
  color: #60a5fa;
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
}

.play-button {
  background: linear-gradient(130deg, #38bdf8, #2563eb) !important;
  border: none !important;
  padding: 12px 22px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.45);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 36px rgba(37, 99, 235, 0.55);
  }
}

.side-panel {
  flex: 1 1 40%;
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.4vw, 20px);
  max-height: var(--panel-max-h);
  overflow: hidden;
}

.local-panel {
  flex: 1 1 40%;
  display: flex;
}

.side-scroll {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.4vw, 20px);
  max-height: 100%;
  overflow: auto;
}

.local-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(15, 23, 42, 0.92);
  width: 100%;
  aspect-ratio: 4 / 3;
  min-height: 260px;
  max-height: var(--panel-max-h);
}

.local-feed {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scaleX(-1);
}

.feed-label {
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #fff;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
}

.feed-label.remote {
  background: rgba(15, 23, 42, 0.72);
}

.overlay-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: rgba(2, 6, 23, 0.6);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.25);
  pointer-events: none; /* 角标不拦截点击 */
}

.overlay-icon {
  font-size: 16px;
  color: #fb923c;
}

.status-pill {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  background: rgba(248, 250, 252, 0.92);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.25);
}

.status-pill.muted {
  color: #1f2937;
  background: rgba(253, 230, 138, 0.9);
}

.pill-icon {
  font-size: 16px;
}

.connection-card {
  border-radius: 16px;
  padding: 14px 18px;
  background: rgba(248, 250, 252, 0.88);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);

  :deep(.connection-item span) {
    font-size: 13px;
  }
}

.media-tip :deep(.el-alert) {
  border-radius: 16px;
  background: rgba(59, 130, 246, 0.08);
  border: none;
  color: #1d4ed8;
}

.control-bar {
  display: flex;
  justify-content: center;
  gap: clamp(16px, 4vw, 32px);
  margin-top: 4px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.4vw, 20px);
  margin-top: 6px;
}

.control-button {
  width: clamp(48px, 10vw, 60px);
  height: clamp(48px, 10vw, 60px);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.25);

  .el-icon {
    font-size: clamp(16px, 3.4vw, 20px);
  }

  &:hover {
    transform: translateY(-3px);
  }
}

.control-button--primary {
  background: linear-gradient(135deg, #38bdf8, #2563eb);
}

.control-button--warning {
  background: linear-gradient(135deg, #f97316, #fb923c);
}

.control-button--danger {
  background: linear-gradient(135deg, #ef4444, #f87171);
}

@media (max-width: 640px) {
  .dialog-content {
    gap: 16px;
  }

  .status-badge {
    font-size: 11px;
    padding: 5px 12px;
  }

  .call-hint {
    font-size: 13px;
  }

  .video-layout {
    grid-template-columns: 1fr;
    gap: 16px;
    --panel-max-h: clamp(240px, 56vh, 420px);
  }

  .remote-panel,
  .local-panel {
    flex: 1 1 auto;
  }

  .remote-feed-wrapper {
    min-height: 220px;
    max-height: var(--panel-max-h);
  }

  .local-card {
    min-height: 220px;
    max-height: var(--panel-max-h);
    border-radius: 14px;
  }

  .local-feed {
    height: 100%;
  }

  .feed-label {
    font-size: 11px;
  }

  .info-section {
    gap: 12px;
  }

  .control-bar {
    gap: 18px;
  }

  .control-button {
    width: 44px;
    height: 44px;

    .el-icon {
      font-size: 16px;
    }
  }
}

@media (max-width: 480px) {
  .video-dialog :deep(.el-dialog) {
    width: 100% !important;
    margin: 0.5rem auto !important;
    border-radius: 0;
  }

  .dialog-content {
    gap: 14px;
  }

  .remote-feed-wrapper {
    border-radius: 0;
    min-height: clamp(220px, 58vh, 300px);
  }

  .local-card {
    width: 100%;
  }

  .local-feed {
    height: 100%;
  }

  .control-bar {
    gap: 18px;
  }

  .control-button {
    width: 44px;
    height: 44px;
  }
}
</style>
