<template>
  <div class="home">
    <el-button @click="start" type="primary">start</el-button>
    <el-button @click="stop" type="primary">stop</el-button>
    <p class="bg-amber-400">
      {{ timeStore.seconds }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useTimeStore } from "@/store/modules/time";
const timeStore = useTimeStore();
const start = () => {
  timeStore.start(1);
};
const stop = () => {
  timeStore.stop();
};
</script>
