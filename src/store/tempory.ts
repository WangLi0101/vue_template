import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTemporyStore = defineStore('temportStore', () => {
  const isStartVideo = ref(false);
  const setStartVideo = (value: boolean) => {
    isStartVideo.value = value;
  };
  return { isStartVideo, setStartVideo };
});
