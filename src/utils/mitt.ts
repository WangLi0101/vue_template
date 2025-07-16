import type { Emitter } from 'mitt';
import mitt from 'mitt';

type Events = {
  player: string;
};

export const emitter: Emitter<Events> = mitt<Events>();
