import React, { useState, useEffect } from 'react'
import { IconButton, Tooltip, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { isWindows, getApplicationObj } from '../../services/Browser'
import { ApplicationState, Dispatch } from '../../store'
import { useApplication } from '../../hooks/useApplication'
import { setConnection } from '../../helpers/connectionHelper'
import { useDispatch, useSelector } from 'react-redux'
import { PromptModal } from '../../components/PromptModal'
import { DataButton } from '../DataButton'
import { DialogApp } from '../../components/DialogApp'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'

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
  const [openLaunchApplication, setOpenLaunchApplication] = useState<boolean>(false)
  const app = useApplication('launch', service, connection)

  useEffect(() => {
    if (openLaunchApplication && !loading) {
      launchApplication()
      setOpenLaunchApplication(false)
    }
  }, [loading])

  useEffect(() => {
    return () => closeAll()
  }, [])

  if (!app) return null

  const launchApplication = () => {

    const applicationObj = getApplicationObj(service?.typeID, app.connection?.username)
    const hostProps = {
      port: app.connection?.port,
      host: app.connection?.host,
      path,
    }
    if (applicationObj?.application) {
      setLaunchApp({
        ...hostProps,
        ...applicationObj
      })
    }
    ui.updateLaunchState({ openApp: true })
    onLaunch && onLaunch()
  }

  const onSubmit = (tokens: ILookup<string>) => {
    connection && setConnection({ ...connection, ...tokens })
  }

  const closeAll = () => {
    ui.updateLaunchState({ openApp: false, open: false, launch: false })
  }

  const clickHandler = () => {
    if (isWindows()) {
      const applicationObj = getApplicationObj(service?.typeID, app.connection?.username)
      ui.set({ launchLoading: true, requireInstall: 'none' })
      emit('check/app', applicationObj?.application)// requireInstall "" // "putty"
      setOpenLaunchApplication(true)
    } else {
      window.open(app.command)
    }

  }

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
