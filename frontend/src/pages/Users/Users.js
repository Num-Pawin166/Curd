import React, { useState, useEffect } from 'react'
import Page from '../../containers/Page/Page'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Typography,
  Divider,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete' // ไอคอนถังขยะ

const UsersPage = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const collection = 'User'
  
  const [users, setUsers] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selected, setSelected] = useState([]) // ตัวแปรเก็บ ID ของคนที่ถูกเลือก

  function getAuth() {
    let auth = null
    const item = localStorage.getItem('base-shell:auth')
    if (item) auth = JSON.parse(item)
    return auth
  }

  // --- Fetch Data ---
  async function fetchUsers(queryText = '') {
    try {
      const auth = getAuth()
      if (!auth) return;

      let mongoQuery = {}
      if (queryText) {
        mongoQuery = { 
          userName: { $regex: queryText, $options: 'i' } 
        }
      }

      const resp = await fetch('/api/preferences/readDocument', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
        body: JSON.stringify({
          collection: collection,
          query: mongoQuery,
        })
      })
      
      const json = await resp.json()
      if (Array.isArray(json)) {
        setUsers(json)
        setSelected([]) // เคลียร์การเลือกเมื่อโหลดข้อมูลใหม่
      } else {
        setUsers([])
      }

    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // --- Logic การเลือก (Selection) ---

  // 1. เลือกทั้งหมด / ยกเลิกทั้งหมด
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = users.map((n) => n._id)
      setSelected(newSelecteds)
      return
    }
    setSelected([])
  }

  // 2. เลือกทีละคน
  const handleCheck = (event, id) => {
    event.stopPropagation() // สำคัญ! หยุดไม่ให้มันคลิกทะลุไปกดปุ่ม Edit
    
    const selectedIndex = selected.indexOf(id)
    let newSelected = []

    if (selectedIndex === -1) {
      // ถ้ายังไม่เลือก -> ให้เพิ่มเข้าไป
      newSelected = newSelected.concat(selected, id)
    } else if (selectedIndex === 0) {
      // ถ้าตัวแรกถูกเลือก -> ตัดตัวแรกออก
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      // ถ้าตัวท้ายถูกเลือก -> ตัดตัวท้ายออก
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      // ถ้าอยู่ตรงกลาง -> ตัดเฉพาะตัวนั้นออก
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      )
    }
    setSelected(newSelected)
  }

  // 3. ฟังก์ชันลบคนที่เลือก (Bulk Delete)
  const handleDeleteSelected = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selected.length} users?`)) return;

    const auth = getAuth()
    try {
      // วนลูลบทีละคน (หรือถ้า API รองรับ $in ก็แก้ได้ครับ)
      for (let id of selected) {
         await fetch('/api/preferences/deleteDocument', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
            body: JSON.stringify({
              collection: collection,
              query: { _id: id },
            })
         })
      }
      alert('Deleted successfully')
      fetchUsers(searchText) // โหลดข้อมูลใหม่
    } catch (error) {
      console.error(error)
      alert('Delete failed')
    }
  }


  // --- Search Logic ---
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      fetchUsers(searchText)
    }
  }
  
  const handleClearSearch = () => {
    setSearchText('')
    setShowSearch(false)
    fetchUsers('')
  }

  return (
    <Page pageTitle={intl.formatMessage({ id: 'users' })}> 
      <Box sx={{ padding: 2 }}>
        
        {/* Header */}
        <Paper elevation={1} sx={{ mb: 2, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: selected.length > 0 ? '#e3f2fd' : '#f5f5f5', height: 64 }}>
          
          {/* ส่วนซ้าย: Checkbox All + Text */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox
              color="primary"
              // ถ้าจำนวนที่เลือกเท่ากับจำนวนทั้งหมด และมีข้อมูลมากกว่า 0 -> ติ๊กถูก
              checked={users.length > 0 && selected.length === users.length}
              // ถ้าเลือกบ้างบางคน -> ติ๊กขีด
              indeterminate={selected.length > 0 && selected.length < users.length}
              onChange={handleSelectAllClick}
            />
            <Typography variant="subtitle1" fontWeight="bold" sx={{ ml: 1 }}>
              {selected.length > 0 ? `${selected.length} selected` : `Total : ${users.length}`}
            </Typography>
          </Box>

          {/* ส่วนขวา: ปุ่มเครื่องมือ */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            
            {/* ถ้ามีการเลือก -> โชว์ปุ่มลบ */}
            {selected.length > 0 ? (
              <Tooltip title="Delete">
                <IconButton onClick={handleDeleteSelected} color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            ) : (
              // ถ้าไม่มีการเลือก -> โชว์ปุ่มค้นหาและปุ่มเพิ่ม
              <>
                {showSearch && (
                  <TextField
                    size="small"
                    autoFocus
                    placeholder="Search username..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={handleSearch}
                    sx={{ bgcolor: 'white', borderRadius: 1 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => fetchUsers(searchText)}>
                            <SearchIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                <IconButton onClick={showSearch ? handleClearSearch : () => setShowSearch(true)}>
                  {showSearch ? <ClearIcon /> : <SearchIcon />}
                </IconButton>
                <IconButton 
                  color="primary" 
                  onClick={() => navigate('/users/create')} 
                  sx={{ border: '1px solid', borderColor: 'primary.main' }}
                >
                  <AddIcon />
                </IconButton>
              </>
            )}
            
          </Box>
        </Paper>

        {/* List Items */}
        <Paper elevation={2}>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {users.map((user, index) => {
              const labelId = `checkbox-list-label-${user._id}`;
              const isSelected = selected.indexOf(user._id) !== -1; // เช็คว่าคนนี้ถูกเลือกอยู่ไหม

              return (
                <React.Fragment key={user._id || index}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {user.userLevel || 'user'} • 
                        </Typography>
                        <Chip 
                          label={user.userState || 'disable'} 
                          color={user.userState === 'enable' ? 'success' : 'default'} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    }
                  >
                    <ListItemButton 
                      role={undefined} 
                      dense
                      selected={isSelected} // ไฮไลท์สีพื้นหลังถ้าถูกเลือก
                      onClick={() => navigate(`/users/${user._id}`)} // คลิกที่แถว -> ไปแก้ไข
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={isSelected} // ติ๊กถูกถ้าถูกเลือก
                          tabIndex={-1}
                          disableRipple
                          inputProps={{ 'aria-labelledby': labelId }}
                          onClick={(e) => handleCheck(e, user._id)} // คลิกที่กล่อง -> แค่เลือก (ไม่ไปหน้าแก้ไข)
                        />
                      </ListItemIcon>
                      <ListItemText
                        id={labelId}
                        primary={<Typography variant="body1" fontWeight="500">{user.userName || 'Unknown'}</Typography>}
                        secondary={<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>Email: {user.email || '-'} | ID: {user._id}</Typography>}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              );
            })}
            
            {users.length === 0 && (
               <Box sx={{ p: 4, textAlign: 'center', color: 'gray' }}>No users found.</Box>
            )}
          </List>
        </Paper>
      </Box>
    </Page>
  )
}

export default UsersPage