import Vue from 'vue'
import Danmaku from './views/Danmaku.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min'
import 'bootstrap-icons/font/bootstrap-icons.css'

new Vue({
  render: h => h(Danmaku)
}).$mount('#widget')
