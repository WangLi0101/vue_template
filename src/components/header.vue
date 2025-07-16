<template>
  <div class="header">
    <video class="w-[200px] h-[200px]" id="headerVideoPlayer" />
  </div>
</template>

<script setup lang="ts">
import { useTemporyStore } from '@/store/tempory';
import { emitter } from '@/utils/mitt';
import { onMounted } from 'vue';
const temporyStore = useTemporyStore();
onMounted(async () => {
  emitter.on('player', player);
  await startCamera();
});
let stream: MediaStream | null = null;
const startCamera = async () => {
  try {
    const constraints = {
      video: true, // 打开视频（摄像头）
      audio: false, // 不打开麦克风
    };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    temporyStore.setStartVideo(true);
  } catch (err) {
    console.error('获取摄像头失败:', err);
    alert('无法访问摄像头，请检查权限或设备。');
  }
};
const player = (id: string) => {
  const video = document.getElementById(id) as HTMLVideoElement;
  if (!video) {
    console.error('视频元素未找到');
    return;
  }
  console.log(video, stream);

  video.srcObject = stream;
  video.play();
};
</script>
