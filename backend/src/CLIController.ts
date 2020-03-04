import cliWS from './CLIWebSocket'
import Logger from './Logger'
import SocketIO from 'socket.io'
import EventBus from './EventBus'
import user from './User'

export default class CLIController {
  private uiWS: SocketIO.Server

  constructor(uiWS: SocketIO.Server) {
    this.uiWS = uiWS
    EventBus.on(user.EVENTS.signedIn, this.signedIn)
  }

  signedIn = async () => {
    console.log('--------------------------------')
    console.log('SIGNED IN -> start cli websocket')
    console.log('--------------------------------')
    await cliWS.start()
    this.bindCLI()
    this.syncCLI()
  }

  bindCLI = () => {
    cliWS.on('connections', this.cliConnections)
    cliWS.on('freePort', this.cliFreePort)
    cliWS.on('connectdLogstream', this.cliLogStream)
    cliWS.on('state', this.cliState)
  }

  syncCLI = async () => {
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
    this.uiWS.emit('connections', adaptedConnections)
  }

  cliFreePort = (response: any) => {
    Logger.info('CLI WEBSOCKET RECEIVE FREEPORT', { ...response })
    this.uiWS.emit('freePort', response.port)
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

    if (channel) this.uiWS.emit(channel, { uid, connectdLine })
  }

  cliState = (response: { state: ICliState }) => {
    this.cliConnections(response.state)
    // @TODO -> use the username and authhash from cli instead of saving and managing in desktop
    // @TODO -> use the device and services from here instead of reading from config files
  }
}
