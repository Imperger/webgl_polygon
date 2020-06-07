import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

Vue.use(VueRouter);

const routes: RouteConfig[] = [
  {
    path: '/',
    name: 'Index',
    component: () => import(/* webpackChunkName: "about" */ '@/apps/index/View.vue')
  },
  {
    path: '/grid',
    name: 'Grid',
    component: () => import(/* webpackChunkName: "about" */ '@/apps/grid/View.vue')
  },
  {
    path: '*',
    name: 'NotFound',
    component: () => import(/* webpackChunkName: "about" */ '../views/NotFound.vue')
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
