import React, { useState, useEffect } from 'react'
import { CognitoUser } from '@remote.it/types'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { CognitoAuth } from '@remote.it/components'
import theme from '../../styling/theme'
import { CHECKBOX_REMEMBER_KEY } from '../../models/auth'
import { SEGMENT_PROJECT_KEY } from '../../helpers/analyticsHelper'

export function SignInForm() {
  const { signInError, authService, localUsername } = useSelector((state: ApplicationState) => state.auth)
  const appVersion = useSelector((state: ApplicationState) => state.binaries.version)
  const [successUser, setSuccessUser] = useState<CognitoUser>()
  const [rememberMe, setRememberMe] = useState<boolean>(false)
  const { auth } = useDispatch<Dispatch>()

  useEffect(() => {
    auth.getUsernameLocal()
    const remember = window.localStorage.getItem(CHECKBOX_REMEMBER_KEY)
    setRememberMe(!!remember)
  }, [])

  useEffect(() => {
    if (successUser) auth.handleSignInSuccess(successUser)
  }, [successUser])

  const onClickCheckboxRemember = checked => {
    setRememberMe(!!checked)
    if (checked) {
      window.localStorage.setItem(CHECKBOX_REMEMBER_KEY, 'true')
    } else {
      window.localStorage.removeItem(CHECKBOX_REMEMBER_KEY)
    }
  }

  const segmentSettings = {
      segmentKey: 'DESKTOP',
      segmentAppName: SEGMENT_PROJECT_KEY,
      appVersion
  }

  return (
    <CognitoAuth
      themeOverride={theme}
      onSignInSuccess={(user: CognitoUser) => setSuccessUser(user)}
      errorMessage={signInError}
      authService={authService}
      hideCaptcha={true}
      inputEmail={localUsername}
      showCheckboxRemember={true}
      onClickCheckboxRemember={onClickCheckboxRemember}
      checkedCheckboxRemember={rememberMe}
      segmentSettings={segmentSettings}
    />
  )
}
