import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useIntl } from 'react-intl'
import Page from '../../containers/Page/Page'
import {
  Box, Button, TextField, Paper, Typography, Grid, MenuItem, CircularProgress
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const UserPage = () => {
  const { id } = useParams() 
  const navigate = useNavigate()
  const intl = useIntl()
  const collection = 'User'
  
  // ตรวจสอบว่าเป็นโหมด "สร้างใหม่" หรือไม่
  const isCreateMode = id === 'create'

  const [loading, setLoading] = useState(!isCreateMode) // ถ้า create ไม่ต้องโหลด
  const [data, setData] = useState({
    _id: '',       // ในโหมด Create อาจจะต้องกรอกเอง หรือให้ระบบ Gen
    userName: '',
    fullName: '',
    email: '',
    password: '',
    userLevel: 'user',
    userState: 'enable',
  })

  function getAuth() {
    let auth = null
    const item = localStorage.getItem('base-shell:auth')
    if (item) auth = JSON.parse(item)
    return auth
  }

  // 1. Fetch Data (เฉพาะโหมด Edit)
  useEffect(() => {
    if (isCreateMode) return; // ถ้าสร้างใหม่ ไม่ต้องดึงข้อมูล

    async function fetchData() {
      try {
        const auth = getAuth()
        if (!auth) return

        const resp = await fetch('/api/preferences/readDocument', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
          body: JSON.stringify({
            collection: collection,
            query: { _id: id },
          })
        })
        const json = await resp.json()
        
        if (json && json.length > 0) {
          setData(json[0])
        } else {
          alert('User not found')
          navigate('/users')
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate, isCreateMode])

  // 2. Handle Save (รองรับทั้ง Create และ Update)
  async function handleSave() {
    try {
      // Validation เบื้องต้น
      if (!data._id || !data.userName) {
        alert('Please fill ID and Username')
        return
      }

      const auth = getAuth()
      
      // เลือก URL API ตามโหมด
      const url = isCreateMode 
        ? '/api/preferences/createDocument' 
        : '/api/preferences/updateDocument'

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
        body: JSON.stringify({
          collection: collection,
          data: data, // ส่งข้อมูล
        })
      })
      
      const json = await resp.json()
      console.log('Save result:', json)
      
      alert(isCreateMode ? 'Created successfully!' : 'Updated successfully!')
      navigate('/users') // บันทึกเสร็จกลับไปหน้ารายการ
      
    } catch (error) {
      console.error('Save error:', error)
      alert('Error saving data')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <Page pageTitle="Loading...">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
      </Page>
    )
  }

  return (
    <Page pageTitle={isCreateMode ? 'Create New User' : `Edit User : ${data.userName}`}>
      <Box sx={{ padding: 2, maxWidth: 800, margin: '0 auto' }}>
        
        <Box sx={{ mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')}>
            Back to List
          </Button>
        </Box>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            {isCreateMode ? 'New User Details' : 'User Information'}
          </Typography>

          <Grid container spacing={3}>
            
            {/* ID Field: ให้แก้ไขได้เฉพาะตอน Create */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="User ID"
                name="_id"
                value={data._id}
                onChange={handleChange}
                disabled={!isCreateMode} // ห้ามแก้ ID ถ้าเป็นการ Edit
                variant={isCreateMode ? "outlined" : "filled"}
                helperText={isCreateMode ? "Required unique ID" : ""}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                name="userName"
                value={data.userName || ''}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={data.password || ''}
                onChange={handleChange}
                helperText={!isCreateMode && "Leave blank to keep current password"}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={data.fullName || ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={data.email || ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="User Level"
                name="userLevel"
                value={data.userLevel || 'user'}
                onChange={handleChange}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="super-user">Super User</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="State"
                name="userState"
                value={data.userState || 'disable'}
                onChange={handleChange}
              >
                <MenuItem value="enable">Enable</MenuItem>
                <MenuItem value="disable">Disable</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                fullWidth
              >
                {isCreateMode ? 'Create User' : 'Save Changes'}
              </Button>
            </Grid>

          </Grid>
        </Paper>
      </Box>
    </Page>
  )
}

export default UserPage