import app from '.'
import lan from './LAN'
import CLI from './CLI'
import cli from './cliInterface'
import cliWS from './CLIWebSocket'
import Logger from './Logger'
import SocketIO from 'socket.io'
import EventRelay from './EventRelay'
import Connection from './Connection'
import CLIController from './CLIController'
import binaryInstaller from './binaryInstaller'
import electronInterface from './electronInterface'
import environment from './environment'
import Installer from './Installer'
import EventBus from './EventBus'
import server from './server'
import user from './User'
import debug from 'debug'

const d = debug('Controller')

export default class Controller {
  private uiWS: SocketIO.Server

  constructor(uiWS: SocketIO.Server) {
    this.uiWS = uiWS

    new CLIController(uiWS)

    EventBus.on(server.EVENTS.authenticated, this.authenticated)

    let eventNames = [
      ...Object.values(user.EVENTS),
      ...Object.values(Installer.EVENTS),
      ...Object.values(Connection.EVENTS),
      ...Object.values(lan.EVENTS),
      ...Object.values(CLI.EVENTS),
      ...Object.values(electronInterface.EVENTS),
      // ...Object.values(ConnectionPool.EVENTS),
    ]
    new EventRelay(eventNames, EventBus, this.uiWS.sockets)
  }

  authenticated = async (socket: SocketIO.Socket) => {
    this.bindUi(socket)

    // send the secure data
    this.syncBackend()
  }

  bindUi = (socket: SocketIO.Socket) => {
    socket.on('user/sign-out', user.signOut)
    socket.on('user/quit', this.quit)
    socket.on('binaries/install', this.installBinaries)
    socket.on('app/open-on-login', this.openOnLogin)
    socket.on('init', this.syncBackend)
    socket.on('connections', this.connections)
    socket.on('targets', this.targets)
    socket.on('device', this.device)
    socket.on('scan', this.scan)
    socket.on('interfaces', this.interfaces)
    socket.on('restart', this.restart)
    socket.on('uninstall', this.uninstall)
    socket.on('freePort', this.freePort)
  }

  syncBackend = async () => {
    this.uiWS.emit('targets', cli.data.targets)
    this.uiWS.emit('device', cli.data.device)
    this.uiWS.emit('scan', lan.data)
    this.uiWS.emit('interfaces', lan.interfaces)
    this.uiWS.emit('admin', (cli.data.admin && cli.data.admin.username) || '')
    this.uiWS.emit(lan.EVENTS.privateIP, lan.privateIP)
    this.uiWS.emit('os', environment.simplesOS)
  }

  connections = (connections: IConnection[]) => {
    d('Connection set', connections)
    // TODO merge into array and send

    cliWS.emit('connections', {
      connections: connections.map(connection => ({
        ...connection,
        uid: connection.id,
        active: connection.online,
        online: connection.active,
        hostname: connection.host,
        retry: connection.autoStart,
        failover: true,
        metadata: { deviceID: connection.deviceID },
      })),
    })
  }

  freePort = (connection: IConnection) => {
    Logger.info('FREEPORT', {
      ip: connection.host,
      port: connection.port,
    })
    cliWS.emit('freePort', {
      ip: connection.host,
      port: connection.port,
    })
  }

  targets = async (result: ITarget[]) => {
    await cli.set('targets', result)
    this.uiWS.emit('targets', cli.data.targets)
  }

  device = async (result: IDevice) => {
    await cli.set('device', result)
    this.uiWS.emit('device', cli.data.device)
    this.uiWS.emit('targets', cli.data.targets)
  }

  interfaces = async () => {
    await lan.getInterfaces()
    this.uiWS.emit('interfaces', lan.interfaces)
  }

  scan = async (interfaceName: string) => {
    await lan.scan(interfaceName)
    this.uiWS.emit('scan', lan.data)
  }

  quit = () => {
    Logger.info('WEB UI QUIT')
    app.quit()
  }

  restart = () => {
    Logger.info('WEB UI AUTOUPDATE RESTART')
    app.restart()
  }

  uninstall = async () => {
    Logger.info('UNINSTALL INITIATED')
    user.signOut()
    // await this.pool.reset()
    await cli.delete()
    await cli.unInstall()
    await binaryInstaller.uninstall()
    this.quit()
  }

  installBinaries = async () => {
    await binaryInstaller.install()
  }

  openOnLogin = (open: boolean) => {
    d('Open on login:', open)
    EventBus.emit(electronInterface.EVENTS.openOnLogin, open)
  }
}
