import app from '.'
import lan from './LAN'
import CLI from './CLI'
import cli from './cliInterface'
import Logger from './Logger'
import SocketIO from 'socket.io'
import EventRelay from './EventRelay'
import Connection from './Connection'
import binaryInstaller from './binaryInstaller'
import electronInterface from './electronInterface'
import CLIWebSocket from './CLIWebSocket'
import environment from './environment'
import Installer from './Installer'
import EventBus from './EventBus'
import server from './server'
import user from './User'
import debug from 'debug'

const d = debug('r3:backend:Server')

export default class Controller {
  private uiIO: SocketIO.Server
  private cliWS: CLIWebSocket

  constructor(uiIO: SocketIO.Server, cliWS: CLIWebSocket) {
    this.uiIO = uiIO
    this.cliWS = cliWS

    EventBus.on(server.EVENTS.authenticated, this.authenticated)

    let eventNames = [
      ...Object.values(user.EVENTS),
      ...Object.values(Installer.EVENTS),
      ...Object.values(Connection.EVENTS),
      // ...Object.values(ConnectionPool.EVENTS),
      ...Object.values(lan.EVENTS),
      ...Object.values(CLI.EVENTS),
      ...Object.values(electronInterface.EVENTS),
    ]
    new EventRelay(eventNames, EventBus, this.uiIO.sockets)
  }

  authenticated = (socket: SocketIO.Socket) => {
    this.bindUi(socket)
    this.bindCLI()
    // send the secure data
    this.syncBackend()
  }

  bindUi = (socket: SocketIO.Socket) => {
    socket.on('user/sign-out', user.signOut)
    socket.on('user/quit', this.quit)
    socket.on('service/connect', this.connect)
    socket.on('service/disconnect', this.disconnect)
    socket.on('service/forget', this.forget)
    socket.on('binaries/install', this.installBinaries)
    socket.on('app/open-on-login', this.openOnLogin)
    socket.on('init', this.syncBackend)
    socket.on('pool', this.connections)
    socket.on('connection', this.connection)
    socket.on('targets', this.targets)
    socket.on('device', this.device)
    socket.on('scan', this.scan)
    socket.on('interfaces', this.interfaces)
    // socket.on('freePort', this.freePort)
    socket.on('restart', this.restart)
    socket.on('uninstall', this.uninstall)
  }

  bindCLI = () => {
    this.cliWS.onConnect = () => console.log('onConnect')
    this.cliWS.onClose = () => console.log('onClose')
    this.cliWS.onError = () => console.warn('onError')
    this.cliWS.on('GetConnections', (response: IPayload) => {
      Logger.info('socket.on-GetConnections', { response: response.data })
    })
    this.cliWS.on('SetConnections', (response: IPayload) => {
      Logger.info('socket.on-SetConnections', { response: response.data })
    })
    this.cliWS.on('GetAuth', (response: IPayload) => {
      Logger.info('socket.on-GetAuth', { response: response.data })
    })
    this.cliWS.on('SetAuth', (response: IPayload) => {
      Logger.info('socket.on-SetAuth', { response: response.data })
    })
    this.cliWS.on('Forget', (response: IPayload) => {
      Logger.info('socket.on-Forget', { response: response.data })
    })
  }

  syncBackend = async () => {
    this.uiIO.emit('targets', cli.data.targets)
    this.uiIO.emit('device', cli.data.device)
    this.uiIO.emit('scan', lan.data)
    this.uiIO.emit('interfaces', lan.interfaces)
    this.uiIO.emit('admin', (cli.data.admin && cli.data.admin.username) || '')
    this.uiIO.emit(lan.EVENTS.privateIP, lan.privateIP)
    this.uiIO.emit('os', environment.simplesOS)
    this.cliWS.send('GetConnections', [])
    // this.io.emit(ConnectionPool.EVENTS.updated, this.pool.toJSON())
    // this.io.emit(ConnectionPool.EVENTS.freePort, this.pool.freePort)
  }

  targets = async (result: ITarget[]) => {
    await cli.set('targets', result)
    this.uiIO.emit('targets', cli.data.targets)
  }

  device = async (result: IDevice) => {
    await cli.set('device', result)
    this.uiIO.emit('device', cli.data.device)
    this.uiIO.emit('targets', cli.data.targets)
  }

  interfaces = async () => {
    await lan.getInterfaces()
    this.uiIO.emit('interfaces', lan.interfaces)
  }

  scan = async (interfaceName: string) => {
    await lan.scan(interfaceName)
    this.uiIO.emit('scan', lan.data)
  }

  // freePort = async () => {
  //   await this.pool.nextFreePort()
  //   this.io.emit('nextFreePort', this.pool.freePort)
  // }

  connections = () => {
    d('List connections')
    this.cliWS.send('GetConnections', [])
    // this.io.emit('pool', this.pool.toJSON())
  }

  connection = async (connection: IConnection) => {
    d('Connection set', connection)
    this.cliWS.send('SetConnections', [connection])
    // await this.pool.set(connection)
  }

  connect = async (connection: IConnection) => {
    Logger.info('CONNECT', { connection })
    d('Connect:', connection)
    this.cliWS.send('SetConnections', [connection])
    this.cliWS.send('GetConnections', [])
    // await this.pool.start(connection)
  }

  disconnect = async (connection: IConnection) => {
    d('Disconnect Socket:', connection)
    this.cliWS.send('SetConnections', [])
    // await this.pool.stop(connection, false)
  }

  forget = async (connection: IConnection) => {
    d('Forget:', connection)
    this.cliWS.send('SetConnections', [])
    // await this.pool.forget(connection)
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
