import Vue from 'vue'
import Home from './views/Home.vue'
import Settings from './views/Settings.vue'
import Plans from './views/Plans.vue'
import Statistics from './views/Statistics.vue'
import Router from './views/Router.vue'
import VueRouter from 'vue-router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min'
import 'bootstrap-icons/font/bootstrap-icons.css'

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
      path: '/settings',
      component: Settings
    },
    {
      path: '/plans',
      component: Plans
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
}).$mount('#widget')
