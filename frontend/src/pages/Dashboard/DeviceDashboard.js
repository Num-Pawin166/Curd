import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Page from '../../containers/Page/Page'
import {
  Box, Typography, CircularProgress, IconButton, TextField, Tooltip
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import DateRangeIcon from '@mui/icons-material/DateRange'
import InsertChartIcon from '@mui/icons-material/InsertChart'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts'

// ──────────────────────────────────────────────────────────────
// Constants & helpers
// ──────────────────────────────────────────────────────────────
const CHART_COLORS = ['#29b6f6', '#66bb6a', '#ff9800', '#9c27b0', '#f44336', '#00bcd4', '#795548', '#607d8b']
const PAGE_COUNT = 3

const jsexe = async (code) => {
  try {
    const func = new Function(`return (${code})`)
    const result = func()
    if (result instanceof Promise) return await result
    return result
  } catch (error) { throw error }
}

const getIntervalMs = (intervalStr) => {
  const map = {
    '1sec': 1000, '15sec': 15000, '30sec': 30000, '1min': 60000,
    'daily': 86400000, 'week': 604800000, 'month': 2592000000, 'year': 31536000000,
  }
  return map[intervalStr] || 1000
}

function getAuth() {
  try {
    const item = localStorage.getItem('base-shell:auth')
    return item ? JSON.parse(item) : null
  } catch { return null }
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

/** Live clock widget */
function DateTimeWidget({ x, y, onClose, onMouseDown, isDragging }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const pad = (n) => String(n).padStart(2, '0')

  return (
    <Box
      onMouseDown={onMouseDown}
      sx={{
        position: 'absolute', left: x, top: y, zIndex: isDragging ? 10 : 5,
        bgcolor: '#fff',
        border: isDragging ? '2px solid #e91e63' : '1px solid #e0e0e0',
        borderRadius: 2, boxShadow: isDragging ? 6 : 2,
        p: 1.5, minWidth: 170,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
        onMouseDown={e => e.stopPropagation()}>
        <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#aaa', letterSpacing: 2, textTransform: 'uppercase' }}>
          DATETIME
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ p: 0.2 }}>
          <CloseIcon sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>
      <Typography sx={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700, color: '#1a237e', lineHeight: 1.1 }}>
        {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
      </Typography>
      <Typography sx={{ fontSize: 11, color: '#999', fontFamily: 'monospace', mt: 0.3 }}>
        {now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
      </Typography>
    </Box>
  )
}

/** Numeric tag card */
function TagWidget({ value, label, color, x, y, onMouseDown, isDragging }) {
  return (
    <Box
      onMouseDown={onMouseDown}
      sx={{
        position: 'absolute', left: x, top: y, zIndex: isDragging ? 10 : 1,
        width: 140, height: 78,
        bgcolor: '#fff',
        border: isDragging ? `2px solid ${color}` : '1px solid #e0e0e0',
        borderLeft: `4px solid ${color}`,
        borderRadius: 1.5, boxShadow: isDragging ? 6 : 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none', transition: 'box-shadow 0.15s',
      }}
    >
      <Typography sx={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: '#212121', lineHeight: 1 }}>
        {value !== null && value !== undefined && !isNaN(Number(value))
          ? Number(value).toFixed(1)
          : value !== null && value !== undefined ? String(value) : '—'}
      </Typography>
      <Typography sx={{ fontSize: 11, color: '#9e9e9e', mt: 0.4 }}>{label}</Typography>
    </Box>
  )
}

/** Mixed Chart widget */
function ChartWidget({ data, tags, x, y, onMouseDown, onClose, isDragging, title }) {
  return (
    <Box
      onMouseDown={onMouseDown}
      sx={{
        position: 'absolute', left: x, top: y, zIndex: isDragging ? 10 : 2,
        width: 640, height: 370,
        bgcolor: '#fff',
        border: isDragging ? '2px solid #ff9800' : '1px solid #e0e0e0',
        borderRadius: 2, boxShadow: isDragging ? 8 : 2,
        p: 2, display: 'flex', flexDirection: 'column',
        cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
        onMouseDown={e => e.stopPropagation()}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#555' }}>{title}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {['⊕', '⊖', '↺', '⊙', '⤢', '☰'].map((ic, i) => (
            <Typography key={i} sx={{ fontSize: 13, color: '#ccc', cursor: 'pointer', px: 0.3, '&:hover': { color: '#555' } }}>
              {ic}
            </Typography>
          ))}
          <IconButton size="small" onClick={onClose} sx={{ p: 0.3, ml: 0.5 }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ flex: 1, width: '100%' }} onMouseDown={e => e.stopPropagation()}>
        {data.length === 0 ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#ccc', fontStyle: 'italic', fontSize: 13 }}>Waiting for data…</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#bbb' }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#bbb' }} tickLine={false} axisLine={false}
                label={{ value: 'Left title', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 10, fill: '#ccc' } }}
              />
              <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
              {tags.map((tag, idx) => {
                if (!tag.script?.trim() || !tag.record) return null
                const color = CHART_COLORS[idx % CHART_COLORS.length]
                if (idx === 0) {
                  return (
                    <Area
                      key={idx} type="monotone"
                      dataKey={tag.label || `Tag ${idx + 1}`}
                      stroke={color} fill={color} fillOpacity={0.3}
                      strokeWidth={2} dot={false} isAnimationActive={false}
                    />
                  )
                }
                return (
                  <Line
                    key={idx} type="monotone"
                    dataKey={tag.label || `Tag ${idx + 1}`}
                    stroke={color}
                    strokeWidth={2} dot={false} isAnimationActive={false}
                  />
                )
              })}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  )
}

/** Blue page tabs */
function PageTabBar({ active, onChange, deviceName }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center',
      bgcolor: '#1565c0', px: 1, height: 40, flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.15)',
    }}>
      {Array.from({ length: PAGE_COUNT }, (_, i) => (
        <Box key={i} onClick={() => onChange(i)} sx={{
          px: 2.5, py: 1, cursor: 'pointer',
          color: active === i ? '#fff' : 'rgba(255,255,255,0.5)',
          borderBottom: active === i ? '2px solid #fff' : '2px solid transparent',
          fontSize: 13, fontWeight: active === i ? 700 : 400,
          userSelect: 'none', transition: 'all 0.15s',
          '&:hover': { color: '#fff' },
        }}>
          Page {i + 1}
        </Box>
      ))}
      <Box sx={{ flex: 1 }} />
      <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', mr: 1.5 }}>
        {deviceName}
      </Typography>
      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', mr: 1 }} />
    </Box>
  )
}

// ──────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────
const DeviceDashboard = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [device, setDevice] = useState(null)
  const [loading, setLoading] = useState(true)

  const [tagValues, setTagValues] = useState({})
  const tagValuesRef = useRef({})
  const lastRunTimes = useRef({})
  const tagsRef = useRef([])

  const [chartData, setChartData] = useState([])

  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [histData, setHistData] = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const isHistorical = selectedDate !== today

  const [activePage, setActivePage] = useState(0)
  const [pages, setPages] = useState(() =>
    Array.from({ length: PAGE_COUNT }, () => ({
      showChart: false,   chartX: 220,  chartY: 80,
      showDatetime: true, datetimeX: 820, datetimeY: 20,
      tagPositions: {},
    }))
  )
  const [dragging, setDragging] = useState(null)

  // fetch device + today's history as initial chart data
  useEffect(() => {
    async function fetchDevice() {
      try {
        const auth = getAuth()
        if (!auth) return
        const resp = await fetch('/api/preferences/readDocument', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
          body: JSON.stringify({ collection: 'Device', query: { _id: id } }),
        })
        const json = await resp.json()
        if (Array.isArray(json) && json.length > 0) {
          const d = json[0]
          if (!d.tags) d.tags = []
          setDevice(d)
          tagsRef.current = d.tags

          const tagPositions = {}
          d.tags.forEach((tag, idx) => {
            tagPositions[idx] = {
              x: tag.x !== undefined ? tag.x : 50 + idx * 160,
              y: tag.y !== undefined ? tag.y : 50,
            }
          })

          setPages(prev => prev.map(pg => ({
            ...pg,
            showChart: d.showChart || false,
            chartX: d.chartX || 220, chartY: d.chartY || 80,
            showDatetime: d.showDatetime !== undefined ? d.showDatetime : true,
            datetimeX: d.datetimeX || 820, datetimeY: d.datetimeY || 20,
            tagPositions,
          })))

          // โหลด history ของวันนี้มาเป็น initial chart data
          const todayStr = new Date().toISOString().split('T')[0]
          const histResp = await fetch('/api/preferences/readDocument', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
            body: JSON.stringify({ collection: 'HistoryData', query: { deviceId: id, date: todayStr } }),
          })
          const histJson = await histResp.json()
          if (Array.isArray(histJson) && histJson.length > 0) {
            histJson.sort((a, b) => a.timestamp - b.timestamp)
            setChartData(histJson)
          }
        } else {
          alert('Device not found')
          navigate('/dashboard')
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchDevice()
  }, [id, navigate])

  // live script engine
  useEffect(() => {
    if (!device) return
    tagsRef.current = device.tags

    const interval = setInterval(async () => {
      const tags = tagsRef.current
      const now = Date.now()
      const newVals = { ...tagValuesRef.current }
      let hasUpdate = false

      await Promise.all(tags.map(async (tag, idx) => {
        if (!tag.script?.trim()) return
        const ms = getIntervalMs(tag.updateInterval)
        if (now - (lastRunTimes.current[idx] || 0) >= ms) {
          try { newVals[idx] = await jsexe(tag.script) }
          catch { newVals[idx] = 'ERR' }
          lastRunTimes.current[idx] = now
          hasUpdate = true
        }
      }))

      if (hasUpdate) {
        setTagValues({ ...newVals })
        tagValuesRef.current = newVals

        if (!isHistorical) {
          const timeStr = new Date().toLocaleTimeString('th-TH', { hour12: false })
          const point = { time: timeStr }
          tags.forEach((tag, idx) => {
            const v = parseFloat(newVals[idx])
            if (!isNaN(v)) point[tag.label || `Tag ${idx + 1}`] = v
          })
          setChartData(prev => {
            const next = [...prev, point]
            return next.length > 500 ? next.slice(-500) : next
          })
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [device, isHistorical])

  // fetch historical data
  useEffect(() => {
    if (!isHistorical || !device) return
    setHistLoading(true)
    async function fetchHist() {
      try {
        const auth = getAuth()
        if (!auth) return
        const resp = await fetch('/api/preferences/readDocument', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
          body: JSON.stringify({ collection: 'HistoryData', query: { deviceId: id, date: selectedDate } }),
        })
        const json = await resp.json()
        if (Array.isArray(json) && json.length > 0) {
          json.sort((a, b) => a.timestamp - b.timestamp)
          setHistData(json)
        } else setHistData([])
      } catch (e) { console.error(e); setHistData([]) }
      finally { setHistLoading(false) }
    }
    fetchHist()
  }, [selectedDate, isHistorical, id, device])

  // drag
  const handleMouseDown = (e, key) => {
    e.preventDefault()
    const pg = pages[activePage]
    let origX, origY
    if (key === 'chart')         { origX = pg.chartX;    origY = pg.chartY }
    else if (key === 'datetime') { origX = pg.datetimeX; origY = pg.datetimeY }
    else { origX = pg.tagPositions[key]?.x ?? 50; origY = pg.tagPositions[key]?.y ?? 50 }
    setDragging({ key, startX: e.clientX, startY: e.clientY, origX, origY })
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const nx = dragging.origX + (e.clientX - dragging.startX)
      const ny = dragging.origY + (e.clientY - dragging.startY)
      setPages(prev => prev.map((pg, i) => {
        if (i !== activePage) return pg
        if (dragging.key === 'chart')    return { ...pg, chartX: nx, chartY: ny }
        if (dragging.key === 'datetime') return { ...pg, datetimeX: nx, datetimeY: ny }
        return { ...pg, tagPositions: { ...pg.tagPositions, [dragging.key]: { x: nx, y: ny } } }
      }))
    }
    const onUp = () => setDragging(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, activePage])

  const updatePage = (field, value) =>
    setPages(prev => prev.map((pg, i) => i === activePage ? { ...pg, [field]: value } : pg))

  const pg = pages[activePage]
  const displayData = isHistorical ? histData : chartData
  const chartTitle = isHistorical ? `Mixed Chart  (History: ${selectedDate})` : 'Mixed Chart  (Live)'

  if (loading) {
    return (
      <Page pageTitle="Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
      </Page>
    )
  }

  return (
    <Page pageTitle={device?.name || 'Dashboard'}>

      {/* ── Blue page-tab bar ── */}
      <PageTabBar active={activePage} onChange={setActivePage} deviceName={device?.name} />

      {/* ── Toolbar ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.5,
        px: 1.5, py: 0.6,
        bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', flexShrink: 0,
      }}>
        <Tooltip title="Back to device list">
          <IconButton size="small" onClick={() => navigate('/dashboard')}>
            <ArrowBackIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
        <Box sx={{ width: 1, height: 22, bgcolor: '#ddd', mx: 0.5 }} />

        <Tooltip title="Toggle chart">
          <Box onClick={() => updatePage('showChart', !pg.showChart)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 1.5, py: 0.5, borderRadius: 1, cursor: 'pointer', fontSize: 12,
              bgcolor: pg.showChart ? '#fff3e0' : 'transparent',
              color: pg.showChart ? '#e65100' : '#666',
              fontWeight: pg.showChart ? 700 : 400,
              '&:hover': { bgcolor: '#ffe0b2' },
            }}>
            <InsertChartIcon sx={{ fontSize: 15 }} /> Chart
          </Box>
        </Tooltip>

        <Tooltip title="Toggle clock">
          <Box onClick={() => updatePage('showDatetime', !pg.showDatetime)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 1.5, py: 0.5, borderRadius: 1, cursor: 'pointer', fontSize: 12,
              bgcolor: pg.showDatetime ? '#fce4ec' : 'transparent',
              color: pg.showDatetime ? '#c2185b' : '#666',
              fontWeight: pg.showDatetime ? 700 : 400,
              '&:hover': { bgcolor: '#f8bbd0' },
            }}>
            <AccessTimeIcon sx={{ fontSize: 15 }} /> DateTime
          </Box>
        </Tooltip>

        <Box sx={{ width: 1, height: 22, bgcolor: '#ddd', mx: 0.5 }} />

        <Tooltip title="View historical data">
          <Box onClick={() => setShowDatePicker(p => !p)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 1.5, py: 0.5, borderRadius: 1, cursor: 'pointer', fontSize: 12,
              bgcolor: isHistorical ? '#e8f5e9' : 'transparent',
              color: isHistorical ? '#2e7d32' : '#666',
              fontWeight: isHistorical ? 700 : 400,
              '&:hover': { bgcolor: '#c8e6c9' },
            }}>
            <DateRangeIcon sx={{ fontSize: 15 }} />
            {isHistorical ? selectedDate : 'History'}
          </Box>
        </Tooltip>

        {showDatePicker && (
          <TextField
            type="date" size="small" value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setShowDatePicker(false) }}
            inputProps={{ max: today }}
            sx={{ width: 155, '& input': { fontSize: 12, py: 0.5, px: 1 } }}
            autoFocus onBlur={() => setShowDatePicker(false)}
          />
        )}

        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mr: 1 }}>
          <Box sx={{
            width: 7, height: 7, borderRadius: '50%',
            bgcolor: isHistorical ? '#ff9800' : '#4caf50',
            boxShadow: isHistorical ? 'none' : '0 0 0 3px #c8e6c9',
          }} />
          <Typography sx={{ fontSize: 11, color: '#999' }}>
            {isHistorical ? `History: ${selectedDate}` : 'LIVE'}
          </Typography>
        </Box>
      </Box>

      {/* ── Canvas ── */}
      <Box sx={{
        position: 'relative', flex: 1,
        width: '100%', height: 'calc(100vh - 170px)',
        bgcolor: '#fafafa', overflow: 'hidden',
        backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}>

        {/* Tag value cards */}
        {device?.tags?.map((tag, idx) => {
          const pos = pg.tagPositions[idx] || { x: 50 + idx * 160, y: 50 }
          return (
            <TagWidget
              key={idx}
              value={tagValues[idx]}
              label={tag.label || `Tag ${idx + 1}`}
              color={CHART_COLORS[idx % CHART_COLORS.length]}
              x={pos.x} y={pos.y}
              isDragging={dragging?.key === idx}
              onMouseDown={(e) => handleMouseDown(e, idx)}
            />
          )
        })}

        {/* Chart */}
        {pg.showChart && (
          histLoading ? (
            <Box sx={{
              position: 'absolute', left: pg.chartX, top: pg.chartY,
              width: 640, height: 370,
              bgcolor: '#fff', border: '1px solid #eee', borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 1.5, fontSize: 13, color: '#999' }}>Loading history…</Typography>
            </Box>
          ) : (
            <ChartWidget
              data={displayData} tags={device?.tags || []}
              x={pg.chartX} y={pg.chartY}
              isDragging={dragging?.key === 'chart'}
              onMouseDown={(e) => handleMouseDown(e, 'chart')}
              onClose={() => updatePage('showChart', false)}
              title={chartTitle}
            />
          )
        )}

        {/* DateTime */}
        {pg.showDatetime && (
          <DateTimeWidget
            x={pg.datetimeX} y={pg.datetimeY}
            isDragging={dragging?.key === 'datetime'}
            onMouseDown={(e) => handleMouseDown(e, 'datetime')}
            onClose={() => updatePage('showDatetime', false)}
          />
        )}

        {/* Empty state */}
        {device?.tags?.length === 0 && (
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)', textAlign: 'center', color: '#ccc',
          }}>
            <Typography variant="h6">No tags configured</Typography>
            <Typography variant="body2">Go to Device settings to add tags.</Typography>
          </Box>
        )}
      </Box>
    </Page>
  )
}

export default DeviceDashboard