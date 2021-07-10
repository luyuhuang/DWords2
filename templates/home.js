import Vue from 'vue'
import index from './src/home.vue'

new Vue({
  render: h => h(index)
}).$mount('#widget')
