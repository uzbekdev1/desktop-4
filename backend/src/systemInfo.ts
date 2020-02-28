import environment from './environment'
import cli from './cliInterface'
import lan from './LAN'
import os from 'os'
import fs from 'fs'

export default async function systemInfo<ILookup>() {
  const { birthtime } = fs.statSync('.')
  await lan.getInterfaces()

  return {
    name: cli.data.device.name,
    privateIP: lan.privateIP,
    created: birthtime.toLocaleString(),
    platform: environment.platform,
    arch: os.arch(),
    interfaces: lan.interfaces,
  }
}
