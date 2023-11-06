import VueRouter from 'vue-router'
import Expression from '@/components/vue-expression'

const routes = [
  {
    path: '/expression',
    name: 'expr',
    component: Expression
  }
]

const router = new VueRouter({
  routes: routes,
  mode: 'history'
})

export default router
