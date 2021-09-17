import Vue from 'vue';
import About from './views/About.vue';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './style/common.css';

new Vue({
  render: h => h(About)
}).$mount('#widget');
