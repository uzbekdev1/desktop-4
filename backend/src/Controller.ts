import app from '.'
import lan from './LAN'
import CLI from './CLI'
import cli from './cliInterface'
import cliWS from './CLIWebSocket'
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

  constructor(uiIO: SocketIO.Server) {
    this.uiIO = uiIO

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
    cliWS.on('connections', this.connectionsEmit)
    cliWS.on('freePort', this.freePortEmit)

    // cliWS.on('GetAuth', (response: IPayload) => {
    //   Logger.info('socket.on-GetAuth', { response: response.data })
    // })
    // cliWS.on('SetAuth', (response: IPayload) => {
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
    cliWS.emit('freePort', { ip: '127.0.0.1', port: 30000 })
    cliWS.emit('connections', { connections: [] })
  }

  connectionsEmit = (response: any) => {
    Logger.info('CLI WEBSOCKET RECEIVE CONNECTIONS', { response })
    this.uiIO.emit('connections', response.connections)
    // let sample = {
    //   response: {
    //     type: 'connections',
    //     connections: [
    //       {
    //         uid: '80:00:00:00:01:00:53:AB',
    //         name: 'Dragon_Craft - Minecraft',
    //         restriction: '0.0.0.0',
    //         hostname: '127.0.0.1',
    //         retry: true,
    //         failover: true,
    //         owner: 'jamie@remote.it',
    //         error: { code: 0, message: '', timestamp: 0 },
    //         metadata: { deviceID: '80:00:00:00:01:00:53:A2' },
    //       },
    //     ],
    //   },
    // }
  }

  freePortEmit = (response: any) => {
    Logger.info('CLI WEBSOCKET RECEIVE FREEPORT', { ...response })
    this.uiIO.emit('freePort', response.port)
  }

  connection = (connection: IConnection) => {
    d('Connection set', connection)
    // TODO merge into array and send

    cliWS.emit('connections', {
      connections: [
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
      ],
    })
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
    cliWS.emit('connections', [])
  }

  forget = (connection: IConnection) => {
    d('Forget:', connection)
    // TODO remove iconnection from array and send
    cliWS.emit('connections', [])
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
