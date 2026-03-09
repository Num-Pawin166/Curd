import { Button, TextField, Typography } from '@mui/material'
import Page from '../../containers/Page/Page'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/Auth'

import { useNavigate, useLocation } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { useMenu } from '../../providers/Menu'
import { useTheme } from '@mui/material/styles'
import CustomPaper from '../../components/CustomPaper'

import { jwtDecode } from "jwt-decode";

// กลุ่ม: login แบบ frontend-only (ไม่ต้อง backend)
const FRONTEND_USERS = [
  { userName: '67030166', password: '1234' },
  { userName: '67030260', password: '1234' },
  { userName: '67030302', password: '1234' },
]

const SignIn = ({ redirectTo = '/' }) => {

  const intl = useIntl()
  const theme = useTheme()
  const navigate = useNavigate()
  let location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { toggleThis } = useMenu()
  const { setAuth } = useAuth()

  async function handleSubmit(event) {

    event.preventDefault()

    // ตรวจสอบ frontend-only users ก่อน
    const frontendUser = FRONTEND_USERS.find(
      (u) => u.userName === username && u.password === password
    )
    if (frontendUser) {
      authenticate({
        displayName: 'member',
        email: username,
        userName: username,
        token: null,
      })
      return
    }

    // ถ้าไม่ใช่ frontend user ให้ใช้ backend (admin)
    try {
      const resp = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: username,
          password: password,
        })
      })
      const data = await resp.json();

      if (data) {
        if (data.token) {
          const decoded = jwtDecode(data.token);
          authenticate({
            displayName: decoded.userLevel,
            email: username,
            userName: decoded.userName,
            token: data.token,
          })
        } else {
          alert(data.text);
        }
      } else {
        alert('Error.')
      }
    } catch {
      alert('Cannot connect to server.')
    }

  }

  const authenticate = (user) => {

    setAuth({ isAuthenticated: true, ...user })
    toggleThis('isAuthMenuOpen', false)

    let from = new URLSearchParams(location.search).get('from')

    console.log(from, redirectTo)

    if (from) {
      navigate(from, { replace: true })
    } else {
      navigate(redirectTo, { replace: true })
    }
  }

  return (
    <Page pageTitle={intl.formatMessage({ id: 'sign_in' })}>
      <CustomPaper elevation={6}>
        <div
          sytle={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: `100%`,
          }}
        >
          <Typography component="h1" variant="h5">
            {intl.formatMessage({ id: 'sign_in' })}
          </Typography>
          <form
            sytle={{ marginTop: theme.spacing(1) }}
            onSubmit={handleSubmit}
            noValidate
          >
            <TextField
              value={username}
              onInput={(e) => setUsername(e.target.value)}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="username"
              label={intl.formatMessage({ id: 'username' })}
              name="username"
              autoComplete="username"
              autoFocus
            />
            <TextField
              value={password}
              onInput={(e) => setPassword(e.target.value)}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label={intl.formatMessage({ id: 'password' })}
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              style={{ margin: theme.spacing(3, 0, 2) }}
            >
              {intl.formatMessage({ id: 'sign_in' })}
            </Button>
          </form>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <Link to="/password_reset">
              {intl.formatMessage({ id: 'forgot_password' })}?
            </Link>
            <Link to="/signup">
              {intl.formatMessage({ id: 'registration' })}
            </Link>
          </div>
        </div>
      </CustomPaper>
    </Page>
  )
}

export default SignIn
