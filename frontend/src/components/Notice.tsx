import React from 'react'
import { Icon } from './Icon'
import { spacing, colors, fontSizes } from '../styling'
import { makeStyles, Paper, Box, Button, fade, emphasize } from '@material-ui/core'
import classnames from 'classnames'

type Props = {
  severity?: 'info' | 'warning'
  link?: string
  gutterBottom?: boolean
}

export const Notice: React.FC<Props> = ({ severity = 'info', link, gutterBottom, children }) => {
  const css = useStyles()
  let icon, color, colorName

  switch (severity) {
    case 'info':
      icon = 'info-circle'
      color = colors.primary
      colorName = 'primary'
      break
    case 'warning':
      icon = 'exclamation-triangle'
      color = colors.warning
      colorName = 'warning'
  }

  return (
    <Paper
      elevation={0}
      style={{ backgroundColor: fade(color, 0.2), color: emphasize(color, 0.3) }}
      className={classnames(css.notice, gutterBottom && css.gutter)}
    >
      <Icon name={icon} size="md" type="regular" />
      <Box>{children}</Box>
      {link && (
        <Button color="primary" variant="contained" href={link} size="small" target="_blank">
          Upgrade
        </Button>
      )}
    </Paper>
  )
}

const useStyles = makeStyles({
  notice: {
    flexGrow: 1,
    alignItems: 'center',
    margin: `${spacing.xxs}px ${spacing.xs}px`,
    padding: `${spacing.sm}px ${spacing.md}px`,
    display: 'flex',
    fontWeight: 500,
    '& .MuiBox-root': { flexGrow: 1 },
    '& .MuiButton-root': { minWidth: 90, marginLeft: spacing.md },
    '& .far': { marginTop: spacing.xxs, marginRight: spacing.md, width: 21, alignSelf: 'flex-start' },
    '& em': { display: 'block', fontWeight: 400, fontSize: fontSizes.sm, fontStyle: 'normal' },
  },
  gutter: {
    marginBottom: spacing.md,
  },
})
