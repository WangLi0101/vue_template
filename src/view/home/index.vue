<template>
  <div class="home">
    <video class="w-[200px] h-[200px]" id="videoPlayer" />
  </div>
</template>

<script setup lang="ts">
import { useTemporyStore } from '@/store/tempory';
import { emitter } from '@/utils/mitt';
import { watch } from 'vue';
const temporyStore = useTemporyStore();
watch(
  () => temporyStore.isStartVideo,
  (newVal) => {
    if (newVal) {
      emitter.emit('player', 'videoPlayer');
    }
  }
);
</script>
