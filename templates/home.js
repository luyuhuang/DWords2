import Vue from 'vue'
import home from './src/Home.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min'

new Vue({
  render: h => h(home)
}).$mount('#widget')
