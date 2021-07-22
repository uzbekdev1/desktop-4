import Logger from './Logger'
import EventBus from './EventBus'
const child_process = require('child_process')

const EVENTS = {
  notInstalled: 'required/app',
  minimizeWindows: 'windows/minimize',
}

/* 
  @FIXME - these commands should all use the Command.ts class
*/

export const openCMDforWindows = (launchApp: ILaunchApp) => {
  if (launchApp.path) return launchApplication(launchApp.path, launchApp)

  Logger.info('LAUNCH APP', { launchApp })
  const process = child_process.exec(`DIR /S ${launchApp.application}.exe /B`, { cwd: 'C:\\' })

  process.stdout.on('data', (data: string) => {
    Logger.info(`stdout: ${data}`)
    Logger.info(`stdout: ${data.replace(`\\${launchApp.application}.exe`, ``).replace(/\\/g, '\\\\')}`)
    const cwd = data.replace(`\\${launchApp.application}.exe`, ``).replace(/\\/g, '\\\\').trim()
    EventBus.emit(EVENTS.notInstalled, { install: 'none', loading: false, path: cwd })
    launchApplication(cwd, launchApp)
  })

  process.stderr.on('data', (data: string) => {
    Logger.info(`stderr: ${data}`)
  })

  process.on('close', (code: any) => {
    Logger.info(`child process exited with code ${code}`)
  })
}

export const checkAppForWindows = (application: string) => {
  let foundData = false
  const options = {
    timeout: 3000,
    killSignal: 'SIGKILL',
  }
  const process = child_process.exec(`DIR /S ${application}.exe /B`, { ...options, cwd: 'C:\\' })

  process.stdout.on('data', (data: string) => {
    foundData = true
    Logger.info(`stdout: ${data}`)
    if (!data.trim()) {
      EventBus.emit(EVENTS.notInstalled, { install: `${application}`, loading: false })
    } else {
      EventBus.emit(EVENTS.notInstalled, { install: `none`, loading: false })
    }
  })

  process.stderr.on('data', (data: string) => {
    Logger.error(`stderr: ${data}`)
  })

  process.on('close', (code: any) => {
    Logger.info(`child process exited with code test ${code}`)
    if (!foundData) {
      EventBus.emit(EVENTS.notInstalled, { install: `${application}`, loading: false })
    }
  })
}

function launchApplication(cwd: string, launchApp: ILaunchApp) {
  let command = ''
  switch (launchApp.application) {
    case 'putty':
      command = `start ${launchApp.application}.exe -ssh ${launchApp.host} ${launchApp.port}`
      break
    case 'vncviewer':
      command = `start ${launchApp.application}.exe -Username ${launchApp.username} ${launchApp.host}:${launchApp.port}`
      break
    case 'remoteDesktop':
      command = `cmdkey /generic:${launchApp.host} /user:${launchApp.username} && 
        mstsc /v: ${launchApp.host} &&
        cmdkey /delete:TERMSRV/${launchApp.host}`
      break
  }
  child_process.exec(`${command}`, { cwd }, (error: any) => {
    error && Logger.error(`error: ${error}`)
  })
}

export default { EVENTS }
