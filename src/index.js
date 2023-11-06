import Vue from 'vue'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

// eslint-disable-next-line no-new
new Vue({
  el: '#app',
  router: router,
  components: {App},
  template: '<App/>'
})
