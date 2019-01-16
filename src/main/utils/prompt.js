'use strict'

import {
  BrowserWindow,
  ipcMain
} from 'electron'

export default class {
  static setBaseUrl (baseUrl) {
    this.baseUrl = `${baseUrl}#prompt`
  }

  static open (option = {}) {
    return new Promise((resolve) => {
      const sessionId = Math.random().toString(36).substring(2, 15)
      option = ((option && typeof option === 'object' && option.constructor === Object) ? option : {})
      const width = option.width || 450
      const height = option.height || 270
      delete option.width
      delete option.height
      const validatedOption = Object.assign(
        option,
        { sessionId }
      )

      const promptWindow = new BrowserWindow({
        title: typeof validatedOption.title === 'string' ? validatedOption.title : 'Prompt',
        width,
        height,
        backgroundColor: '#000000',
        show: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        resizable: false,
        minimizable: false,
        maximizable: false
      })

      promptWindow.loadURL(this.baseUrl)

      promptWindow.webContents.on('did-finish-load', () => {
        promptWindow.webContents.send('electron-osx-prompt-settings', validatedOption)
      })

      promptWindow.once('ready-to-show', promptWindow.show)
      promptWindow.once('closed', () => {
        promptWindow.destroy()
        ipcMain.removeAllListeners(`electron-osx-prompt-return-value-${sessionId}`)
        resolve(null)
      })

      ipcMain.once(`electron-osx-prompt-return-value-${sessionId}`, (_, value) => {
        resolve(value)

        if (promptWindow) {
          promptWindow.close()
          promptWindow.destroy()
        }
      })
    })
  }
}
