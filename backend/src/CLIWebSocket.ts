import { WEBSOCKET_URL } from './constants'
import Logger from './Logger'
import WebSocket from 'ws'

type ICallback = (payload: IPayload) => void

class CLIWebSocket {
  private ws: any
  private reconnect: boolean = true
  private reconnectDelay: number = 1000
  private onMessageReceived: { [key: string]: ICallback } = {}

  emit(type: string, data: any) {
    const payload = { ...data, type }
    Logger.info('CLI WEBSOCKET EMIT', { payload })
    this.ws.send(JSON.stringify(payload))
  }

  on(type: string, callback: ICallback) {
    this.onMessageReceived[type] = callback
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(WEBSOCKET_URL)
      Logger.info('CLI WEBSOCKET START')

      this.ws.on('close', (code: number, reason: string) => {
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

        Logger.info('CLI WEBSOCKET RECEIVE', { payload })

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
