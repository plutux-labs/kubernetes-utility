'use strict'

import { dialog } from 'electron'
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import jsonpath from 'jsonpath'
import log from 'electron-log'
import _ from 'lodash'

import VuexStore from '../../renderer/store'
import Prompt from './prompt'
import spawn from './promise-spawn'
import terminalTab from './terminal-tab'

const _spawn = async args => {
  try {
    const stdout = await spawn(Command.kubectl.path, args, Command.option)
    if (args.indexOf('-ojson') !== -1) {
      try {
        return JSON.parse(stdout)
      } catch (e) {
        log.error(`Invalid JSON given by '${Command.kubectl.path} ${args.join(' ')}'\n${stdout.toString('utf-8')}`)
        return {}
      }
    }
    return stdout.toString('utf-8')
  } catch (e) {
    log.error(`kubectl error from 'kubectl ${args.join(' ')}'\n${e.stderr.toString('utf-8')}`)
    return null
  }
}

const _spawnSync = args => {
  const res = spawnSync(Command.kubectl.path, args, Command.option)
  if (res.status !== 0) {
    log.error(`kubectl error from 'kubectl ${args.join(' ')}'\n${res.stderr.toString('utf-8')}`)
    return null
  }
  if (args.indexOf('-ojson') !== -1) {
    try {
      return JSON.parse(res.stdout)
    } catch (e) {
      log.error(`Invalid JSON given by '${Command.kubectl.path} ${args.join(' ')}'\n${res.stdout.toString('utf-8')}`)
      return {}
    }
  }
  return res.stdout.toString('utf-8')
}

class Command {
  static kubectl = {
    path: null
  }

  static kubetail = {
    alias: 'kt',
    path: null
  }

  static option = {
    env: {
      PATH: '/usr/local/bin:/usr/bin:/bin'
    }
  }

  static appendKubecfgEnv (cmd) {
    const kubecfgEnv = this.option.env.KUBECONFIG ? `KUBECONFIG="${this.option.env.KUBECONFIG}" ` : ''
    return `${kubecfgEnv}${cmd}`
  }
}

export class Prerequisite {
  static fulfill () {
    const KUBECONFIG_CREATE_FROM_EMPTY = `apiVersion: v1
    clusters: []
    contexts: []
    current-context: ""
    kind: Config
    preferences: {}
    users: []
    `

    function which (cmd, alias) {
      let res = spawnSync('which', [cmd], Command.option)
      let res2 = {}
      if (typeof alias === 'string') {
        res2 = spawnSync('which', [alias], Command.option)
      }
      if (res.status === 1 && res2.status === 0) {
        Command[cmd].path = res2.stdout.toString('utf-8').trim()
        return {
          cmd: alias,
          status: res2.status,
          path: res2.stdout.toString('utf-8').trim()
        }
      } else {
        Command[cmd].path = res.stdout.toString('utf-8').trim()
        return {
          cmd,
          status: res.status,
          path: res.stdout.toString('utf-8').trim()
        }
      }
    }

    function createDirectoryIfNotExists (path) {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, {
          mode: 0o755
        })
      }
    }

    function createNewKubecfgIfNotExists (path) {
      if (!fs.existsSync(path)) {
        log.info('Creating kubeconfig at default home path')
        fs.writeFileSync(path, KUBECONFIG_CREATE_FROM_EMPTY, {
          encoding: 'utf-8',
          mode: 0o600
        })
      }
    }

    // function overwriteSymlink (existingPath, asPath) {
    //   try {
    //     fs.unlinkSync(asPath) // Remove the old **** anyway
    //   } catch (e) {
    //     //
    //   }
    //   fs.symlinkSync(existingPath, asPath)
    // }

    const result = [
      which('kubectl'),
      which('kubetail', 'kt')
    ]

    const fulfilled = result.length === result.filter(x => !x.status).length

    if (fulfilled) {
      log.info('Prerequisite is fulfilled')
    } else {
      const cmdRequired = result.filter(x => x.status).map(x => `"${x.cmd}"`).join(', ')
      log.warn(`Prerequisite is not fulfilled, missing ${cmdRequired}`)
      dialog.showErrorBox('Prerequisite is not fulfilled', `Try install ${cmdRequired} using brew ${JSON.stringify(result)}`)
    }

    // Config command environment
    const kubecfgDirectory = path.join(os.homedir(), '.kube')
    const trayKubecfgPath = path.join(os.homedir(), '.kube/utility_tray_config')
    const defaultKubecfgPath = path.join(os.homedir(), '.kube/config')
    const extraKubecfgPath = path.join(os.homedir(), '.kube/utility_tray_extra_config') // Only this file is unpacked from asar, so special handle
    // const appendedKubecfgPath = path.join(__static, '/kubecfg.json').replace('app.asar', 'app.asar.unpacked') // Only this file is unpacked from asar, so special handle
    // const appendedKubecfgSymlink = path.join(os.homedir(), '.kube/utility_tray_config_builtin')

    createDirectoryIfNotExists(kubecfgDirectory)
    createNewKubecfgIfNotExists(trayKubecfgPath)
    createNewKubecfgIfNotExists(defaultKubecfgPath)
    // overwriteSymlink(appendedKubecfgPath, appendedKubecfgSymlink)

    // Command.option.env.KUBECONFIG = `${trayKubecfgPath}:${defaultKubecfgPath}:${appendedKubecfgSymlink}`
    Command.option.env.KUBECONFIG = `${trayKubecfgPath}:${defaultKubecfgPath}:${extraKubecfgPath}`

    return fulfilled
  }
}

export class Kubectl {
  static context = ''
  static namespace = 'default'
  static services = []
  static onlyDefaultNamespace = {}

  static checkOnylDefaultNamespace (contextData) {
    const currentContext = contextData ? contextData['current-context'] : ''
    const currentContextUserName = (contextData.contexts.find(x => x.name === currentContext) || { context: { user: '' } }).context.user
    const currentContextUserToken = (contextData.users.find(x => x.name === currentContextUserName) || { user: { token: undefined } }).user.token
    return typeof currentContextUserToken === 'string'
  }

  static async getContexts () {
    const res = await _spawn(['config', 'view', '-ojson'])
    this.context = res ? res['current-context'] : ''
    this.onlyDefaultNamespace = this.checkOnylDefaultNamespace(res)
    VuexStore.dispatch('updateCurrentContext', this.context)
    return {
      'current-context': this.context,
      'contexts': res ? res.contexts.map(x => {
        return x.name
      }) : []
    }
  }

  static changeContext (context) {
    const output = _spawnSync(['config', 'use-context', context])
    log.info(output)
  }

  static async getNamespaces () {
    if (this.onlyDefaultNamespace) {
      return ['default']
    }
    const res = await _spawn(['get', 'namespaces', '-ojson'])
    return jsonpath.query(res || {}, '$.items[*].metadata.name')
  }

  static changeNamespace (namespace) {
    this.namespace = namespace
    log.info(`Switched to namespace "${this.namespace}"`)
  }

  static async getPods (services = []) {
    const res = await _spawn(['-n', this.namespace, 'get', 'pods', '-ojson'])
    const ungroupedPods = (res ? res.items : []).map(pod => {
      const labels = pod.metadata.labels
      const servicesPorts = services
        .filter(service => {
          if (!service.selector) return false
          return _.isMatch(labels, service.selector)
        })
        .reduce((acc, service) => {
          service.ports.forEach(portDetail => {
            let port = null
            switch (true) {
              case typeof portDetail.targetPort === 'number':
                port = portDetail.targetPort
                break
              case portDetail.targetPort === 'http':
                port = 80
                break
              case portDetail.targetPort === 'https':
                port = 443
                break
              default:
                break
            }
            if (port) acc.add(port)
          })
          return acc
        }, new Set())
      return {
        name: pod.metadata.name,
        labels: labels,
        containers: pod.spec.containers.map(container => {
          let containerPortsAvailable = new Set()
          if (container.ports) {
            container.ports.forEach(port => {
              containerPortsAvailable.add(port.containerPort)
            })
          }
          if (servicesPorts.size) {
            containerPortsAvailable = new Set([...containerPortsAvailable, ...servicesPorts])
          }

          return {
            name: container.name,
            ports: [...containerPortsAvailable]
          }
        })
      }
    })
    const groupedPods = ungroupedPods.reduce((acc, pod) => {
      let groupingKey = ''
      if (pod.labels.app) {
        groupingKey = pod.labels.app
      } else if (pod.containers.length === 1) {
        groupingKey = pod.containers[0].name
      } else {
        groupingKey = pod.name
      }
      if (typeof acc[groupingKey] === 'undefined') {
        acc[groupingKey] = [pod]
      } else {
        acc[groupingKey].push(pod)
      }
      return acc
    }, {})

    return groupedPods
  }

  static async getRawServices () {
    const res = await _spawn(['-n', this.namespace, 'get', 'services', '-ojson'])
    if (res === null) return []
    return res.items.map(service => {
      return {
        name: service.metadata.name,
        // labels: service.metadata.labels,
        selector: service.spec.selector,
        ports: jsonpath.query(service, '$.spec.ports[*]')
      }
    })
  }

  static async getServices (services) {
    return services.map(service => {
      const ports = service.ports
        .map(x => {
          return x.port
        })
      return {
        name: service.name,
        ports: [...(new Set(ports))]
      }
    })
  }

  static async getAll () {
    const services = await this.getRawServices()
    const waitAll = await Promise.all([
      this.getContexts(),
      this.getNamespaces(),
      this.getServices(services),
      this.getPods(services)
    ])
    const ret = {
      contexts: waitAll[0],
      namespaces: waitAll[1],
      services: waitAll[2],
      containers: waitAll[3]
    }
    OpenTerminal.cleanDeadRecentHistory(ret)
    return ret
  }
}

export class OpenTerminal {
  static pushRecentHistory (funcName, args, metadata) {
    VuexStore.dispatch('pushRecentHistory', {
      type: 'command',
      class: 'OpenTerminal',
      func: funcName,
      args: Object.values(args),
      metadata: {
        context: Kubectl.context,
        ...metadata
      }
    })
  }

  static cleanDeadRecentHistory ({ services, containers }) {
    containers = _.flatten(Object.values(containers)).map(x => x.name)
    services = services.map(x => x.name)
    const aliveHistory = VuexStore.state.Global.recentHistory.filter(e => {
      if (_.has(e.metadata, 'context')) {
        if (e.metadata.context !== Kubectl.context) return true
      }
      if (_.has(e.metadata, 'podName')) {
        return containers.indexOf(e.metadata.podName) !== -1
      }
      if (_.has(e.metadata, 'svcName')) {
        return services.indexOf(e.metadata.svcName) !== -1
      }
      return true
    })
    VuexStore.dispatch('updateRecentHistory', aliveHistory)
  }

  static runExec (containerName, podName, namespace) {
    let command = Command.appendKubecfgEnv(`${Command.kubectl.path} -n ${namespace} exec -it ${podName} -c ${containerName} /bin/bash`)
    terminalTab.open(command)
    this.pushRecentHistory(this.runExec.name, arguments, {
      action: 'exec',
      namespace,
      podName,
      containerName
    })
  }

  static runTail (containerName, podName, namespace) {
    let command = Command.appendKubecfgEnv(`${Command.kubectl.path} -n ${namespace} logs -f ${podName} -c ${containerName}`)
    terminalTab.open(command)
    this.pushRecentHistory(this.runTail.name, arguments, {
      action: 'tail',
      namespace,
      podName,
      containerName
    })
  }

  static async runPortForward (podName, namespace, port, localPort) {
    if (typeof localPort === 'undefined') {
      if (!VuexStore.state.Settings.portforwardWithoutPrompt) {
        const resp = await Prompt.open({
          type: 'port-forward',
          payload: {
            port: port
          }
        })
        localPort = resp.port ? resp.port : port
      } else {
        localPort = port
      }
    }
    let command = Command.appendKubecfgEnv(`${Command.kubectl.path} port-forward -n ${namespace} ${podName} ${localPort}:${port}`)
    terminalTab.open(command)
    this.pushRecentHistory(this.runPortForward.name, arguments, {
      action: 'port-forward',
      namespace,
      podName,
      localPort,
      targetPort: port
    })
  }

  static async runPortForwardSvc (svcName, namespace, port, localPort) {
    if (typeof localPort === 'undefined') {
      if (!VuexStore.state.Settings.portforwardWithoutPrompt) {
        const resp = await Prompt.open({
          type: 'port-forward',
          payload: {
            port: port
          }
        })
        localPort = resp.port ? resp.port : port
      } else {
        localPort = port
      }
    }
    let command = Command.appendKubecfgEnv(`${Command.kubectl.path} port-forward -n ${namespace} svc/${svcName} ${localPort}:${port}`)
    terminalTab.open(command)
    this.pushRecentHistory(this.runPortForwardSvc.name, arguments, {
      action: 'port-forward',
      namespace,
      svcName,
      localPort,
      targetPort: port
    })
  }

  static runKubeTail (criteria, namespace) {
    let command = Command.appendKubecfgEnv(`${Command.kubetail.path} ${criteria} -n ${namespace}`)
    terminalTab.open(command)
    this.pushRecentHistory(this.runKubeTail.name, arguments, {
      action: 'kube-tail',
      namespace,
      criteria
    })
  }
}

export default {
  Prerequisite,
  Kubectl,
  OpenTerminal
}
