<template>
  <div class="about">
    <h2>拍照功能</h2>
    <div class="camera-container">
      <!-- 相机预览区域 -->
      <div id="my_camera" class="camera-view"></div>
      
      <!-- 拍照按钮 -->
      <div class="camera-controls">
        <button @click="takeSnapshot" class="capture-btn">拍照</button>
        <button @click="resetCamera" class="reset-btn">重置</button>
        <button @click="toggleCamera" class="toggle-btn">切换摄像头</button>
      </div>
      
      <!-- 拍照结果展示区域 -->
      <div class="result-container">
        <h3>拍照结果：</h3>
        <div id="results"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

// 声明Webcam变量，因为它是通过CDN加载的外部库
declare const Webcam: any;

// 使用ref来跟踪当前摄像头模式
const isFrontCamera = ref(true);

// 初始化相机
const initCamera = (facingMode = 'user') => {
  // 确保Webcam已加载
  if (typeof Webcam !== 'undefined') {
    // 如果相机已经在运行，先重置
    if (Webcam.loaded) {
      Webcam.reset();
    }
    
    Webcam.set({
      width: 320,
      height: 240,
      image_format: 'jpeg',
      jpeg_quality: 90,
      // 使用传入的facingMode参数
     constraints: {
      facingMode: facingMode,
     }
    });
    
    Webcam.attach('#my_camera');
  } else {
    console.error('Webcam库未加载');
  }
};

// 切换前后摄像头
const toggleCamera = () => {
  isFrontCamera.value = !isFrontCamera.value;
  const facingMode = isFrontCamera.value ? 'user' : 'environment';
  initCamera(facingMode);
};

// 拍照方法
const takeSnapshot = () => {
  // 拍照并获取数据URI
  Webcam.snap((data_uri: string) => {
    // 显示拍照结果
    document.getElementById('results')!.innerHTML = 
      `<img src="${data_uri}" alt="拍照结果"/>`;
  });
};

// 重置相机
const resetCamera = () => {
  document.getElementById('results')!.innerHTML = '';
};

// 组件挂载时初始化相机
onMounted(() => {
  // 动态加载WebcamJS
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/webcamjs/1.0.26/webcam.min.js';
  script.async = true;
  script.onload = () => {
    // 脚本加载完成后初始化相机
    initCamera(isFrontCamera.value ? 'user' : 'environment');
  };
  document.head.appendChild(script);
});

// 组件卸载时释放相机资源
onUnmounted(() => {
  if (typeof Webcam !== 'undefined') {
     Webcam.reset();
  }
});
</script>

<style scoped>
.about {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.camera-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.camera-view {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.camera-controls {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.capture-btn, .reset-btn, .toggle-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.capture-btn {
  background-color: #4CAF50;
  color: white;
}

.reset-btn {
  background-color: #f44336;
  color: white;
}

.toggle-btn {
  background-color: #2196F3;
  color: white;
}

.result-container {
  margin-top: 20px;
  width: 100%;
  text-align: center;
}

#results img {
  max-width: 320px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px;
}
</style>
