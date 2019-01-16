'use strict'

import os from 'os'
import {
  exec
} from 'child_process'

let child
let platform = 'unknown'

switch (os.platform()) {
  case 'darwin':
    platform = 'mac'
    break
  case 'win32':
    platform = 'win'
    break
  default:
    platform = 'linux'
}

const openCmd = {
  mac: cmd => `osascript -e '
    try
      tell application "iTerm2"
        set newWindow to (create window with default profile)
        tell current session of newWindow
          write text "${cmd.replace(/"/g, '\\"')}"
        end tell
      end tell
    on error err_msg number err_num
      tell application "Terminal" to activate 
        tell application "System Events" to tell process "Terminal" to keystroke "t" using command down
          tell application "Terminal" to do script "${cmd.replace(/"/g, '\\"')}" in selected tab of the front window
    end try'`
}

const defaultCb = {
  onStdout: () => {},
  onStderr: () => {},
  onError: () => {},
  onExit: () => {}
}

export const open = (cmd, option = {}, cb = defaultCb) => {
  if (typeof cb === 'object' && cb !== null) {
    cb = Object.assign({}, defaultCb, cb)
  } else if (typeof cb === 'function') {
    cb = Object.assign({}, defaultCb, {
      onStdout: cb
    })
  }

  child = exec(openCmd[platform](cmd), option, (error, stdout, stderr) => {
    if (error) {
      cb.onError(error)
      return
    }

    cb.onStdout(stdout)
    cb.onStderr(stderr)
  })

  child.on('close', (code, signal) => {
    // The 'close' event is emitted when the stdio streams of a child process have been closed. This is distinct from the 'exit' event, since multiple processes might share the same stdio streams.
    cb.onExit(code, signal)
  })
}

export default {
  open
}
