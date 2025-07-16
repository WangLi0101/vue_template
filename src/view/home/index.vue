<template>
  <div class="home">
    <button @click="start">start</button>
    <button @click="stop">stop</button>
    <p class="bg-amber-400">
      {{ timeStore.seconds }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useTimeStore } from "@/store/time";
const timeStore = useTimeStore();
const start = () => {
  timeStore.start(1);
};
const stop = () => {
  timeStore.stop();
};
</script>
