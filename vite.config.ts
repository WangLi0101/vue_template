import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

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
  }
});
