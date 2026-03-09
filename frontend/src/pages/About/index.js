import React from 'react'
import { useIntl } from 'react-intl'
import Page from '../../containers/Page/Page'
import { Box, Grid, Card, CardMedia, CardContent, Typography } from '@mui/material'

const members = [
  { id: 1, studentId: '67030166', name: 'Pawin Srisiriwat', photo: '/3.jpg' },
  { id: 2, studentId: '67030260', name: 'Arthittaya Phiokham', photo: '/1.jpg' },
  { id: 3, studentId: '67030302', name: 'Theethat Rattanasopa', photo: '/2.jpg' },
]

const About = () => {
  const intl = useIntl()

  return (
    <Page pageTitle={intl.formatMessage({ id: 'about', defaultMessage: 'About' })}>
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
          Group Members
        </Typography>
        <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
          {members.map((member) => (
            <Grid item xs={12} sm={4} key={member.id}>
              <Card elevation={3} sx={{ textAlign: 'center', borderRadius: 3 }}>
                <Box sx={{ width: '100%', aspectRatio: '1 / 1', overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    image={member.photo}
                    alt={member.studentId}
                    sx={{ width: '100%', height: '100%', objectFit: 'contain', bgcolor: '#f5f5f5' }}
                  />
                </Box>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    {member.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.studentId}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Page>
  )
}

export default About
