import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'index',
      component: require('@/components/pages/Index').default
    },
    {
      path: '/links',
      name: 'links',
      component: require('@/components/pages/Links').default
    },
    {
      path: '/settings',
      name: 'settings',
      component: require('@/components/pages/Settings').default
    },
    {
      path: '/prompt',
      name: 'prompt',
      component: require('@/components/pages/Prompt').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
