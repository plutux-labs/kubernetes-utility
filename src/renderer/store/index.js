import Vue from 'vue'
import Vuex from 'vuex'
import {
  createPersistedState,
  createSharedMutations
} from 'vuex-electron'

import modules from './modules'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules,
  plugins: [
    createPersistedState(),
    createSharedMutations()
  ],
  strict: process.env.NODE_ENV !== 'production'
})

export default store

export function mapComputed (attribute, namespace) {
  if (typeof attribute !== 'string') return {}
  const capitalizedAttribute = attribute.charAt(0).toUpperCase() + attribute.slice(1)
  const state = typeof namespace === 'string' ? store.state[namespace] : store.state.Global
  const action = typeof namespace === 'string' ? `${namespace}/update${capitalizedAttribute}` : `update${capitalizedAttribute}`
  return {
    [attribute]: {
      get () {
        return state[attribute]
      },
      set (newValue) {
        return store.dispatch(action, newValue)
      }
    }
  }
}
