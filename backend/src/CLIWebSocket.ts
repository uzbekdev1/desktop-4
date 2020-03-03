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
  private ws: any
  private reconnect: boolean = true
  private reconnectDelay: number = 5000
  private onMessageReceived: { [key: string]: ICallback } = {}

  emit(type: ICliChannel, data?: any) {
    const payload = { ...data, type }
    Logger.info('CLI WEBSOCKET EMIT', { payload })
    this.ws.send(JSON.stringify(payload))
  }

  on(type: ICliChannel, callback: ICallback) {
    this.onMessageReceived[type] = callback
  }

  async start() {
    // start cli websocket service
    await cli.signIn(true /* admin */)

    try {
      await this.connect()
    } catch (e) {
      Logger.warn('CLI WEBSOCKET FAILURE', e)
    }
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(WEBSOCKET_URL)
      Logger.info('CLI WEBSOCKET START')

      this.ws.on('close', (code: number, reason: string) => {
        reject('Failed to open WebSocket to CLI')
        Logger.warn('CLI WEBSOCKET DISCONNECT', { code, reason })

        if (code !== 1000 && this.reconnect) {
          Logger.info('CLI WEBSOCKET RECONNECT')

          setTimeout(() => {
            this.ws.removeAllListeners()
            this.start()
          }, this.reconnectDelay)
        }
      })

      this.ws.on('open', (response: any) => {
        Logger.info('CLI WEBSOCKET CONNECT', { response })
        resolve()
      })

      // WHEN data received, then de-serialize and pass up the chain
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

      // IF errors just notify
      this.ws.on('error', (error: Error) => {
        Logger.warn('CLI WEBSOCKET ERROR', { error })
        reject(error)
      })
    })
  }
}

export default new CLIWebSocket()
