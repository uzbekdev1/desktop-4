import Logger from './Logger'
import EventBus from './EventBus'
import Command from './Command'

const EVENTS = {
  notInstalled: 'required/app',
  minimizeWindows: 'windows/minimize',
}

export const openCMDforWindows = async (launchApp: ILaunchApp) => {
  if (launchApp.path) return launchApplication(launchApp)
  Logger.info('LAUNCH APP', { launchApp })
  const commands = new Command({})
  commands.push(`where ${launchApp.application}.exe`)
  const result = await commands.exec()
  if (result) {
    try {
      if (result.includes('Command failed:')) {
        EventBus.emit(EVENTS.notInstalled, { install: `${launchApp.application}`, loading: false })
      } else {
        launchApplication(launchApp)
      }
    } catch (error) {
      Logger.warn('OPEN APP ON WINDOWS ERROR', { result, errorMessage: error.message.toString() })
    }
  }
}

export const checkAppForWindows = async (application: string) => {
  const commands = new Command({})
  commands.push(`cd c:\\`)
  commands.push(`where ${application}.exe`)
  const result = await commands.exec()
  Logger.info('CHECK APP EXISTS: ', { result })
  if (result.includes('Command failed:')) {
    EventBus.emit(EVENTS.notInstalled, { install: `${application}`, loading: false })
  } else {
    EventBus.emit(EVENTS.notInstalled, { install: `none`, loading: false })
  }
}

async function launchApplication(launchApp: ILaunchApp) {
  // use defaultTemplateCmd
  const commands = new Command({})
  switch (launchApp.application) {
    case 'putty':
      commands.push(`start ${launchApp.application}.exe -ssh ${launchApp.host} ${launchApp.port}`)
      break
    case 'vncviewer':
      commands.push(
        `start ${launchApp.application}.exe -Username ${launchApp.username} ${launchApp.host}:${launchApp.port}`
      )
      break
    case 'remoteDesktop':
      commands.push(`cmdkey /generic:${launchApp.host} /user:${launchApp.username}`)
      commands.push(`mstsc /v: ${launchApp.host}`)
      commands.push(`cmdkey /delete:TERMSRV/${launchApp.host}`)
      break
  }
  const result = await commands.exec()
  if (result) {
    try {
      const parsed = JSON.parse(result)
      return parsed.data
    } catch (error) {
      Logger.warn('LAUNCH APP PARSE ERROR', { result, errorMessage: error.message.toString() })
    }
  }
}

export default { EVENTS }
