import { createApp } from 'vue';
import './style.scss';
import App from './App.vue';
import pinia from '@/store';

const app = createApp(App);

app.use(pinia);

app.mount('#app');
