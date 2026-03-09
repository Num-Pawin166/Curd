import React, { useState, } from 'react'
import Page from '../../containers/Page/Page'
import { useIntl } from 'react-intl'

import Grid from '@mui/material/Unstable_Grid2';

import { 
  TextareaAutosize,
  TextField,
  Button,
  Box,
} from '@mui/material'

const HomePage = () => {

  const intl = useIntl()

  const collection = 'User'
  const [query, setQuery] = useState('{}'); 
  const [updateText, setUpdateText] = useState('{ "userName": "userName" }')
  const [deleteText, setDeleteText] = useState('{ "_id": "userA" }')
  const [users, setUsers] = useState('');
  const [data, setData] = useState({
    _id: 'userA',
    userName: 'userA',
    fullName: 'userA',
    userLevel: 'user',
    userState: 'enable',
    email: 'user1@gmail.com',
    password: 'Default@1234',
    dateCreate: new Date()+'',
    dateExpire: '',
  });

  function getAuth () {
    let auth = null
    const item = localStorage.getItem('base-shell:auth')      
    if (item)  {
      auth = JSON.parse(item)
    }
    return auth
  }

  async function Create () {

    const auth = getAuth()

    const resp = await fetch('/api/preferences/readDocument', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
      body: JSON.stringify({
        collection: collection,
        query: {},
      })
    })
    const json = await resp.json();
    console.log(json)

    if (json.length)  {
      for (let i in json)  {
        if (json[i]._id === data._id)  {
          alert('_id duplicated.')
          return
        }
      }
    }

    const resp2 = await fetch('/api/preferences/createDocument', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
      body: JSON.stringify({
        collection: collection,
        data: data,
      })
    })
    const json2 = await resp2.json();
    console.log(json2)
    alert('Created.')

  }

  async function Read () {

    const auth = getAuth()

    const resp = await fetch('/api/preferences/readDocument', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
      body: JSON.stringify({
        collection: collection,
        query: JSON.parse(query),
      })
    })
    const json = await resp.json();
    console.log(json)
    setUsers(JSON.stringify(json))

  }

  async function Update () {

    const auth = getAuth()

    const resp = await fetch('/api/preferences/updateDocument', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
      body: JSON.stringify({
        collection: collection,
        data: data,
      })
    })
    const json = await resp.json();
    console.log(json)

  }

  async function Delete () {

    const auth = getAuth()

    const resp = await fetch('/api/preferences/deleteDocument', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
      body: JSON.stringify({
        collection: collection,
        query: JSON.parse(deleteText),
      })
    })
    const json = await resp.json();
    console.log(json)
    alert('Deleted.')

  }


  return (
    <Page pageTitle={intl.formatMessage({ id: 'home' })}>

      <Box sx={{  padding: 2,  marginBottom: 18, }}>

        <Grid container spacing={2} justifyContent='center' >

          <Grid container spacing={1} alignItems={'center'} justifyContent='flex-start' xs={12} sm={12} md={12} lg={12} xl={10} >



            <Grid xs={2} >
              <Button fullWidth color="primary" variant="contained"  onClick={e => {
                Create()
              }}>
                Create
              </Button>
            </Grid>

            <Grid xs={12}>
              <span>Data</span>
              <TextareaAutosize disabled={true} minRows={3} value={JSON.stringify(data)} style={{ width: '100%', resize: 'vertical'}}  name="Create" />
            </Grid>




            <Grid xs={2}>
              <Button fullWidth color="primary" variant="contained"  onClick={e => {
                Read()
              }}>
                Read
              </Button>
            </Grid>

            <Grid xs={10} >
              <TextField type="text" value={query} name="query" label="Query" variant="filled" size="small" fullWidth onChange={(e) => setQuery(e.target.value)} />
            </Grid>

            <Grid xs={12}>
              <span>Read</span>
              <TextareaAutosize disabled={true} minRows={3} value={users} style={{ width: '100%', resize: 'vertical'}}  name="Read" />
            </Grid>




            <Grid xs={2}>
              <Button fullWidth color="primary" variant="contained"  onClick={e => {
                Update()
              }}>
                Update
              </Button>
            </Grid>

            <Grid xs={8} >
              <TextField type="text" value={updateText} name="updateText" label="Update-Text" variant="filled" size="small" fullWidth onChange={(e) => setUpdateText(e.target.value)} />
            </Grid>

            <Grid xs={2}>
              <Button fullWidth variant="outlined"  onClick={e => {

                let json = JSON.parse(updateText)
                let keys = Object.keys(json)
                let temp = data
                console.log(json, keys, json[keys[0]])
                if (keys && keys.length)  {
                  for (let i in keys)  temp[keys[i]] = json[keys[i]]
                  setData({...temp})
                }

              }}>
                Chang Data
              </Button>
            </Grid>



            <Grid xs={2}>
              <Button fullWidth color="primary" variant="contained"  onClick={e => {
                Delete()
              }}>
                Delete
              </Button>
            </Grid>

            <Grid xs={10} >
              <TextField type="text" value={deleteText} name="deleteText" label="Delete-Text" variant="filled" size="small" fullWidth onChange={(e) => setDeleteText(e.target.value)} />
            </Grid>




          </Grid>

        </Grid>

      </Box>


    </Page>
  )
}
export default HomePage
