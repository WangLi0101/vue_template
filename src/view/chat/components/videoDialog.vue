<template>
  <el-dialog
    v-model="dialogVisible"
    title="视频通话"
    width="800px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <div class="dialog-content">
      <div class="video-container flex gap-4 mb-4">
        <div class="local-video flex-1 relative">
          <video
            ref="localVideo"
            autoplay
            muted
            playsinline
            class="w-full h-64 object-cover rounded-lg bg-gray-900"
          />
          <div
            class="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded"
          >
            本地视频
          </div>
        </div>
        <div class="remote-video flex-1 relative">
          <video
            ref="remoteVideo"
            autoplay
            playsinline
            class="w-full h-64 object-cover rounded-lg bg-gray-900"
          />
          <!-- 专门用于播放远程音频的音频元素 -->
          <audio ref="remoteAudio" autoplay style="display: none" />

          <!-- 手动播放按钮（当自动播放失败时显示） -->
          <div
            v-if="showPlayButton"
            class="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <el-button
              type="primary"
              size="large"
              @click="manualPlay"
              class="play-button"
            >
              <el-icon class="mr-2"><VideoCamera /></el-icon>
              点击播放视频和音频
            </el-button>
          </div>

          <div
            class="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded"
          >
            远程视频
          </div>
        </div>
      </div>

      <!-- 连接信息显示 -->
      <ConnectionInfo
        :peer-connection="props.peerConnection"
        :visible="dialogVisible"
      />

      <!-- 媒体播放提示 -->
      <div class="media-tip text-center mb-4">
        <el-alert
          title="如果无法自动播放视频或音频，请点击视频区域的播放按钮"
          type="info"
          :closable="false"
          show-icon
          class="text-sm"
        />
      </div>

      <!-- 通话控制按钮 -->
      <div class="controls flex justify-center gap-4">
        <el-button
          :type="isMuted ? 'danger' : 'primary'"
          circle
          size="large"
          @click="toggleMute"
          :title="isMuted ? '取消静音' : '静音'"
        >
          <el-icon><Microphone /></el-icon>
        </el-button>

        <el-button
          :type="isVideoOff ? 'danger' : 'primary'"
          circle
          size="large"
          @click="toggleVideo"
          :title="isVideoOff ? '开启摄像头' : '关闭摄像头'"
        >
          <el-icon><VideoCamera /></el-icon>
        </el-button>

        <el-button
          type="danger"
          circle
          size="large"
          @click="hangUp"
          title="挂断"
        >
          <el-icon><Phone /></el-icon>
        </el-button>
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
let localStream: MediaStream | null = null;

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
  console.log("stream tracks:", stream.getTracks());

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
};

// 组件卸载时清理
onUnmounted(() => {
  // 清理资源
});

defineExpose({
  playLoacalStream,
  playRemoteStream
});
</script>

<style lang="scss" scoped>
.play-button {
  background: rgba(64, 158, 255, 0.9) !important;
  border: none !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(64, 158, 255, 1) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }
}

.remote-video {
  position: relative;

  video {
    background: #1a1a1a;
  }
}
</style>
