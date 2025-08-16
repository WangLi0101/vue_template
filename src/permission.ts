import router from "./router";
import { useSocketStore } from "./store/modules/socket";
const whiteList = ["/"];
router.beforeEach(to => {
  const socketStore = useSocketStore();
  if (!whiteList.includes(to.path) && !socketStore.userId) {
    router.push({ name: "Login" });
  }
  if (whiteList.includes(to.path) && socketStore.userId) {
    router.push({ name: "Chat" });
  }
});
