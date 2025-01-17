import React from 'react'
import { makeStyles, Tooltip, ListItem, ListItemText, ListItemIcon } from '@material-ui/core'
import { InitiatorPlatform } from './InitiatorPlatform'
import { ListItemLocation } from './ListItemLocation'
import { TargetPlatform } from './TargetPlatform'
import { spacing, colors } from '../styling'
import { ApplicationState } from '../store'
import { attributeName } from '../shared/nameHelper'
import { useSelector } from 'react-redux'
import { selectById } from '../models/devices'
import { Title } from './Title'
import { Icon } from './Icon'

export interface Props {
  session: ISession
  merge?: boolean
  other?: boolean
  recent?: boolean
}

export const SessionListItem: React.FC<Props> = ({ session, merge, other, recent }) => {
  const [service, device] = useSelector((state: ApplicationState) => selectById(state, session.target.id))
  const connected = session.state === 'connected'
  const css = useStyles({ state: session.state, recent })

  let pathname = `/connections/${session.target.id}`
  if (session.id) pathname += `/${session.id}`
  if (other) pathname += '/other'

  if (!session) return null

  let icon: React.ReactElement | null = null
  if (connected) {
    icon = <Icon color="primary" name="chevron-right" type="light" size="md" />
    if (session.public) icon = <Icon color="primary" name="chevron-double-right" type="light" size="md" />
  }

  return (
    <>
      {merge || (
        <ListItem dense>
          <ListItemIcon className={css.mergeIcon}>
            <InitiatorPlatform id={session.platform} connected={!recent} />
          </ListItemIcon>
          <ListItemText primary={<Title enabled={!recent}>{other ? session.user?.email : 'This device'}</Title>} />
        </ListItem>
      )}
      <ListItemLocation pathname={pathname} match={`/connections/${session.target.id}`} dense>
        <Tooltip title={recent ? 'Disconnected' : connected ? 'Connected' : 'Idle'} placement="left" arrow>
          <ListItemIcon className={css.connectIcon}>
            <div className={css.connection} />
            {icon}
          </ListItemIcon>
        </Tooltip>
        <ListItemIcon className={css.platform + ' ' + css.title}>
          <TargetPlatform id={session.target.platform} size="md" color={recent ? 'gray' : 'primary'} tooltip />
        </ListItemIcon>
        <ListItemText
          className={css.title}
          primary={
            <Title>
              {service ? (
                <>
                  <span className={css.service}>{attributeName(service)}</span> - {attributeName(device)}
                </>
              ) : (
                session.target.name
              )}
            </Title>
          }
        />
      </ListItemLocation>
    </>
  )
}

const useStyles = makeStyles({
  title: ({ state, recent }: any) => ({
    opacity: state === 'offline' ? 0.5 : 1,
    '& > span': { overflow: 'hidden', whiteSpace: 'nowrap', color: recent ? colors.grayDark : colors.primaryLight },
  }),
  connection: ({ recent, state }: any) => ({
    borderColor: recent ? colors.grayLight : colors.primary,
    borderWidth: '0 0 1px 1px',
    borderBottomWidth: state === 'offline' ? 0 : 1,
    borderBottomColor: state === 'connected' ? colors.primary : recent ? colors.grayLight : colors.primary,
    borderBottomStyle: state === 'connected' ? 'solid' : 'dashed',
    borderStyle: 'solid',
    height: '2.6em',
    marginTop: '-2.6em',
    width: '1.5em',
    marginRight: '-1.5em',
  }),
  service: ({ recent }: any) => ({
    color: recent ? colors.grayDarker : colors.primary,
    fontWeight: 500,
  }),
  connectIcon: {
    position: 'relative',
    '& > svg': { position: 'absolute', right: 6, bottom: -7 },
  },
  platform: {
    minWidth: 48,
  },
  mergeIcon: { zIndex: 2, backgroundColor: colors.white },
  icon: { marginTop: spacing.xxs, marginRight: spacing.md, marginLeft: spacing.sm },
})
