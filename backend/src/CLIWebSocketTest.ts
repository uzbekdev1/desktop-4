import cliWS from './CLIWebSocket'

start()

async function start() {
  await cliWS.start()
  cliWS.emit('freePort', { ip: '127.0.0.1', port: 3000 })
}
