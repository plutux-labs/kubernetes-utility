/**
 * The file enables `@/store/index.js` to import all vuex modules
 * in a one-shot manner. There should not be any reason to edit this file.
 */

const files = require.context('.', false, /\.js$/)
const modules = {}

files.keys().forEach(key => {
  if (key === './index.js') return
  const namespace = key.replace(/(\.\/|\.js)/g, '')
  const module = files(key).default
  const state_ = module.state_ || {}
  delete module.state_
  if (typeof module.state === 'undefined') module.state = {}
  if (typeof module.getters === 'undefined') module.getters = {}
  if (typeof module.mutations === 'undefined') module.mutations = {}
  if (typeof module.actions === 'undefined') module.actions = {}
  Object.keys(state_).forEach(attribute => {
    const actionName = `update${attribute.charAt(0).toUpperCase()}${attribute.slice(1)}`.toString()
    if (typeof module.state[attribute] === 'undefined') module.state[attribute] = state_[attribute]
    if (typeof module.mutations[actionName] === 'undefined') module.mutations[actionName] = (state, x) => { state[attribute] = x }
    if (typeof module.actions[actionName] === 'undefined') module.actions[actionName] = ({ commit }, x) => { commit(actionName, x) }
  })
  module.namespaced = key !== './Global.js'
  modules[namespace] = module
})

export default modules
