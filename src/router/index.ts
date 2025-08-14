import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw
} from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/view/home/index.vue")
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/view/login/index.vue")
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
