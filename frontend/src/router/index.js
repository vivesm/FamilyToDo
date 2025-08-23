import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import PeopleView from '@/views/PeopleView.vue';
import SettingsView from '@/views/SettingsView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/people',
    name: 'people',
    component: PeopleView
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;