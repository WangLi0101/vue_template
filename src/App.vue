<template>
  <div>
    <el-button @click="goAbout">关于</el-button>
    <el-button @click="goHome">首页</el-button>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const goHome = () => {
  router.push({ name: "Home" });
};

const goAbout = () => {
  router.push({ name: "About" });
};
</script>
