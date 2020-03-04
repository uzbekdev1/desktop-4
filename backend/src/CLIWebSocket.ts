import { WEBSOCKET_URL } from './constants'
import Logger from './Logger'
import WebSocket from 'ws'
import cli from './cliInterface'

type ICallback = (payload: any) => void

type ICliChannel =
  | 'scan'
  | 'version'
  | 'freePort'
  | 'device'
  | 'auth'
  | 'services'
  | 'connections'
  | 'state'
  | 'UnknownMessage'
  | 'connectdLogstream'

class CLIWebSocket {
  private ws?: WebSocket
  private reconnectDelay: number = 10000
  private onMessageReceived: { [key: string]: ICallback } = {}
  private connectTime: number

  constructor() {
    this.connectTime = Date.now()
  }

  emit(type: ICliChannel, data?: any) {
    const payload = { ...data, type }
    Logger.info('CLI WEBSOCKET EMIT', { payload, wsOpen: this.ws?.OPEN })
    if (this.ws?.OPEN) this.ws.send(JSON.stringify(payload))
  }

  on(type: ICliChannel, callback: ICallback) {
    this.onMessageReceived[type] = callback
  }

  async start() {
    // start cli websocket service
    await cli.signIn(true /* admin */)

    try {
      if (!this.ws) await this.connect()
    } catch (error) {
      Logger.warn('CLI WEBSOCKET FAILURE', { error })
      this.reconnect()
    }
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(WEBSOCKET_URL)
      Logger.info('CLI WEBSOCKET START')

      this.ws.on('close', (code: number, reason: string) => {
        Logger.warn('CLI WEBSOCKET DISCONNECT', { code, reason })
        if (code !== 1000) reject('CLI WEBSOCKET DISCONNECT')
      })

      this.ws.on('open', (response: any) => {
        Logger.info('CLI WEBSOCKET CONNECT', { response })
        resolve()
      })

      this.ws.on('message', (response: any) => {
        const payload = JSON.parse(response)

        if (payload.type !== 'connectdLogstream') Logger.info('CLI WEBSOCKET RECEIVE', { payload })

        if (payload.hasError) {
          Logger.warn(payload.errorMessage)
        }

        if (typeof this.onMessageReceived[payload.type] === 'function') {
          this.onMessageReceived[payload.type](payload)
        }
      })

      this.ws.on('error', (error: Error) => {
        Logger.warn('CLI WEBSOCKET ERROR', { error })
        reject(error.message)
      })
    })
  }

  reconnect() {
    Logger.info('CLI WEBSOCKET RECONNECT')
    this.connectTime = Date.now()
    setTimeout(() => {
      if (this.ws) this.ws.removeAllListeners()
      delete this.ws
      this.start()
    }, this.reconnectDelay)
  }
}

export default new CLIWebSocket()
