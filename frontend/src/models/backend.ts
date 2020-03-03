import Controller from '../services/Controller'
import { createModel } from '@rematch/core'
import { DEFAULT_TARGET } from '../constants'
import { ApplicationState } from '../store'

type IBackendState = { [key: string]: any } & {
  connections: IConnection[]
  device: IDevice
  targets: ITarget[]
  scanData: IScanData
  interfaces: IInterface[]
  added?: ITarget
  error: boolean
  privateIP: ipAddress
  freePort?: number
  admin?: string
  update?: string
  cliError?: string
  os?: Ios
}

const state: IBackendState = {
  connections: [],
  device: DEFAULT_TARGET,
  targets: [],
  scanData: { wlan0: { data: [], timestamp: 0 } },
  interfaces: [],
  added: undefined,
  error: false,
  privateIP: '',
  freePort: undefined,
  admin: undefined,
  update: undefined,
  cliError: undefined,
  os: undefined,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    add(connection: IConnection, rootState: any) {
      const { connections } = rootState.backend
      connections.push(connection)
      Controller.emit('connections', connections)
    },
    update(connection: IConnection, rootState: any) {
      const { connections } = rootState.backend

      connections.some((c: IConnection, index: number) => {
        if (c.id === connection.id) {
          connections[index] = connection
          return true
        }
        return false
      })

      Controller.emit('connections', connections)
    },
    remove(connection: IConnection, rootState: any) {
      const { connections } = rootState.backend
      Controller.emit(
        'connections',
        connections.filter((c: IConnection) => c.id !== connection.id)
      )
    },
  }),
  reducers: {
    set(state: IBackendState, { key, value }: { key: string; value: any }) {
      state[key] = value
    },
    setConnection(state: IBackendState, connection: IConnection) {
      state.connections.some((c, index) => {
        if (c.id === connection.id) {
          state.connections[index] = connection
          return true
        }
        return false
      })
    },
  },
})
