declare global {
  type SocketAction =
    //socket auth
    | 'authentication'

    // user/auth
    | 'user/check-sign-in'
    | 'user/sign-in'
    | 'user/sign-out'
    | 'user/quit'

    // binaries
    | 'binaries/install'

    // all connections update
    | 'pool'

    // connections update
    | 'connections'

    // App/settings
    | 'app/open-on-login'

    // Backend
    | 'init'
    | 'targets'
    | 'device'
    | 'scan'
    | 'interfaces'
    | 'freePort'
    | 'restart'
    | 'uninstall'

  type SocketEvent =
    // built-in events
    | 'connect'
    | 'disconnect'
    | 'connect_error'

    // user/auth
    | 'signed-out'
    | 'signed-in'
    | 'sign-in/error'

    // connection
    | 'connection'
    | 'throughput'

    // binary
    | 'binary/install/start'
    | 'binary/install/progress'
    | 'binary/install/error'
    | 'binary/installed'
    | 'binary/not-installed'

    // jump
    | 'targets'
    | 'device'
    | 'scan'
    | 'interfaces'
    | 'privateIP'

  type BinaryName = 'connectd' | 'muxer' | 'demuxer'

  type Ios = 'mac' | 'windows' | 'linux' | 'rpi'

  interface InstallationInfo {
    name: string
    path: string
    version: string
  }

  interface UserCredentials {
    username: string
    authHash: string
  }

  interface IConnection {
    id: string
    name: string
    port?: number
    restriction?: ipAddress // Restriction IP address
    host?: ipAddress // Bind address
    disabled?: boolean // stop/start connection keep offline
    autoStart?: boolean // rename RETRY
    failover?: boolean // should fail over to proxy

    // May not need
    restart?: boolean // command to restart an online connection if wanted

    // state
    active?: boolean // connection active state
    connecting?: boolean // connection state
    overProxy?: boolean // connection state
    startTime?: number // unix timestamp connection start time
    endTime?: number // unix timestamp connection close time

    createdTime?: number // unix timestamp track for garbage cleanup
    owner: string
    error?: ISimpleError

    pid?: number // deprecated

    // Metadata
    online: boolean // service online state
    deviceID: string
    username?: string // support for launching where username could be saved
    // deepLink?: string
  }

  interface ConnectionLookup {
    [id: string]: IConnection
  }
  interface ConnectionMessage {
    connection: IConnection
    raw?: string
    extra?: any
  }

  interface ConnectionErrorMessage {
    code?: number
    error: string
    connection: IConnection
  }

  type SocketEmit = (name: string, ...args: any[]) => any

  interface ITarget {
    hostname: string //     proxy_dest_ip      service ip to forward
    hardwareID?: string
    uid: string //          UID
    name: string
    secret?: string //      password
    port: number //         proxy_dest_port    service port
    type: number //         application_type   service type
  }

  interface IDevice extends ITarget {}

  type IScan = [string, [number, string][]] // address, port, type string

  type IScanData = {
    [networkName: string]: {
      timestamp: number
      data: IScan[]
    }
  }

  type IScanDataRaw = {
    host: string
    name: string
    port: number
    protocol: string
  }

  type ISimpleError = { code?: number; message: string; timestamp?: number }

  type ILog = { [id: string]: string[] }

  type IInterface = { [key: string]: any }

  type IInterfaceType = 'Wired' | 'Wireless' | 'FireWire' | 'Thunderbolt' | 'Bluetooth' | 'Other'

  type ipAddress = string // namespace to indicate if expecting an ip address

  type ipClass = 'A' | 'B' | 'C'

  type IEvents = { [event: string]: string }

  type ILookup = { [key: string]: any }

  type IPayload = {
    type: string
    hasError?: boolean
    errorMessage?: string
  }

  interface ILogStream extends IPayload {
    uid: string
    connectdLine: string
  }

  interface ICliState extends IPayload {
    auth: UserCredentials
    connections: IConnection[]
    registrationKey: string
    services: ITarget[]
    device: IDevice
  }
}

export {}
