import Vue from 'vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import VueTypedJs from 'vue-typed-js'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'

import App from './App.vue'
import router from './router'

import './assets/style/theme/index.css'
import './assets/custom.scss'

Vue.config.productionTip = false

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(VueTypedJs)
Vue.use(VueRouter)
Vue.use(ElementUI)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
