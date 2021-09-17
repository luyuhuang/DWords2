import Vue from 'vue';
import Danmaku from './views/Danmaku.vue';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

new Vue({
  render: h => h(Danmaku)
}).$mount('#widget');
