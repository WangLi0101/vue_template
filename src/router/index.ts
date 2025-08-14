import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw
} from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Login",
    component: () => import("@/view/login/index.vue")
  },
  {
    path: "/chat",
    name: "Chat",
    component: () => import("@/view/chat/index.vue")
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
