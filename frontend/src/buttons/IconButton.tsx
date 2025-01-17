import React from 'react'
import { useHistory } from 'react-router-dom'
import { Tooltip, IconButton as MuiIconButton } from '@material-ui/core'
import { Icon, IconProps } from '../components/Icon/Icon'
import { Color, FontSize, spacing } from '../styling'

type Props = IconProps & {
  title?: string
  icon: string
  disabled?: boolean
  to?: string
  className?: string
  shiftDown?: boolean
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: (e: React.MouseEvent) => void
  onClick?: (e: React.MouseEvent) => void
}

export const IconButton: React.FC<Props> = ({
  title,
  icon,
  disabled,
  to,
  color,
  size = 'base',
  type = 'regular',
  shiftDown,
  className,
  onMouseEnter,
  onMouseLeave,
  onClick,
  children,
  ...props
}) => {
  const history = useHistory()
  const clickHandler = (e: React.MouseEvent) => {
    if (onClick) onClick(e)
    if (to) history.push(to)
  }
  const button = (
    <MuiIconButton
      onClick={clickHandler}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      className={className}
      style={{ opacity: disabled ? 0.5 : undefined, marginBottom: shiftDown ? -spacing.sm : undefined }}
    >
      <Icon {...props} name={icon} color={color} type={type} size={size} />
      {children}
    </MuiIconButton>
  )

  return disabled || !title ? button : <Tooltip title={title}>{button}</Tooltip>
}
