import React from 'react'
import { IService } from 'remote.it'
import { Dispatch } from '../../store'
import { useDispatch } from 'react-redux'
import { DynamicButton } from '../DynamicButton'
import { newConnection } from '../../helpers/connectionHelper'
import { Color } from '../../styling'
import { Fade } from '@material-ui/core'

export type ConnectButtonProps = {
  connection?: IConnection
  service?: IService
  size?: 'icon' | 'medium' | 'small'
  color?: Color
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  connection,
  service,
  size = 'medium',
  color = 'success',
}) => {
  const { backend } = useDispatch<Dispatch>()
  const hidden = (connection && connection.active) || !service || service.state !== 'active'
  const connecting = !!(connection && connection.pid && !connection.active)
  const connect = () =>
    connection
      ? backend.update({ ...connection, disabled: false })
      : backend.add(newConnection(service, { disabled: false }))

  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton
          title="Connect"
          icon="exchange"
          loading={connecting}
          color={color}
          disabled={connecting}
          size={size}
          onClick={connect}
        />
      </div>
    </Fade>
  )
}
