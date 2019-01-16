'use strict'

import {
  app,
  Menu
} from 'electron'

import Prompt from './utils/prompt'
import {
  Kubectl,
  OpenTerminal
} from './utils/commands'

export default class {
  constructor (cb) {
    this.cb = cb

    this.rerender()
  }

  rerender () {
    this.cb(this.loadingMenu())

    this.rerenderMenu().then(x => {
      this.cb(x)
    })
  }

  loadingMenu () {
    return Menu.buildFromTemplate([
      {
        type: 'normal',
        label: 'Loading...',
        enabled: false
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        }
      }
    ])
  }

  async rerenderMenu () {
    let menuTemplate = []

    // Development debuggers
    if (process.env.NODE_ENV === 'development') {
      menuTemplate.push({
        label: 'Prompt Error',
        click: () => {
          Prompt.open({
            type: 'error',
            payload: {
              error_title: `Error title`,
              error_msg: `There is an error.`
            }
          })
        }
      })
      menuTemplate.push({
        label: 'Prompt Port-Forward',
        click: () => {
          Prompt.open({
            type: 'port-forward',
            payload: {
              default_port: 9090
            }
          })
        }
      })
      menuTemplate.push({
        type: 'separator'
      })
    }

    // Menu generated
    const kubectlData = await Kubectl.getAll()

    menuTemplate.push({
      type: 'normal',
      label: 'Reload',
      click: () => {
        this.rerender()
      }
    })
    menuTemplate.push({
      type: 'separator'
    })

    menuTemplate.push({
      type: 'normal',
      label: 'Contexts',
      enabled: false
    })
    this.createContextTemplate(kubectlData.contexts).forEach(x => {
      menuTemplate.push(x)
    })

    menuTemplate.push({
      type: 'separator'
    })
    menuTemplate.push({
      type: 'normal',
      label: 'Namespaces',
      enabled: false
    })
    this.createNamespacesTemplate(kubectlData.namespaces).forEach(x => {
      menuTemplate.push(x)
    })

    menuTemplate.push({
      type: 'separator'
    })
    menuTemplate.push({
      type: 'normal',
      label: 'Pods',
      enabled: false
    })
    this.createContainersTemplate(kubectlData.containers).forEach(x => {
      menuTemplate.push(x)
    })

    menuTemplate.push({
      type: 'separator'
    })
    menuTemplate.push({
      type: 'normal',
      label: 'Services',
      enabled: false
    })
    this.createServicesTemplate(kubectlData.services).forEach(x => {
      menuTemplate.push(x)
    })

    menuTemplate.push({
      type: 'separator'
    })
    menuTemplate.push({
      label: 'Quit',
      click: () => {
        app.quit()
      }
    })

    return Menu.buildFromTemplate(menuTemplate)
  }

  createContextTemplate (contexts) {
    const currentContext = contexts['current-context']
    const contextsTemplate = contexts.contexts.map(contextName => {
      const checked = (currentContext === contextName)
      return {
        type: 'radio',
        checked: checked,
        label: contextName,
        click: () => {
          Kubectl.changeContext(contextName)
          this.rerender()
        }
      }
    })
    return contextsTemplate
  }

  createNamespacesTemplate (namespaces) {
    const namespacesTemplate = namespaces.map(namespaceName => {
      const checked = (namespaceName === Kubectl.namespace)
      return {
        type: 'radio',
        checked: checked,
        label: namespaceName,
        click: () => {
          Kubectl.changeNamespace(namespaceName)
          this.rerender()
        }
      }
    })
    return namespacesTemplate
  }

  createServicesTemplate (services) {
    return services.map(service => {
      return {
        label: service.name,
        submenu: [
          {
            label: 'port-forward',
            submenu: service.ports.map(port => ({
              label: port.toString(),
              click: () => {
                OpenTerminal.runPortForwardSvc(service.name, Kubectl.namespace, port)
              }
            }))
          }
        ]
      }
    })
  }

  createContainersTemplate (groupedPods) {
    return Object.keys(groupedPods).map(groupedContainerName => {
      const template = {
        label: groupedContainerName,
        submenu: [
          {
            label: '[all]',
            submenu: [
              {
                label: 'tail',
                click: () => {
                  OpenTerminal.runKubeTail(groupedContainerName, Kubectl.namespace)
                }
              }
            ]
          }
        ]
      }

      groupedPods[groupedContainerName].forEach(pod => {
        const onlyOneContainer = pod.containers.length === 1
        pod.containers.forEach(container => {
          let extraLabel = ''
          if (!onlyOneContainer) {
            extraLabel = ` -> ${container.name}`
          }
          let containerTemplate = {
            label: `${pod.name}${extraLabel}`,
            submenu: [
              {
                label: 'exec',
                click: () => {
                  OpenTerminal.runExec(container.name, pod.name, Kubectl.namespace)
                }
              },
              {
                label: 'tail',
                click: () => {
                  OpenTerminal.runTail(container.name, pod.name, Kubectl.namespace)
                }
              }
            ]
          }
          if (container.ports.length) {
            containerTemplate.submenu.push({
              label: 'port-forward',
              submenu: container.ports.map(port => {
                return {
                  label: port.toString(),
                  click: () => {
                    OpenTerminal.runPortForward(pod.name, Kubectl.namespace, port)
                  }
                }
              })
            })
          }
          template.submenu.push(containerTemplate)
        })
      })

      return template
    })
  }
}
