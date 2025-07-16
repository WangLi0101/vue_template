export interface WorkerRequest {
  type: "start" | "stop";
  time: number;
}

let timer: null | number = null;
let num = 0;

const startTimer = (time: number) => {
  const result = time;
  num = result;
  self.postMessage(result);
  timer && self.clearInterval(timer);
  timer = self.setInterval(() => {
    num += 1;
    self.postMessage(num);
  }, 1000);
};

const stopTimer = () => {
  if (timer) {
    self.clearInterval(timer);
    timer = null;
  }
};

self.addEventListener("message", function (e: MessageEvent<WorkerRequest>) {
  const res = e.data;
  switch (res.type) {
    case "start":
      startTimer(res.time);
      break;
    case "stop":
      stopTimer();
      break;
    default:
      break;
  }
});
