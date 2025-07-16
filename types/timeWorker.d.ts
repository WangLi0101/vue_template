// utils/typedWorker.ts
interface StartMessage {
  type: "start";
  time: number;
}

interface StopMessage {
  type: "stop";
  time?: never;
}

type TimeWorkerRequest = StartMessage | StopMessage;

export interface TimeWorker extends Worker {
  postMessage: (message: TimeWorkerRequest) => void;
  addEventListener: (
    event: keyof WorkerEventMap,
    callback: (e: { data: number }) => void
  ) => void;
}
