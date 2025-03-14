/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-03-03 17:32:38
 * @LastEditors: zhjiajia 46287134@qq.com
 * @LastEditTime: 2025-03-11 16:00:14
 * @FilePath: \workRome\AI-Human-Live\src\router.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { KeepAlive } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('./layouts/Main.vue'),
    children: [
      { path: '', component: () => import('./pages/Home.vue') },
      { path: 'home', component: () => import('./pages/Home.vue') },
      { path: 'server', component: () => import('./pages/Server.vue') },
      { path: 'sound', component: () => import('./pages/SoundClone.vue') },
      {
        path: 'live',
        component: () => import('./pages/DigtalHumanLive.vue'),
        meta: { keepAlive: true },
      },
      { path: 'setting', component: () => import('./pages/Setting.vue') },
      { path: 'video', component: () => import('./pages/Video.vue') },
      {
        path: 'live-room/edit',
        component: () => import('./pages/LiveRoom/LiveRoomEdit.vue'),
      },
      {
        path: '/avatar',
        component: () => import('./pages/AvatarClone.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('./layouts/Raw.vue'),
    children: [],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// watch router change
router.beforeEach((to, from, next) => {
  window.$mapi?.statistics?.tick('visit', {
    path: to.path,
  });
  next();
});

export default router;
