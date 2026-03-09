import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Page from '../../containers/Page/Page'
import {
  Box, Button, TextField, Typography, Grid, MenuItem, CircularProgress,
  FormControlLabel, Checkbox, IconButton, Accordion, AccordionSummary, AccordionDetails, Divider
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import CloseIcon from '@mui/icons-material/Close'
import DashboardIcon from '@mui/icons-material/Dashboard' // ✅ เพิ่มใหม่

import TextFieldsIcon from '@mui/icons-material/TextFields'
import InsertChartIcon from '@mui/icons-material/InsertChart'
import SpeedIcon from '@mui/icons-material/Speed'
import MapIcon from '@mui/icons-material/Map'
import DateRangeIcon from '@mui/icons-material/DateRange'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CHART_COLORS = ['#1976d2', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#00bcd4', '#795548', '#607d8b'];

const jsexe = async (code) => {
  try {
    const func = new Function(`return (${code})`)
    const result = func()
    if (result instanceof Promise) return await result
    return result
  } catch (error) { throw error }
}

const getIntervalMs = (intervalStr) => {
  switch(intervalStr) {
    case '1sec': return 1000;
    case '15sec': return 15000;
    case '30sec': return 30000;
    case '1min': return 60000;
    case 'daily': return 86400000;
    case 'week': return 604800000;
    case 'month': return 2592000000;
    case 'year': return 31536000000;
    default: return 1000;
  }
}

const DevicePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const isCreateMode = id === 'create'
  const collectionName = 'Device'
  const historyCollectionName = 'HistoryData'

  const [loading, setLoading] = useState(!isCreateMode)
  const [saving, setSaving] = useState(false)
  const [expandedPanel, setExpandedPanel] = useState(false) 
  
  const [activeTab, setActiveTab] = useState('devices') 
  const [draggingIdx, setDraggingIdx] = useState(null)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  
  const today = new Date().toISOString().split('T')[0]; 
  const [selectedDate, setSelectedDate] = useState(today); 
  const [realtimeChartData, setRealtimeChartData] = useState([]);

  const [historicalChartData, setHistoricalChartData] = useState([]);
  const [isHistoricalMode, setIsHistoricalMode] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);

  const [device, setDevice] = useState({
    _id: '', code: '0', connection: 'Virtual', model: 'Virtual', ipAddr: '',
    name: 'Virtual', remark: 'Virtual Device', apiCode: '',
    lineChannel: '', lineId: '', emailFrom: '', emailPwd: '', emailTo: '',
    status: 'Active', revision: 1, tags: [],
    showChart: false, chartX: 200, chartY: 200,
    showDatetime: false, datetimeX: 500, datetimeY: 50 
  })

  const [originalDevice, setOriginalDevice] = useState(null)
  const [tagResults, setTagResults] = useState({})
  const [tagErrors, setTagErrors] = useState({})

  const tagsRef = useRef([])
  const tagResultsRef = useRef({}) 
  const tagErrorsRef = useRef({})
  const lastRunTimes = useRef({}) 
  const lastDbSaveTime = useRef(Date.now())

  function getAuth() {
    let auth = null
    const item = localStorage.getItem('base-shell:auth')
    if (item) auth = JSON.parse(item)
    return auth
  }

  useEffect(() => { tagsRef.current = device.tags }, [device.tags])

  useEffect(() => {
    if (selectedDate === today) {
      setIsHistoricalMode(false);
    } else {
      setIsHistoricalMode(true);
      setIsChartLoading(true); 

      async function fetchHistoryFromDB() {
        try {
          const auth = getAuth();
          if (!auth) return;
          const resp = await fetch('/api/preferences/readDocument', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
            body: JSON.stringify({ 
              collection: historyCollectionName, 
              query: { deviceId: id, date: selectedDate },
            })
          });
          const json = await resp.json();
          if (Array.isArray(json) && json.length > 0) {
            json.sort((a, b) => a.timestamp - b.timestamp);
            setHistoricalChartData(json);
          } else {
            setHistoricalChartData([]); 
          }
        } catch (error) {
          console.error("Error fetching history:", error);
          setHistoricalChartData([]);
        } finally {
          setIsChartLoading(false);
        }
      }
      fetchHistoryFromDB();
    }
  }, [selectedDate, today, id]);

  useEffect(() => {
    let isMounted = true;
    const intervalId = setInterval(async () => {
      const currentTags = tagsRef.current;
      if (!currentTags || currentTags.length === 0) return;

      const now = Date.now();
      let hasUpdates = false; 

      const newResults = { ...tagResultsRef.current };
      const newErrors = { ...tagErrorsRef.current };

      await Promise.all(currentTags.map(async (tag, index) => {
        if (!tag.script || !tag.script.trim()) return;
        const intervalMs = getIntervalMs(tag.updateInterval);
        const lastRun = lastRunTimes.current[index] || 0;
        if (now - lastRun >= intervalMs) {
          try {
            const output = await jsexe(tag.script);
            newResults[index] = output;
            newErrors[index] = null;
          } catch (err) {
            newErrors[index] = err.message;
          }
          lastRunTimes.current[index] = now;
          hasUpdates = true;
        }
      }));

      if (isMounted && hasUpdates) {
        setTagResults(newResults); tagResultsRef.current = newResults;
        setTagErrors(newErrors); tagErrorsRef.current = newErrors;

        const timeStr = new Date().toLocaleTimeString('th-TH', { hour12: false });
        const newChartPoint = { time: timeStr };

        currentTags.forEach((tag, index) => {
           const numValue = parseFloat(newResults[index]);
           if (!isNaN(numValue)) {
              newChartPoint[tag.label || `Tag ${index + 1}`] = numValue; 
           }
        });

        setRealtimeChartData(prev => {
           const newData = [...prev, newChartPoint];
           if (newData.length > 30) newData.shift(); 
           return newData;
        });
      }

      if (now - lastDbSaveTime.current >= 60000) {
        const currentDateStr = new Date().toISOString().split('T')[0];
        const currentTimeStr = new Date().toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute:'2-digit' });
        
        let dataToSave = { deviceId: id, date: currentDateStr, time: currentTimeStr, timestamp: now };
        let hasRecordableData = false;
        
        currentTags.forEach((tag, idx) => {
           if (tag.record && tag.script && newResults[idx] !== undefined) {
               const numValue = parseFloat(newResults[idx]);
               if(!isNaN(numValue)) {
                   dataToSave[tag.label || `Tag ${idx+1}`] = numValue;
                   hasRecordableData = true;
               }
           }
        });

        if (hasRecordableData && id !== 'create') {
            const auth = getAuth();
            if(auth) {
               fetch('/api/preferences/createDocument', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
                 body: JSON.stringify({ collection: historyCollectionName, data: dataToSave })
               }).catch(e => console.error("History Save Error:", e));
            }
        }
        lastDbSaveTime.current = now;
      }

    }, 1000); 

    return () => { isMounted = false; clearInterval(intervalId); };
  }, [id]);

  useEffect(() => {
    if (isCreateMode) { setDevice(prev => ({ ...prev, tags: [] })); return; }
    async function fetchData() {
      try {
        const auth = getAuth()
        if (!auth) return
        const resp = await fetch('/api/preferences/readDocument', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
          body: JSON.stringify({ collection: collectionName, query: { _id: id } })
        })
        const json = await resp.json()
        if (json && json.length > 0) {
          let loadedDevice = json[0];
          if (!loadedDevice.tags) loadedDevice.tags = [];
          setDevice(loadedDevice)
          setOriginalDevice(JSON.parse(JSON.stringify(loadedDevice)))
        } else {
          alert('Device not found'); navigate('/dashboard')
        }
      } catch (error) { console.error('Fetch error:', error) } 
      finally { setLoading(false) }
    }
    fetchData()
  }, [id, navigate, isCreateMode])

  const handleChange = (e) => {
    const { name, value } = e.target
    setDevice(prev => ({ ...prev, [name]: value }))
  }

  const handleTagChange = (index, field, value) => {
    const newTags = [...device.tags]; newTags[index][field] = value;
    setDevice(prev => ({ ...prev, tags: newTags }))
    if (field === 'updateInterval') lastRunTimes.current[index] = 0; 
  }

  const runTagScript = async (index, e) => {
    if (e) e.stopPropagation()
    const newErrors = { ...tagErrorsRef.current, [index]: null };
    const newResults = { ...tagResultsRef.current, [index]: null };
    setTagErrors(newErrors); tagErrorsRef.current = newErrors;
    setTagResults(newResults); tagResultsRef.current = newResults;
    try {
      const code = device.tags[index].script
      if (!code || !code.trim()) return
      const output = await jsexe(code)
      const successResults = { ...tagResultsRef.current, [index]: output };
      setTagResults(successResults); tagResultsRef.current = successResults;
      lastRunTimes.current[index] = Date.now(); 
    } catch (err) { 
      const failedErrors = { ...tagErrorsRef.current, [index]: err.message };
      setTagErrors(failedErrors); tagErrorsRef.current = failedErrors;
    }
  }

  const handleSave = async () => {
    try {
      if (!device._id || !device.name) { alert('Please fill ID and Name'); return }

      const currentStr = JSON.stringify(device);
      const originalStr = originalDevice ? JSON.stringify(originalDevice) : null;
      const isDataChanged = !originalDevice || currentStr !== originalStr;

      let dataToSave = { ...device };

      if (activeTab === 'dashboard') {
        if (!isDataChanged) { alert('No layout changes to save.'); return; }
        dataToSave.revision = (Number(dataToSave.revision) || 1) + 1;
      } else {
        if (!isDataChanged && !isCreateMode) {
          const confirmNewTag = window.confirm('ข้อมูลไม่มีการเปลี่ยนแปลง\nต้องการสร้าง Tag ใหม่เพิ่ม 1 อัน ใช่หรือไม่?');
          if (!confirmNewTag) return;
        }
        dataToSave.revision = isCreateMode ? 1 : (Number(dataToSave.revision) || 1) + 1; 
        const nextTagNumber = dataToSave.tags.length + 1;
        const autoNewTag = { 
          label: `tag${nextTagNumber}`, script: '', updateInterval: '1sec', 
          record: true, sync: true, api: false, line: false, email: false, 
          alarm: 'Off', spLow: '25', spHigh: '35', critical: 'Low', title: '', alert: '', description: '',
          x: 50 + (nextTagNumber * 20), y: 50 + (nextTagNumber * 20)  
        };
        dataToSave.tags = [...dataToSave.tags, autoNewTag];
      }

      setSaving(true)
      const auth = getAuth()
      const url = isCreateMode ? '/api/preferences/createDocument' : '/api/preferences/updateDocument'
      
      const resp = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
        body: JSON.stringify({ collection: collectionName, data: dataToSave })
      })
      
      const json = await resp.json()
      if (json.error) throw new Error(json.error)
      if (isCreateMode && !Array.isArray(json)) throw new Error('Device ID "' + dataToSave._id + '" already exists. Please use a different ID.')

      setDevice(dataToSave)
      setOriginalDevice(JSON.parse(JSON.stringify(dataToSave)))

      if (activeTab === 'dashboard') alert('Dashboard layout saved successfully!');
      else if (isCreateMode) { navigate(`/dashboard/${dataToSave._id}`, { replace: true }); alert('Device created!'); }
      else alert('Saved Device & Generated a new Tag successfully!');

    } catch (error) { alert('Error saving data: ' + error.message) } 
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if(!window.confirm(`Delete ${device.name}?`)) return;
    try {
        setSaving(true)
        const auth = getAuth()
        await fetch('/api/preferences/deleteDocument', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
            body: JSON.stringify({ collection: collectionName, query: { _id: device._id } })
        })
        navigate('/dashboard')
    } catch (error) { alert('Delete failed'); setSaving(false) }
  }

  const deleteTag = async (indexToRemove) => {
    if(!window.confirm(`Are you sure you want to delete Tag ${indexToRemove + 1}?`)) return;
    try {
      setSaving(true);
      const remainingTags = device.tags.filter((_, i) => i !== indexToRemove);
      const reorderedTags = remainingTags.map((tag, i) => ({ ...tag, label: `tag${i + 1}` }));

      if (isCreateMode) {
        setDevice(prev => ({ ...prev, tags: reorderedTags }));
        setTagResults({}); setSaving(false); return;
      }

      const dataToSave = { ...device, tags: reorderedTags, revision: (Number(device.revision) || 1) + 1 };
      const auth = getAuth();
      const resp = await fetch('/api/preferences/updateDocument', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
        body: JSON.stringify({ collection: collectionName, data: dataToSave })
      });
      const json = await resp.json();
      if (json.error) throw new Error(json.error);

      setDevice(dataToSave); setOriginalDevice(JSON.parse(JSON.stringify(dataToSave))); 
      const newResults = { ...tagResults }; delete newResults[indexToRemove];
      setTagResults(newResults); tagResultsRef.current = newResults;
      lastRunTimes.current = {}; 
      alert('Tag deleted and reordered successfully!');
    } catch (error) { alert('Error deleting tag: ' + error.message); } 
    finally { setSaving(false); }
  }

  const handleMouseDown = (e, indexOrType) => {
    e.preventDefault();
    const canvas = e.currentTarget.parentElement;
    const canvasRect = canvas.getBoundingClientRect();
    setDraggingIdx(indexOrType);
    setDragStartPos({ x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top });
  }

  const handleMouseMove = (e) => {
    if (draggingIdx === null) return;
    const canvas = e.currentTarget;
    const canvasRect = canvas.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left;
    const newY = e.clientY - canvasRect.top;
    const dx = newX - dragStartPos.x;
    const dy = newY - dragStartPos.y;
    setDragStartPos({ x: newX, y: newY });

    if (draggingIdx === 'chart') {
      setDevice(prev => ({ ...prev, chartX: (prev.chartX || 200) + dx, chartY: (prev.chartY || 200) + dy }));
    } else if (draggingIdx === 'datetime') {
      setDevice(prev => ({ ...prev, datetimeX: (prev.datetimeX || 500) + dx, datetimeY: (prev.datetimeY || 50) + dy }));
    } else {
      const newTags = [...device.tags];
      newTags[draggingIdx] = {
        ...newTags[draggingIdx],
        x: (newTags[draggingIdx].x || 50) + dx,
        y: (newTags[draggingIdx].y || 50) + dy,
      };
      setDevice(prev => ({ ...prev, tags: newTags }));
    }
  }

  const handleMouseUp = () => { setDraggingIdx(null); }

  if (loading) {
    return (
      <Page pageTitle="Loading...">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
      </Page>
    )
  }

  return (
    <Page pageTitle={isCreateMode ? 'Create Device' : `Device: ${device.name}`}>
      <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

        {/* ── Top action bar ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} size="small">Back</Button>
          <Divider orientation="vertical" flexItem />

          {/* ── Tab buttons ── */}
          <Button
            size="small" variant={activeTab === 'devices' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('devices')}
          >
            DEVICES
          </Button>
          <Button
            size="small" variant={activeTab === 'dashboard' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('dashboard')}
          >
            DASHBOARD
          </Button>

          <Box sx={{ flex: 1 }} />

          {/* ✅ ปุ่ม Open IoT Dashboard (ใหม่) — แสดงเฉพาะตอนไม่ใช่ create mode */}
          {!isCreateMode && (
            <Button
              variant="outlined"
              color="info"
              size="small"
              startIcon={<DashboardIcon />}
              onClick={() => navigate(`/dashboard/${id}/view`)}
              sx={{ mr: 1 }}
            >
              Open Dashboard
            </Button>
          )}

          <Button
            variant="contained" color="primary" size="small"
            onClick={handleSave} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>

          {!isCreateMode && (
            <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={handleDelete} disabled={saving}>
              Delete
            </Button>
          )}
        </Box>

        {/* ── DEVICES tab content ── */}
        {activeTab === 'devices' && (
          <Box sx={{ overflowY: 'auto', p: 3, flex: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Device Info</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}><TextField label="Device ID" name="_id" value={device._id} onChange={handleChange} fullWidth size="small" disabled={!isCreateMode} /></Grid>
                  <Grid item xs={6}><TextField label="Name" name="name" value={device.name} onChange={handleChange} fullWidth size="small" /></Grid>
                  <Grid item xs={6}>
                    <TextField select label="Connection" name="connection" value={device.connection} onChange={handleChange} fullWidth size="small">
                      {['Virtual', 'Modbus TCP', 'MQTT', 'HTTP'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={6}><TextField label="IP Address" name="ipAddr" value={device.ipAddr} onChange={handleChange} fullWidth size="small" /></Grid>
                  <Grid item xs={6}><TextField label="Model" name="model" value={device.model} onChange={handleChange} fullWidth size="small" /></Grid>
                  <Grid item xs={6}>
                    <TextField select label="Status" name="status" value={device.status} onChange={handleChange} fullWidth size="small">
                      {['Active', 'Inactive'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}><TextField label="Remark" name="remark" value={device.remark} onChange={handleChange} fullWidth size="small" multiline rows={2} /></Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Tags ({device.tags.length})</Typography>
                {device.tags.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No tags yet. Click Save to add the first tag.</Typography>
                )}
                {device.tags.map((tag, index) => (
                  <Accordion key={index} expanded={expandedPanel === index} onChange={() => setExpandedPanel(expandedPanel === index ? false : index)} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="body2" fontWeight="bold">{tag.label || `Tag ${index+1}`}</Typography>
                        <Typography variant="caption" sx={{ bgcolor: '#e3f2fd', px: 1, borderRadius: 1, ml: 1 }}>
                          {tagResults[index] !== null && tagResults[index] !== undefined ? String(tagResults[index]) : '...'}
                        </Typography>
                        {tagErrors[index] && <Typography variant="caption" color="error" sx={{ ml: 1 }}>ERR</Typography>}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}><TextField label="Label" value={tag.label} onChange={e => handleTagChange(index, 'label', e.target.value)} fullWidth size="small" /></Grid>
                        <Grid item xs={6}>
                          <TextField select label="Update Interval" value={tag.updateInterval || '1sec'} onChange={e => handleTagChange(index, 'updateInterval', e.target.value)} fullWidth size="small">
                            {['1sec','15sec','30sec','1min','daily','week','month','year'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                          </TextField>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField label="Script (JS)" value={tag.script || ''} onChange={e => handleTagChange(index, 'script', e.target.value)} fullWidth size="small" multiline rows={3} sx={{ fontFamily: 'monospace' }} />
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button size="small" variant="outlined" startIcon={<PlayArrowIcon />} onClick={e => runTagScript(index, e)}>Run</Button>
                            {tagErrors[index] && <Typography variant="caption" color="error">{tagErrors[index]}</Typography>}
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {['record','sync','api','line','email'].map(field => (
                              <FormControlLabel key={field} control={<Checkbox size="small" checked={!!tag[field]} onChange={e => handleTagChange(index, field, e.target.checked)} />} label={field} />
                            ))}
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 0.5 }} />
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <TextField label="SP Low" value={tag.spLow || ''} onChange={e => handleTagChange(index, 'spLow', e.target.value)} size="small" sx={{ width: 90 }} />
                            <TextField label="SP High" value={tag.spHigh || ''} onChange={e => handleTagChange(index, 'spHigh', e.target.value)} size="small" sx={{ width: 90 }} />
                            <TextField select label="Alarm" value={tag.alarm || 'Off'} onChange={e => handleTagChange(index, 'alarm', e.target.value)} size="small" sx={{ width: 90 }}>
                              {['Off','On'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                            </TextField>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => deleteTag(index)}>Delete Tag</Button>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ── DASHBOARD tab content ── */}
        {activeTab === 'dashboard' && (
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

            {/* Canvas */}
            <Box
              sx={{ flex: 1, position: 'relative', overflow: 'hidden', bgcolor: '#f9f9f9',
                backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
                backgroundSize: '24px 24px', cursor: draggingIdx !== null ? 'grabbing' : 'default' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Tag value boxes */}
              {device.tags.map((tag, index) => (
                <Box
                  key={index} onMouseDown={(e) => handleMouseDown(e, index)}
                  sx={{ position: 'absolute', left: tag.x !== undefined ? tag.x : 50 + (index*20), top: tag.y !== undefined ? tag.y : 50 + (index*20), width: 140, height: 80, bgcolor: '#fff', border: draggingIdx === index ? '2px solid #1976d2' : '1px solid #ccc', boxShadow: draggingIdx === index ? 6 : 1, borderRadius: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: draggingIdx === index ? 'grabbing' : 'grab', userSelect: 'none', zIndex: draggingIdx === index ? 10 : 1 }}
                >
                  <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>{tagResults[index] !== null && tagResults[index] !== undefined ? String(tagResults[index]) : '...'}</Typography>
                  <Typography variant="caption" sx={{ color: '#888', mt: 0.5 }}>{tag.label || `Tag ${index+1}`}</Typography>
                </Box>
              ))}

              {/* Chart box */}
              {device.showChart && (
                <Box
                  onMouseDown={(e) => handleMouseDown(e, 'chart')}
                  sx={{ position: 'absolute', left: device.chartX || 200, top: device.chartY || 200, width: 650, height: 400, bgcolor: '#fff', border: draggingIdx === 'chart' ? '2px solid #ff9800' : '1px solid #ccc', boxShadow: draggingIdx === 'chart' ? 6 : 2, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', cursor: draggingIdx === 'chart' ? 'grabbing' : 'grab', zIndex: draggingIdx === 'chart' ? 10 : 2 }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} onMouseDown={e => e.stopPropagation()}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#555' }}>
                      {isHistoricalMode ? `Mixed Chart (History: ${selectedDate})` : 'Mixed Chart (Live Data)'}
                    </Typography>
                    <IconButton size="small" onClick={() => setDevice(prev => ({ ...prev, showChart: false }))}><CloseIcon /></IconButton>
                  </Box>
                  <Box sx={{ flex: 1, width: '100%', position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
                    {isChartLoading && (
                      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 5 }}>
                        <CircularProgress size={30} /><Typography sx={{ ml: 2, color: '#888', fontWeight: 'bold' }}>Loading History...</Typography>
                      </Box>
                    )}
                    {!isChartLoading && isHistoricalMode && historicalChartData.length === 0 && (
                      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4 }}>
                        <Typography sx={{ color: '#aaa', fontStyle: 'italic' }}>ไม่มีการเก็บบันทึกข้อมูลในวันที่เลือก</Typography>
                      </Box>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={isHistoricalMode ? historicalChartData : realtimeChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="time" tick={{fontSize: 12}} tickLine={false} />
                        <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <Tooltip />
                        {device.tags.map((tag, index) => {
                           if (!tag.script || !tag.script.trim() || !tag.record) return null; 
                           return <Line key={index} type="monotone" dataKey={tag.label || `Tag ${index + 1}`} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} dot={isHistoricalMode} isAnimationActive={isHistoricalMode} />
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}

              {/* Datetime box */}
              {device.showDatetime && (
                <Box
                  onMouseDown={(e) => handleMouseDown(e, 'datetime')}
                  sx={{ position: 'absolute', left: device.datetimeX || 500, top: device.datetimeY || 50, width: 280, bgcolor: '#fff', border: draggingIdx === 'datetime' ? '2px solid #e91e63' : '1px solid #ccc', boxShadow: draggingIdx === 'datetime' ? 6 : 2, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', cursor: draggingIdx === 'datetime' ? 'grabbing' : 'grab', zIndex: draggingIdx === 'datetime' ? 10 : 3 }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }} onMouseDown={e => e.stopPropagation()}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#555', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DateRangeIcon fontSize="small" sx={{ color: '#e91e63' }} /> Date Selection
                    </Typography>
                    <IconButton size="small" onClick={() => setDevice(prev => ({ ...prev, showDatetime: false }))}><CloseIcon fontSize="small" /></IconButton>
                  </Box>
                  <Box onMouseDown={e => e.stopPropagation()}>
                    <TextField type="date" size="small" fullWidth value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} inputProps={{ max: today }} sx={{ bgcolor: '#f9f9f9' }} />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#888', textAlign: 'center' }}>Select a past date to view history.</Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Tools sidebar */}
            <Box sx={{ width: 250, bgcolor: '#fff', borderLeft: '1px solid #ddd', p: 0, overflowY: 'auto' }}>
              <Box sx={{ p: 2, bgcolor: '#1976d2', color: '#fff' }}>
                <Typography variant="subtitle2" fontWeight="bold">Tools</Typography>
              </Box>
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { color: '#1976d2' }, p: 0.5 }}>
                  <TextFieldsIcon sx={{ color: '#f44336' }} /> <Typography variant="body2">Textbox</Typography>
                </Box>
                <Box onClick={() => setDevice(prev => ({ ...prev, showChart: true }))} sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { color: '#1976d2' }, bgcolor: device.showChart ? '#fff3e0' : 'transparent', p: 0.5, borderRadius: 1 }}>
                  <InsertChartIcon sx={{ color: '#ff9800' }} /> <Typography variant="body2" fontWeight={device.showChart ? 'bold' : 'normal'}>Chart</Typography>
                </Box>
                <Box onClick={() => setDevice(prev => ({ ...prev, showDatetime: true }))} sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { color: '#1976d2' }, bgcolor: device.showDatetime ? '#fce4ec' : 'transparent', p: 0.5, borderRadius: 1 }}>
                  <DateRangeIcon sx={{ color: '#e91e63' }} /> <Typography variant="body2" fontWeight={device.showDatetime ? 'bold' : 'normal'}>Datetime</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 0.5, opacity: 0.4 }}>
                  <SpeedIcon sx={{ color: '#9c27b0' }} /> <Typography variant="body2">Gauge (coming soon)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 0.5, opacity: 0.4 }}>
                  <MapIcon sx={{ color: '#4caf50' }} /> <Typography variant="body2">Map (coming soon)</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 0.5 }}>
                  * Click tool to open, drag on canvas to arrange.
                </Typography>

                {/* ✅ ปุ่ม shortcut ไป IoT Dashboard */}
                <Divider sx={{ my: 1 }} />
                {!isCreateMode && (
                  <Button
                    fullWidth variant="outlined" color="info" size="small"
                    startIcon={<DashboardIcon />}
                    onClick={() => navigate(`/dashboard/${id}/view`)}
                  >
                    Open IoT Dashboard
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        )}

      </Box>
    </Page>
  )
}

export default DevicePage