import Vue from 'vue'
import danmaku from './src/Danmaku.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min'
import 'bootstrap-icons/font/bootstrap-icons.css'

new Vue({
  render: h => h(danmaku)
}).$mount('#widget')
