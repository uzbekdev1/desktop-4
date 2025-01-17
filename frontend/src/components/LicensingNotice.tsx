import React from 'react'
import { selectLicense, lookupLicenseProductId } from '../models/licensing'
import { ListItem, Button, Tooltip, IconButton } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { LicensingTitle } from './LicensingTitle'
import { useDispatch, useSelector } from 'react-redux'
import { dateOptions } from './Duration/Duration'
import { Link } from 'react-router-dom'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = { device?: IDevice; license?: ILicense; fullWidth?: boolean }

export const LicensingNotice: React.FC<Props> = props => {
  const { licensing } = useDispatch<Dispatch>()
  const {
    noticeType,
    license,
    informed,
    serviceLimit,
    managePath = '',
  } = useSelector((state: ApplicationState) => {
    let productId = props.license?.plan.product.id
    if (props.device && state.auth.user?.id === props.device.owner.id) productId = lookupLicenseProductId(props.device)
    return selectLicense(state, productId)
  })

  if (!license || !noticeType || informed) return null

  const onClose = () => licensing.set({ informed: true })

  let notice
  const title = `Your ${license.plan.description} plan of ${license.plan.product.name}`
  const UpgradeButton = (
    <>
      <Link to={managePath}>
        <Button color="primary" variant="contained" size="small">
          Upgrade
        </Button>
      </Link>
      <Tooltip title="Close">
        <IconButton onClick={onClose}>
          <Icon name="times" size="md" color="primary" />
        </IconButton>
      </Tooltip>
    </>
  )

  if (noticeType === 'EXPIRATION_WARNING' && license.expiration)
    notice = (
      <Notice severity="info" button={UpgradeButton}>
        {title} will renew on {/* replace with countdown */}
        {license.expiration.toLocaleString(undefined, dateOptions)}.
      </Notice>
    )

  if (noticeType === 'LIMIT_EXCEEDED')
    notice = (
      <Notice severity="warning" button={UpgradeButton}>
        {title} <LicensingTitle count={serviceLimit?.value} />
        <em>
          You have exceeded your limit by {serviceLimit?.actual - serviceLimit?.value}.{' '}
          <Link to={managePath}>Learn more.</Link>
        </em>
      </Notice>
    )

  if (noticeType === 'EXPIRED')
    notice = (
      <Notice severity="warning" button={UpgradeButton}>
        {title} has expired.
        <em>
          Please upgrade your license. <Link to={managePath}>Learn more.</Link>
        </em>
      </Notice>
    )

  return props.fullWidth ? notice : <ListItem>{notice}</ListItem>
}
