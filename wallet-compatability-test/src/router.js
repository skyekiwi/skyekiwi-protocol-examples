import VueRouter from 'vue-router'
import Main from '@/views/Main.vue'

const router = new VueRouter({
  routes: [
    { path: '/', component: Main }
  ]
})

export default router
