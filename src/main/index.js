'use strict'

import path from 'path'
import {
  app,
  BrowserWindow,
  Tray,
  webContents
} from 'electron'

import VuexStore from '../renderer/store'
import Menu from './menu'
import Prompt from './utils/prompt'
import { Prerequisite, OpenTerminal } from './utils/commands'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

const baseURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/`
  : `file://${__dirname}/index.html`

Prompt.setBaseUrl(baseURL)

const winURL = `${baseURL}#${VuexStore.state.Global.lastPageVisited}`

let tray
let trayMenu
let window

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

if (!Prerequisite.fulfill()) {
  app.quit()
} else {
  app.dock.hide()
}

app.on('ready', () => {
  createTray()
  createWindow()
})

const getWindowPosition = () => {
  const windowBounds = window.getBounds()
  const trayBounds = tray.getBounds()

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height)

  return {x: x, y: y}
}

const createTray = () => {
  tray = new Tray(path.join(__static, 'appIcon.png'))
  trayMenu = new Menu(newMenu => {
    trayMenu = newMenu
  })
  tray.on('click', toggleWindow)
  // tray.on('click', () => tray.popUpContextMenu(trayMenu))
  tray.on('right-click', () => tray.popUpContextMenu(trayMenu))
  // tray.on('double-click', () => tray.popUpContextMenu(trayMenu))
}

const createWindow = () => {
  window = new BrowserWindow({
    width: 350,
    height: 500,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      // Prevents renderer process code from not running when window is hidden
      backgroundThrottling: false
    }
  })

  window.loadURL(winURL)

  window.on('blur', () => {
    if (webContents.getAllWebContents().filter(x => (x.browserWindowOptions || {}).title === 'Prompt').length > 0) return
    if (window.webContents.isDevToolsOpened()) return
    window.hide()
  })
}

const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide()
  } else {
    const position = getWindowPosition()
    window.setPosition(position.x, position.y, false)
    window.show()
    window.focus()
  }
}

VuexStore.subscribe(({ type, payload }) => {
  switch (type) {
    case 'replayRecentHistory':
      if (payload) {
        const e = payload
        switch (true) {
          case e.type === 'command' && e.class === 'OpenTerminal':
            OpenTerminal[e.func](...e.args)
            break
          default:
            break
        }
      }
      break
    default:
      break
  }
})
