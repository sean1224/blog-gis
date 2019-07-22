import Vue from 'vue'
import Router from 'vue-router'
import mapContainer from '@/pages/mapContainer'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'mapContainer',
      component: mapContainer
    }
  ]
})
