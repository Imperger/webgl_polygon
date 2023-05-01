import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

Vue.use(VueRouter);

const routes: RouteConfig[] = [
  {
    path: '/',
    name: 'Index',
    component: () =>
      import(/* webpackChunkName: "index" */ '@/apps/index/AppListPage.vue')
  },
  {
    path: '/grid',
    name: 'Grid',
    component: () =>
      import(/* webpackChunkName: "grid" */ '@/apps/grid/View.vue')
  },
  {
    path: '/collision',
    name: 'Collision',
    component: () =>
      import(/* webpackChunkName: "collision" */ '@/apps/collision/View.vue')
  },
  {
    path: '*',
    name: 'NotFound',
    component: () =>
      import(/* webpackChunkName: "notfound" */ '../views/NotFound.vue')
  }
];

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
});

export default router;
