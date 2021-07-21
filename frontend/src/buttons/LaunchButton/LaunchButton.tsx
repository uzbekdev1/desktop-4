import React, { useState, useEffect } from 'react'
import { IconButton, Tooltip, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { launchPutty, launchVNC, launchRemoteDesktop, isWindows } from '../../services/Browser'
import { ApplicationState, Dispatch } from '../../store'
import { useApplication } from '../../hooks/useApplication'
import { setConnection } from '../../helpers/connectionHelper'
import { useDispatch, useSelector } from 'react-redux'
import { PromptModal } from '../../components/PromptModal'
import { DataButton } from '../DataButton'
import { DialogApp } from '../../components/DialogApp'
import { Icon } from '../../components/Icon'

type Props = {
  connection?: IConnection
  service?: IService
  menuItem?: boolean
  dataButton?: boolean
  size?: FontSize
  onLaunch?: () => void
}

export const LaunchButton: React.FC<Props> = ({ connection, service, menuItem, dataButton, size = 'md', onLaunch }) => {
  const { ui } = useDispatch<Dispatch>()

  const { loading, path, launchState } = useSelector((state: ApplicationState) => ({
    path: state.ui.launchPath,
    loading: state.ui.launchLoading,
    launchState: state.ui.launchState
  }))

  const [launchApp, setLaunchApp] = useState<ILaunchApp>()
  const disabled = !connection?.enabled

  const app = useApplication('launch', service, connection)

  useEffect(() => {
    if (launchState?.launch) {
      app.prompt ? ui.updateLaunchState({ open: true }) : launchBrowser()
      onLaunch && onLaunch()
    }
    ui.updateLaunchState({ openApp: true })
  }, [launchState?.launch, app])

  if (!app) return null

  // windows and mac
  const launchBrowser = () => {

    const hostProps = {
      port: app.connection?.port,
      host: app.connection?.host,
      path,
    }

    if (launchPutty(service?.typeID)) {
      setLaunchApp({
        ...hostProps,
        application: 'putty',
      })
    }
    if (launchVNC(service?.typeID)) {
      setLaunchApp({
        ...hostProps,
        username: app.connection?.username,
        application: 'vncviewer',
      })
    }
    if (launchRemoteDesktop(service?.typeID)) {
      setLaunchApp({
        ...hostProps,
        username: app.connection?.username,
        path: 'desktop',
        application: 'remoteDesktop',
      })
    }
    isWindows() ? ui.updateLaunchState({ openApp: true }) : window.open(app?.command)
  }

  const onSubmit = (tokens: ILookup<string>) => {
    connection && setConnection({ ...connection, ...tokens })
  }

  const closeAll = () => {
    ui.updateLaunchState({ openApp: false, open: false, launch: false })
  }

  const clickHandler = () => ui.updateLaunchState({ launch: true })

  const LaunchIcon = (
    <Icon
      rotate={app.iconRotate ? -45 : undefined}
      name={loading ? 'spinner-third' : app.icon}
      spin={loading}
      size={size}
    />
  )

  const title = `Launch ${app.title}`

  return (
    <>
      {menuItem ? (
        <MenuItem dense onClick={clickHandler} disabled={loading || disabled}>
          <ListItemIcon>{LaunchIcon}</ListItemIcon>
          <ListItemText primary={title} />
        </MenuItem>
      ) : dataButton ? (
        <DataButton label={title} value={app.command} title={title} icon={LaunchIcon} onClick={clickHandler} />
      ) : (
        <Tooltip title={title}>
          <IconButton onClick={clickHandler} disabled={loading || disabled}>
            {LaunchIcon}
          </IconButton>
        </Tooltip>
      )}
      <PromptModal app={app} open={launchState.open} onClose={closeAll} onSubmit={onSubmit} />
      {isWindows() && <DialogApp launchApp={launchApp} app={app} type={service?.type} />}
    </>
  )
}
