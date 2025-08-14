<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="w-full max-w-sm px-8 py-10">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-gray-800">Welcome</h1>
        <p class="mt-2 text-gray-500">Enter your username to continue</p>
      </div>

      <el-form :model="form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="Username"
            size="large"
            :prefix-icon="UserIcon"
            clearable
            autofocus
          />
        </el-form-item>

        <el-form-item class="mt-6">
          <el-button
            type="primary"
            native-type="submit"
            class="w-full"
            size="large"
            round
          >
            Continue
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, h } from "vue";
import { ElIcon } from "element-plus";
import { User } from "@element-plus/icons-vue";

const form = reactive({
  username: ""
});

const UserIcon = h(ElIcon, null, { default: () => h(User) });

const handleLogin = () => {
  console.log("Attempting to log in with username:", form.username);
  // Login logic would go here
};
</script>

<style scoped>
:deep(.el-input__wrapper) {
  border-radius: 9999px; /* Fully rounded */
  padding: 0.25rem 1rem;
}

.el-button--primary {
  background-color: #2563eb; /* A nice blue */
  border-color: #2563eb;
  transition: background-color 0.3s;
}

.el-button--primary:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}
</style>
