#!/usr/bin/env node

const {
  spawnSync
} = require('child_process')
const fs = require('fs')
const path = require('path')

function spawn (cmdArray) {
  const cmd = cmdArray.shift()
  return spawnSync(cmd, cmdArray).stdout.toString('utf-8').trim()
}

const DEFAULT_CONTEXT = spawn(['kubectl', 'config', 'current-context'])
console.log(`Default context: ${DEFAULT_CONTEXT}`)

let CONFIG_VIEW = {}
try {
  CONFIG_VIEW = JSON.parse(spawn(['kubectl', 'config', 'view', '-o', 'json']))
} catch (e) {
  //
}

let GENERATED_KUBECFG = {
  'apiVersion': 'v1',
  'kind': 'Config',
  'clusters': [],
  'contexts': [],
  'preferences': {},
  'users': [],
  'current-context': ''
}

const SKIP_CONTEXT = [
  'dind'
]

CONFIG_VIEW.contexts.forEach(context => {
  const contextName = context.name
  if (SKIP_CONTEXT.indexOf(contextName) !== -1) {
    return
  }
  console.log(`Handling context: ${contextName}`)

  spawn(['kubectl', 'config', 'use-context', context.name])

  const cluster = CONFIG_VIEW.clusters.find(x => x.name === context.context.cluster)
  const clusterServer = cluster.cluster.server

  let defaultNamespaceUserSecret = null
  try {
    let defaultNamespaceUserSecretName = JSON.parse(spawn(['kubectl', 'get', 'sa', 'default-ns-user', '-o', 'json'])).secrets[0].name
    defaultNamespaceUserSecret = JSON.parse(spawn(['kubectl', 'get', 'secrets', defaultNamespaceUserSecretName, '-n', 'default', '-o', 'json']))
  } catch (e) {
    //
  }

  if (defaultNamespaceUserSecret) {
    const crt = defaultNamespaceUserSecret.data['ca.crt']
    const tokenEncoded = defaultNamespaceUserSecret.data.token
    const tokenBuffer = new Buffer.from(tokenEncoded, 'base64')
    const token = tokenBuffer.toString('utf-8')
    console.log('--- Writing down context info ---')
    GENERATED_KUBECFG.clusters.push({
      'name': contextName,
      'cluster': {
        'certificate-authority-data': crt,
        'server': clusterServer
      }
    })
    GENERATED_KUBECFG.contexts.push({
      'name': contextName,
      'context': {
        'cluster': contextName,
        'namespace': 'default',
        'user': contextName
      }
    })
    GENERATED_KUBECFG.users.push({
      'name': contextName,
      'user': {
        'client-key-data': crt,
        'token': token,
        'as-user-extra': {}
      }
    })
    GENERATED_KUBECFG['current-context'] = contextName
  }
})

spawn(['kubectl', 'config', 'use-context', DEFAULT_CONTEXT])

const GENERATED_KUBECFG_STRING = JSON.stringify(GENERATED_KUBECFG, null, 2)

console.log('Replacing old kubecfg.json...')
fs.writeFileSync(path.join(__dirname, '../static/kubecfg.json'), GENERATED_KUBECFG_STRING, {
  encoding: 'utf-8',
  mode: 0o644
})
