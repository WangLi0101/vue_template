import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs";
/** 路径查找 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pathResolve = (dir: string): string => {
  return resolve(__dirname, ".", dir);
};

/** 设置别名 */
const alias: Record<string, string> = {
  "@": pathResolve("src"),
  "@build": pathResolve("build")
};

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias
  },
  server: {
    // 允许跨域
    cors: true,
    // 允许自定义端口
    port: 8080,
    // 允许自定义主机
    host: "0.0.0.0",
    // 开启https
    https: {
      key: fs.readFileSync("192.168.0.13-key.pem"),
      cert: fs.readFileSync("192.168.0.13.pem")
    }
  }
});
