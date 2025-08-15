import dayjs from "dayjs";

export const formateTime = (time: string) => {
  if (!time) return "";
  return dayjs(time).format("HH:mm:ss");
};
