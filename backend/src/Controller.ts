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

const d = debug('Controller')

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
      ...Object.values(lan.EVENTS),
      ...Object.values(CLI.EVENTS),
      ...Object.values(electronInterface.EVENTS),
      // ...Object.values(ConnectionPool.EVENTS),
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
    socket.on('connection', this.connection)
    socket.on('targets', this.targets)
    socket.on('device', this.device)
    socket.on('scan', this.scan)
    socket.on('interfaces', this.interfaces)
    socket.on('restart', this.restart)
    socket.on('uninstall', this.uninstall)
    socket.on('freePort', this.freePort)
  }

  bindCLI = () => {
    this.cliWS.onConnect = response => Logger.info('onConnect', { response })
    this.cliWS.onClose = () => Logger.info('onClose')
    this.cliWS.onError = error => Logger.warn('onError', { error })

    this.cliWS.on('connections', this.connectionsEmit)
    this.cliWS.on('freePort', this.freePortEmit)

    // this.cliWS.on('GetAuth', (response: IPayload) => {
    //   Logger.info('socket.on-GetAuth', { response: response.data })
    // })
    // this.cliWS.on('SetAuth', (response: IPayload) => {
    //   Logger.info('socket.on-SetAuth', { response: response.data })
    // })
  }

  syncBackend = async () => {
    this.uiIO.emit('targets', cli.data.targets)
    this.uiIO.emit('device', cli.data.device)
    this.uiIO.emit('scan', lan.data)
    this.uiIO.emit('interfaces', lan.interfaces)
    this.uiIO.emit('admin', (cli.data.admin && cli.data.admin.username) || '')
    this.uiIO.emit(lan.EVENTS.privateIP, lan.privateIP)
    this.uiIO.emit('os', environment.simplesOS)
    this.cliWS.emit('freePort', [])
    this.cliWS.emit('connections', [])
  }

  connectionsEmit = (response: IPayload) => {
    Logger.info('CLI WEBSOCKET RECEIVE CONNECTIONS', { response })
    this.uiIO.emit('connections', response.data)
  }

  freePortEmit = (response: IPayload) => {
    Logger.info('CLI WEBSOCKET RECEIVE FREEPORT', { response })
    this.uiIO.emit('freePort', response.data)
  }

  connection = (connection: IConnection) => {
    d('Connection set', connection)
    // TODO merge into array and send

    this.cliWS.emit('connections', [
      {
        uid: connection.id,
        name: connection.name,
        hostname: connection.host,
        disabled: connection.disabled,
        retry: connection.autoStart,
        failover: true,
        restriction: connection.restriction,
        owner: connection.owner,
        metadata: { deviceID: connection.deviceID },
      },
    ])
    this.cliWS.emit('connections', [])
  }

  connect = (connection: IConnection) => {
    Logger.info('CONNECT', { connection })
    d('Connect:', connection)
    // TODO make this change in frontend and emit connection
    connection.disabled = false
    this.connection(connection)
  }

  disconnect = (connection: IConnection) => {
    d('Disconnect Socket:', connection)
    // TODO update state and add disconnected connection
    this.cliWS.emit('connections', [])
  }

  forget = (connection: IConnection) => {
    d('Forget:', connection)
    // TODO remove iconnection from array and send
    this.cliWS.emit('connections', [])
  }

  freePort = (connection: IConnection) => {
    Logger.info('FREEPORT', {
      ip: connection.host,
      port: connection.port,
    })
    this.cliWS.emit('freePort', {
      ip: connection.host,
      port: connection.port,
    })
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
