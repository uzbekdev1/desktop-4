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

  authenticated = async (socket: SocketIO.Socket) => {
    await cliWS.start()

    this.bindUi(socket)
    this.bindCLI()

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

  bindCLI = () => {
    cliWS.on('connections', this.cliConnections)
    cliWS.on('freePort', this.cliFreePort)
    cliWS.on('connectdLogstream', this.cliLogStream)
    cliWS.on('state', this.cliState)
  }

  syncBackend = async () => {
    this.uiIO.emit('targets', cli.data.targets)
    this.uiIO.emit('device', cli.data.device)
    this.uiIO.emit('scan', lan.data)
    this.uiIO.emit('interfaces', lan.interfaces)
    this.uiIO.emit('admin', (cli.data.admin && cli.data.admin.username) || '')
    this.uiIO.emit(lan.EVENTS.privateIP, lan.privateIP)
    this.uiIO.emit('os', environment.simplesOS)
    cliWS.emit('state')
    cliWS.emit('freePort', { ip: '127.0.0.1', port: 30000 })
  }

  cliConnections = ({ connections }: { connections: IConnection[] }) => {
    connections = connections || []
    Logger.info('CLI WEBSOCKET RECEIVE CONNECTIONS', { connections })
    const adaptedConnections: IConnection[] = connections.map((c: any) => ({
      ...c,
      createdTime: c.createdTime || Date.now(),
      startTime: c.startTime || Date.now(),
      id: c.uid,
      active: c.online,
      online: c.active,
      host: c.hostname,
      autoStart: c.retry,
      ...c.metadata,
    }))
    this.uiIO.emit('connections', adaptedConnections)
  }

  cliFreePort = (response: any) => {
    Logger.info('CLI WEBSOCKET RECEIVE FREEPORT', { ...response })
    this.uiIO.emit('freePort', response.port)
  }

  cliLogStream = (response: ILogStream) => {
    const { connectdLine, uid } = response
    let channel
    if (!connectdLine) Logger.warn('CLI WEBSOCKET LOG STREAM EMPTY')
    else if (connectdLine.startsWith('!!status')) channel = ''
    else if (connectdLine.startsWith('!!throughput')) channel = 'throughput'
    else {
      channel = 'logStream'
      Logger.warn('CLI WEBSOCKET LOG STREAM', { connectdLine, uid })
    }

    if (channel) this.uiIO.emit(channel, { uid, connectdLine })
  }

  cliState = (response: { state: ICliState }) => {
    this.cliConnections(response.state)
    // @TODO -> use the username and authhash from cli instead of saving and managing in desktop
    // @TODO -> use the device and services from here instead of reading from config files
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
