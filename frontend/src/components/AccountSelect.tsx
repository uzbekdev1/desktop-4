import React from 'react'
import { makeStyles, TextField, MenuItem, Tooltip } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { getAccountId } from '../models/accounts'
import { spacing, colors } from '../styling'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

export const AccountSelect: React.FC = () => {
  const css = useStyles()
  const { accounts, devices } = useDispatch<Dispatch>()
  const { signedInUser, fetching, options, activeId } = useSelector((state: ApplicationState) => ({
    signedInUser: state.auth.user,
    fetching: state.devices.fetching,
    activeId: getAccountId(state),
    options: [...state.accounts.member, state.auth.user],
  }))

  if (options.length < 2) return null

  return (
    <TextField
      select
      className={css.field}
      SelectProps={{ disableUnderline: true }}
      label="Device lists"
      value={activeId}
      disabled={fetching}
      variant="filled"
      onChange={async event => {
        await accounts.setActive(event.target.value.toString())
        devices.fetch()
      }}
    >
      {options.map(
        user =>
          !!user && (
            <MenuItem
              className={css.menuItem + (user.id === signedInUser?.id ? ' primary' : '')}
              value={user.id}
              key={user.id}
            >
              {/* <Avatar email={user.email} size={24} label /> */}
              {user.email}
            </MenuItem>
          )
      )}
    </TextField>
  )
}

const useStyles = makeStyles({
  field: {
    width: 300,
    marginRight: spacing.sm,
    '& .MuiButtonBase-root': {},
    '& .MuiSelect-root': { whiteSpace: 'nowrap' },
  },
  menuItem: { '&.primary': { color: colors.primary } },
})