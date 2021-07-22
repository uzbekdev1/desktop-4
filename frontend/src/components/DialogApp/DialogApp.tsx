import React, { useEffect } from 'react'
import { Typography, Dialog, DialogActions, Button, Box, Divider, Grid } from '@material-ui/core'
import { Application } from '../../shared/applications'
import { emit } from '../../services/Controller'
import { ApplicationState, Dispatch } from '../../store'
import { useDispatch, useSelector } from 'react-redux'

export const DialogApp: React.FC<{
  type?: string
  app?: Application
  launchApp: ILaunchApp | undefined
}> = ({ type, app, launchApp }) => {
  const { ui } = useDispatch<Dispatch>()
  const { requireInstall, openApp } = useSelector((state: ApplicationState) => ({
    requireInstall: state.ui.requireInstall,
    openApp: state.ui.launchState.openApp
  }))

  const closeAll = () => {
    ui.updateLaunchState({ openApp: false, open: false, launch: false })
  }

  const getLinkDownload = () => {
    ui.set({ requireInstall: 'none' })
    switch (requireInstall) {
      case 'putty':
        return ('https://link.remote.it/download/putty')
      case 'vncviewer':
        return 'https://www.realvnc.com/en/connect/download/viewer/windows/'
    }
  }

  const App = type === 'VNC' ? 'VNC Viewer' : 'Putty'
  const getApp = () => {
    console.log("require install: ", requireInstall)
    !requireInstall && requireInstall !== 'none' ? emit('launch/app', launchApp) : window.open(getLinkDownload())
    closeAll()
  }
  const launchBrowser = () => {
    window.open(app?.command)
    closeAll()
  }
  const title = requireInstall !== '' ? ` ${type} connections ` : ` Please install ${App} to launch ${type} connections.`
  const buttonText = requireInstall !== '' ? `  launch ${App} ` : ` Download ${App} `

  return (
    <>
      <Dialog open={openApp} onClose={closeAll} maxWidth="xs" fullWidth>
        <Box m={0} p={2}>
          <Grid container>

            <Grid item xs={7} md={7}>
              <Box m={1} pt={2}>
                <Typography variant="h2">{title}</Typography>
              </Box>
            </Grid>
            <Grid item xs={5} md={5}>
              <Box p={1}>
                <Button onClick={getApp} variant="contained" color="primary"  >{buttonText}</Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={12}><Box m={2}><Divider></Divider></Box></Grid>
            <Grid item xs={7} md={7}>
              <Box p={1}>
                <Typography variant="h2" style={{ color: "#999" }}>
                  {app?.command}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={5} md={5}>
              <Box p={1}>
                <Button onClick={launchBrowser} variant="contained" color="primary"  >
                  Launch Browser
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Box m={2}><Divider></Divider></Box>

          <Box m={1}>
            <DialogActions>
              <Button onClick={closeAll} color="primary" size="small" type="button">
                Cancel
              </Button>
            </DialogActions>
          </Box>
        </Box>
      </Dialog>
    </>
  )
}
