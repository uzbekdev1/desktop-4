import debug from 'debug'
import Controller from './Controller'
import remoteitInstaller from './remoteitInstaller'
import binaryInstaller from './binaryInstaller'
import environment from './environment'
import Logger from './Logger'
import user from './User'
import server from './server'
import EventBus from './EventBus'

const d = debug('r3:backend:Application')

export default class Application {
  public electron?: any

  constructor() {
    Logger.info('Application starting up!')
    this.constructorSync()
  }

  async constructorSync() {
    environment.setElevatedState()
    await this.install()
    server.start()
    this.startHeartbeat()

    if (server.io) new Controller(server.io)

    EventBus.on(user.EVENTS.signedIn, this.check)
  }

  quit() {
    if (this.electron) this.electron.app.quit()
  }

  restart() {
    if (this.electron) this.electron.autoUpdater.restart()
  }

  recapitate(head: any) {
    this.electron = head
  }

  private install = async () => {
    const install = !(await remoteitInstaller.isCurrent(true))
    if (install) {
      Logger.info('INSTALLING BINARIES')
      await binaryInstaller.install()
    }
  }

  private startHeartbeat = () => {
    let count = 0
    setInterval(() => {
      this.check(count++)
      if (count > 999) count = 0
    }, 1000 * 60) // 1bpm
  }

  private check = (count: number) => {
    if (!user.signedIn) return

    // check every 5 minutes
    if (count % 5 === 0) {
      this.electron && this.electron.check()
      remoteitInstaller.check()
    }
  }
}
