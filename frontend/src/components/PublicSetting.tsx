import React from 'react'
import { Collapse } from '@material-ui/core'
import { setConnection } from '../helpers/connectionHelper'
import { IP_OPEN, IP_LATCH } from '../shared/constants'
import { InlineSelectSetting } from './InlineSelectSetting'
import { ListItemSetting } from './ListItemSetting'

export const PublicSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!connection) return null
  if (service.attributes.route === 'p2p') return null

  const disabled = connection.enabled
  const subLabel =
    connection.publicRestriction === IP_LATCH
      ? 'The connection will latch onto the first device to connect with IP restriction.'
      : 'Any device will be able to connect while the connection is active.'

  return (
    <>
      <ListItemSetting
        label="Shareable Link"
        subLabel={subLabel}
        disabled={disabled}
        icon="globe-americas"
        toggle={!!connection.public}
        onClick={() =>
          connection &&
          setConnection({
            ...connection,
            public: !connection.public,
          })
        }
      />
      <Collapse in={connection.public} timeout={400}>
        <InlineSelectSetting
          label="Security"
          disabled={disabled || !connection.public}
          value={connection.publicRestriction}
          values={[
            { name: 'IP Latching', key: IP_LATCH },
            { name: 'None', key: IP_OPEN },
          ]}
          onSave={key => {
            connection &&
              setConnection({
                ...connection,
                publicRestriction: key.toString(),
              })
          }}
        />
      </Collapse>
    </>
  )
}