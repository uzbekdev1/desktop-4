import WebSocket from 'ws'

type ICallback = (payload: IPayload) => void

export default class CLIWebSocket {
  onConnect?: ICallback
  onClose?: ICallback
  onError?: ICallback
  onDataReceived?: ICallback

  private _ws: any
  private _url: string
  private _reconnect: boolean = true
  private _delayInMsBeforeReconnect: number = 1000
  private _onMessageReceived: { [key: string]: ICallback } = {}

  constructor(url: string) {
    this._url = url
    this.setUpConnection()
  }

  public emit(type: string, data: any) {
    this._ws.send(JSON.stringify({ ...data, type }))
  }

  public on(type: string, callback: ICallback) {
    this._onMessageReceived[type] = callback
  }

  private setUpConnection() {
    this._ws = new WebSocket(this._url)

    this._ws.onclose = (response: any) => {
      if (typeof this.onClose === 'function') {
        this.onClose(response)
      }

      if (this._reconnect) {
        setTimeout(() => this.setUpConnection, this._delayInMsBeforeReconnect)
      }
    }

    this._ws.onopen = (response: any) => {
      if (typeof this.onConnect === 'function') {
        this.onConnect(response)
      }
    }

    // WHEN data received, then de-serialize and pass up the chain
    this._ws.onmessage = (response: any) => {
      const data = JSON.parse(response.data)

      console.log('CLI WEBSOCKET MESSAGE', data)

      if (data.hasError) {
        console.error(data.errorMessage)
      }

      if (typeof this.onDataReceived === 'function') {
        this.onDataReceived(data)
      }

      if (typeof this._onMessageReceived[data.type] === 'function') {
        this._onMessageReceived[data.type](data)
      }
    }

    // IF errors just notify
    this._ws.onerror = (response: any) => {
      if (typeof this.onError === 'function') {
        this.onError(response)
      }
    }
  }
}
