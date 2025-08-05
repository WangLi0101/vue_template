import { defineStore } from "pinia";
import { ref } from "vue";
import type { TimeWorker } from "../../../types/timeWorker";
const worker: TimeWorker = new Worker(
  new URL("../../webWorker/time.ts", import.meta.url),
  {
    type: "module"
  }
);
export const useTimeStore = defineStore("timeStore", () => {
  const seconds = ref(0);

  const start = (time: number) => {
    worker.postMessage({ type: "start", time });
  };

  const stop = () => {
    worker.postMessage({ type: "stop" });
  };

  worker.addEventListener("message", function (e) {
    const res = e.data;
    seconds.value = res;
  });

  return { seconds, start, stop };
});
