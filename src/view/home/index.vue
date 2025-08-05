<template>
  <div class="home">
    <div id="local_stream" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import TRTC from "trtc-js-sdk";
onMounted(() => {
  getInputList();
  initStream();
});
const getInputList = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    TRTC.getCameras().then(devices => {
      if (devices.length === 0) {
        reject("没有摄像头");
      }
      const res = devices.find(device => {
        return device.getCapabilities().facingMode?.includes("user");
      });
      if (res) {
        resolve(res.deviceId);
      } else {
        resolve(devices[0].deviceId);
      }
    });
  });
};

const initStream = async () => {
  const deviceId = await getInputList();
  console.log(deviceId);

  const localStream = TRTC.createStream({
    userId: "1212121",
    audio: true,
    video: true,
    cameraId: deviceId
  });
  try {
    await localStream.initialize();
    //播放本地流
    localStream.play("local_stream");
    console.log("初始化本地流成功");
  } catch (error) {
    console.error("初始化本地流失败 " + error);
  }
};
</script>

<style lang="scss" scoped></style>
