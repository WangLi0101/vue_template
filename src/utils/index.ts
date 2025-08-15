import dayjs from "dayjs";

export const formateTime = (time: string) => {
  if (!time) return "";
  return dayjs(time).format("HH:mm:ss");
};

// 获取用户头像颜色
export const getUserAvatarColor = (userName: string) => {
  const colors = [
    "bg-gradient-to-br from-slate-400 to-slate-500",
    "bg-gradient-to-br from-stone-400 to-stone-500",
    "bg-gradient-to-br from-neutral-400 to-neutral-500",
    "bg-gradient-to-br from-zinc-400 to-zinc-500",
    "bg-gradient-to-br from-gray-400 to-gray-500",
    "bg-gradient-to-br from-emerald-400 to-emerald-500",
    "bg-gradient-to-br from-teal-400 to-teal-500",
    "bg-gradient-to-br from-cyan-400 to-cyan-500"
  ];

  const hash = userName.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};
