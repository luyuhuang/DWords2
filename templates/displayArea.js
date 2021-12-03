import Vue from 'vue';
import DisplayArea from './views/DisplayArea.vue';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

new Vue({
  render: h => h(DisplayArea)
}).$mount('#widget');
