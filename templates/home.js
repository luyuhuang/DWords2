import Vue from 'vue';
import Home from './views/Home.vue';
import Settings from './views/Settings.vue';
import Plans from './views/Plans.vue';
import Statistics from './views/Statistics.vue';
import Router from './views/Router.vue';
import VueRouter from 'vue-router';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './style/common.css';

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'hash',
  base: '/home.html',
  routes: [
    {
      path: '/',
      component: Home
    },
    {
      path: '/settings*',
      component: Settings
    },
    {
      path: '/plans',
      component: Plans,
      props: route => route.query
    },
    {
      path: '/statistics',
      component: Statistics
    },
  ],
});

new Vue({
  router,
  render: h => h(Router)
}).$mount('#widget');
