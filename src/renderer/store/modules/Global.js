import _ from 'lodash'

export default {
  state_: {
    currentContext: '',
    lastPageVisited: 'home',
    recentHistory: []
  },
  mutations: {
    prompt: () => {},
    replayRecentHistory: () => {},
    pushRecentHistory: (state, x) => {
      // Reorder history if exists
      let newRecentHistory = state.recentHistory.filter(e => {
        return !_.isEqual(e, x)
      })
      newRecentHistory.unshift(x)
      state.recentHistory = newRecentHistory
    }
  },
  actions: {
    prompt: ({ commit }, x) => { commit('prompt', x) },
    replayRecentHistory: ({ commit }, x) => { commit('replayRecentHistory', x) },
    pushRecentHistory: ({ commit }, x) => { commit('pushRecentHistory', x) }
  }
}
