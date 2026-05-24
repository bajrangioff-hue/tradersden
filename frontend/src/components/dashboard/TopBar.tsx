import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Users, ChevronDown, LayoutGrid, Bell, BellOff, Upload, X, User, Settings, HelpCircle, LogOut, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { createTrade } from '../../lib/api'

interface CsvTradeRow {
  date: string
  symbol: string
  direction: string
  entry: number
  exit: number | null
  size: number
  pnl: number | null
  r_value: string
  session: string
  setup: string
  outcome: string
}

const EXPECTED_HEADERS = ['date', 'symbol', 'direction', 'entry', 'exit', 'size', 'pnl', 'r_value', 'session', 'setup', 'outcome']

function parseCsv(text: string): CsvTradeRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) throw new Error('CSV is empty')

  const headerLine = lines[0].toLowerCase()
  const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))

  const missing = EXPECTED_HEADERS.filter(eh => !headers.includes(eh))
  if (missing.length > 0) {
    throw new Error(`Invalid CSV format. Expected columns: ${EXPECTED_HEADERS.join(', ')}`)
  }

  const colIndex = (name: string) => headers.indexOf(name)

  const rows: CsvTradeRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i])
    if (vals.length < headers.length) continue
    const get = (name: string) => (vals[colIndex(name)] || '').trim().replace(/^["']|["']$/g, '')
    const num = (name: string) => {
      const v = get(name)
      return v ? parseFloat(v.replace(/[$,]/g, '')) : null
    }
    const date = get('date')
    const symbol = get('symbol').toUpperCase()
    if (!date || !symbol) continue

    rows.push({
      date,
      symbol,
      direction: get('direction').toUpperCase(),
      entry: num('entry') ?? 0,
      exit: num('exit'),
      size: num('size') ?? 1,
      pnl: num('pnl'),
      r_value: get('r_value'),
      session: get('session'),
      setup: get('setup'),
      outcome: get('outcome').toUpperCase(),
    })
  }

  if (rows.length === 0) throw new Error('No valid trade rows found in CSV')
  return rows
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

interface TopBarProps {
  title?: string
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatDateRange(date: Date): string {
  const month = MONTHS[date.getMonth()]
  const year = date.getFullYear()
  const lastDay = new Date(year, date.getMonth() + 1, 0).getDate()
  return `${month} 1 - ${month} ${lastDay}, ${year}`
}

export default function TopBar({ title = 'Dashboard' }: TopBarProps) {
  const { user, logout } = useAuth()
  const displayName = user?.display_name || user?.email?.split('@')[0] || 'User'
  const email = user?.email || ''
  const initial = displayName.charAt(0).toUpperCase()

  const [dateCursor, setDateCursor] = useState(() => new Date())
  const [accountOpen, setAccountOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState('All Accounts')
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [importOpen, setImportOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<CsvTradeRow[]>([])
  const [csvError, setCsvError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const accountRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const closeAllDropdowns = useCallback(() => {
    setAccountOpen(false)
    setNotifOpen(false)
    setProfileOpen(false)
  }, [])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAllDropdowns()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [closeAllDropdowns])

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 2000); return () => clearTimeout(t) }
  }, [toast])

  const prevMonth = () => setDateCursor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setDateCursor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const showToast = (msg: string) => {
    setToast(msg); closeAllDropdowns()
  }

  const handleImport = () => {
    setImportOpen(true)
    setCsvFile(null)
    setParsedRows([])
    setCsvError('')
    setImportError('')
    setImportProgress(0)
    closeAllDropdowns()
  }

  const handleFile = (file: File | null) => {
    if (!file) return
    setCsvError('')
    setImportError('')
    setParsedRows([])
    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const rows = parseCsv(text)
        setParsedRows(rows)
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : 'Failed to parse CSV')
        setCsvFile(null)
      }
    }
    reader.readAsText(file)
  }

  const startImport = async () => {
    if (parsedRows.length === 0) return
    setImporting(true)
    setImportProgress(0)
    setImportError('')
    let successCount = 0
    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i]
      try {
        await createTrade({
          symbol: row.symbol,
          direction: row.direction === 'SHORT' ? 'SHORT' : 'LONG',
          entry_price: row.entry,
          quantity: row.size,
          entry_time: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
          exit_price: row.exit ?? undefined,
          session: row.session || undefined,
          setup_tags: row.setup ? [row.setup] : undefined,
        })
        successCount++
      } catch {
        /* skip failed rows */
      }
      setImportProgress(Math.round(((i + 1) / parsedRows.length) * 100))
    }
    setImporting(false)
    if (successCount > 0) {
      setToastType('success')
      setToast(`${successCount} trades imported`)
      setImportOpen(false)
    } else {
      setImportError('All rows failed to import — check your CSV data')
    }
  }

  return (
    <>
      <div
        style={{
          width: '100%', height: 56,
          background: '#FFFFFF',
          borderBottom: '1px solid #EEF0F3',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky', top: 0, zIndex: 40,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A202C', fontFamily: 'Inter' }}>{title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16 }}>
            <button
              onClick={prevMonth}
              style={{
                width: 28, height: 28,
                border: '1px solid #EEF0F3', borderRadius: 6,
                background: '#FFFFFF', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.borderColor = '#6C5CE7'; (e.currentTarget.firstChild as HTMLElement).style.color = '#6C5CE7' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#EEF0F3'; (e.currentTarget.firstChild as HTMLElement).style.color = '#6B7280' }}
            >
              <ChevronLeft size={14} color="#6B7280" style={{ transition: 'color 150ms' }} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap', fontFamily: 'Inter' }}>
              {formatDateRange(dateCursor)}
            </span>
            <button
              onClick={nextMonth}
              style={{
                width: 28, height: 28,
                border: '1px solid #EEF0F3', borderRadius: 6,
                background: '#FFFFFF', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.borderColor = '#6C5CE7'; (e.currentTarget.firstChild as HTMLElement).style.color = '#6C5CE7' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#EEF0F3'; (e.currentTarget.firstChild as HTMLElement).style.color = '#6B7280' }}
            >
              <ChevronRight size={14} color="#6B7280" style={{ transition: 'color 150ms' }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap', fontFamily: 'Inter' }}>Last updated: 2 min ago</span>

          <div ref={accountRef} style={{ position: 'relative' }}>
            <div
              onClick={() => { setAccountOpen(o => !o); setNotifOpen(false); setProfileOpen(false) }}
              style={{
                height: 32, border: '1px solid #EEF0F3', borderRadius: 8,
                padding: '0 10px', background: '#FFFFFF',
                fontSize: 13, fontWeight: 500, color: '#374151',
                display: 'flex', alignItems: 'center', gap: 6,
                cursor: 'pointer', transition: 'background 150ms',
                fontFamily: 'Inter', boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => { if (!accountOpen) e.currentTarget.style.background = '#F9FAFB' }}
              onMouseLeave={(e) => { if (!accountOpen) e.currentTarget.style.background = '#FFFFFF' }}
            >
              <Users size={14} color="#9CA3AF" />
              {selectedAccount}
              <ChevronDown size={14} color="#9CA3AF" />
            </div>
            {accountOpen && (
              <div
                style={{
                  background: '#FFFFFF', border: '1px solid #EEF0F3', borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  padding: 6, position: 'absolute', top: 48, right: 0,
                  minWidth: 180, zIndex: 50,
                }}
              >
                {['All Accounts', 'Live Account', 'Paper Trading'].map((acc) => (
                  <div
                    key={acc}
                    onClick={() => { setSelectedAccount(acc); setAccountOpen(false) }}
                    style={{
                      padding: '8px 12px', borderRadius: 6,
                      fontSize: 13, color: '#374151',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer', fontFamily: 'Inter',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.color = '#6C5CE7' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151' }}
                  >
                    {acc}
                    {acc === selectedAccount && <span style={{ color: '#6C5CE7', fontSize: 14, fontWeight: 700 }}>&#10003;</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => showToast('Widget editing coming soon')}
            style={{
              height: 32, padding: '0 14px',
              border: '1px solid #EEF0F3', borderRadius: 8,
              background: '#FFFFFF', color: '#374151',
              fontSize: 13, fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 150ms', fontFamily: 'Inter',
              boxSizing: 'border-box', whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#EEF0F3' }}
          >
            <LayoutGrid size={14} color="#9CA3AF" />
            Edit Widgets
          </button>

          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setNotifOpen(o => !o); setAccountOpen(false); setProfileOpen(false) }}
              style={{
                width: 32, height: 32,
                border: '1px solid #EEF0F3', borderRadius: 8,
                background: '#FFFFFF', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', position: 'relative',
                transition: 'background 150ms', padding: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F3FF' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF' }}
            >
              <Bell size={16} color="#6B7280" style={{ transition: 'color 150ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#6C5CE7' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280' }}
              />
              <div
                style={{
                  width: 6, height: 6, background: '#E17055',
                  borderRadius: '50%', position: 'absolute',
                  top: 6, right: 6, border: '2px solid #FFFFFF',
                }}
              />
            </button>
            {notifOpen && (
              <div
                style={{
                  background: '#FFFFFF', border: '1px solid #EEF0F3', borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  padding: 16, width: 280,
                  position: 'absolute', top: 48, right: 0, zIndex: 50,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', fontFamily: 'Inter' }}>Notifications</span>
                  <span style={{ fontSize: 12, color: '#6C5CE7', cursor: 'pointer', fontFamily: 'Inter' }}>Mark all read</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
                  <BellOff size={32} color="#D1D5DB" />
                  <span style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8, fontFamily: 'Inter' }}>No notifications</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleImport}
            style={{
              height: 32, padding: '0 16px',
              background: '#6C5CE7', borderRadius: 8,
              border: 'none', color: '#FFFFFF',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 150ms', fontFamily: 'Inter',
              boxSizing: 'border-box', whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#5B4BD4' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#6C5CE7' }}
          >
            <Upload size={14} color="#FFFFFF" />
            Import Trades
          </button>

          <div ref={profileRef} style={{ position: 'relative' }}>
            <div
              onClick={() => { setProfileOpen(o => !o); setAccountOpen(false); setNotifOpen(false) }}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#6C5CE7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#FFFFFF',
                cursor: 'pointer', border: '2px solid #EEF0F3',
                transition: 'border-color 150ms', flexShrink: 0, fontFamily: 'Inter',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6C5CE7' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#EEF0F3' }}
            >
              {initial}
            </div>
            {profileOpen && (
              <div
                style={{
                  background: '#FFFFFF', border: '1px solid #EEF0F3', borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  padding: 8, width: 200,
                  position: 'absolute', top: 48, right: 0, zIndex: 50,
                }}
              >
                <div style={{ padding: '8px 12px', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: 'Inter' }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter' }}>{email}</div>
                </div>
                <div style={{ borderTop: '1px solid #EEF0F3', margin: '4px 0' }} />
                {[
                  { icon: User, label: 'Profile' },
                  { icon: Settings, label: 'Settings' },
                  { icon: HelpCircle, label: 'Help & Support' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      style={{
                        display: 'flex', gap: 10, alignItems: 'center',
                        padding: '8px 12px', borderRadius: 6,
                        fontSize: 13, color: '#374151',
                        cursor: 'pointer', fontFamily: 'Inter',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.color = '#6C5CE7' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151' }}
                    >
                      <Icon size={16} color="#9CA3AF" />
                      {item.label}
                    </div>
                  )
                })}
                <div style={{ borderTop: '1px solid #EEF0F3', margin: '4px 0' }} />
                <div
                  onClick={() => { logout(); setProfileOpen(false) }}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'center',
                    padding: '8px 12px', borderRadius: 6,
                    fontSize: 13, color: '#E17055',
                    cursor: 'pointer', fontFamily: 'Inter',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FFF5F5'; e.currentTarget.style.color = '#E17055' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#E17055' }}
                >
                  <LogOut size={16} color="#E17055" />
                  Sign Out
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, right: 24,
            background: toastType === 'success' ? '#00B894' : '#E17055',
            color: '#FFFFFF',
            borderRadius: 8, padding: '12px 16px',
            fontSize: 13, zIndex: 100, fontFamily: 'Inter',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {toastType === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {toast}
        </div>
      )}

      {importOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setImportOpen(false) }}
        >
          <div
            style={{
              background: '#FFFFFF', borderRadius: 16, padding: 32,
              width: parsedRows.length > 0 ? 720 : 480, maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
              position: 'relative', fontFamily: 'Inter',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', margin: 0, fontFamily: 'Inter' }}>Import Trades</h2>
              {!importing && (
                <X size={20} color="#9CA3AF" style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#374151' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}
                  onClick={() => setImportOpen(false)}
                />
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            {parsedRows.length === 0 && !csvError && (
              <>
                <div
                  style={{
                    marginTop: 24, border: '2px dashed #EEF0F3', borderRadius: 12,
                    padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#6C5CE7'; e.currentTarget.style.background = '#F5F3FF' }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; e.currentTarget.style.background = 'transparent' }}
                  onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); e.currentTarget.style.borderColor = '#EEF0F3'; e.currentTarget.style.background = 'transparent' }}
                >
                  <Upload size={40} color="#9CA3AF" style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', fontFamily: 'Inter' }}>Drop your CSV file here</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, fontFamily: 'Inter' }}>or click to browse</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8, fontFamily: 'Inter' }}>Supports CSV from TraderSync Tradezella MT4 MT5</div>
                </div>
                <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['TraderSync', 'Tradezella', 'MT4', 'MT5', 'NinjaTrader'].map((b) => (
                    <span key={b} style={{ background: '#F3F4F6', color: '#6B7280', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontFamily: 'Inter' }}>{b}</span>
                  ))}
                </div>
              </>
            )}

            {csvError && (
              <div
                style={{
                  marginTop: 24, padding: '16px 20px',
                  background: '#FEF2F2', border: '1px solid #FECACA',
                  borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start',
                }}
              >
                <AlertCircle size={16} color="#E17055" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>Invalid CSV</div>
                  <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 4, lineHeight: 1.5 }}>{csvError}</div>
                </div>
              </div>
            )}

            {parsedRows.length > 0 && !importing && (
              <>
                <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: '#1A202C' }}>
                  {parsedRows.length} trade{parsedRows.length !== 1 ? 's' : ''} found
                </div>
                <div style={{ marginTop: 12, overflowX: 'auto', border: '1px solid #EEF0F3', borderRadius: 10 }}>
                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F8F9FC', borderBottom: '1px solid #EEF0F3' }}>
                        {['Date', 'Symbol', 'Dir', 'Entry', 'Exit', 'Size', 'P&L', 'Session', 'Setup'].map((h) => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 50).map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '7px 10px', color: '#374151' }}>{row.date}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1A202C' }}>{row.symbol}</td>
                          <td style={{ padding: '7px 10px' }}>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                              color: row.direction === 'SHORT' ? '#DC2626' : '#16A34A',
                              background: row.direction === 'SHORT' ? '#FEE2E2' : '#DCFCE7',
                            }}>
                              {row.direction === 'SHORT' ? 'Short' : 'Long'}
                            </span>
                          </td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: '#374151' }}>${row.entry.toFixed(2)}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: row.exit !== null ? '#374151' : '#9CA3AF' }}>
                            {row.exit !== null ? `$${row.exit.toFixed(2)}` : '\u2014'}
                          </td>
                          <td style={{ padding: '7px 10px', color: '#374151' }}>{row.size}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 600, color: row.pnl !== null && row.pnl >= 0 ? '#00B894' : '#E17055' }}>
                            {row.pnl !== null ? `${row.pnl >= 0 ? '+' : ''}$${row.pnl.toFixed(2)}` : '\u2014'}
                          </td>
                          <td style={{ padding: '7px 10px', color: '#6B7280' }}>{row.session || '\u2014'}</td>
                          <td style={{ padding: '7px 10px', color: '#6B7280' }}>{row.setup || '\u2014'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 50 && (
                    <div style={{ padding: '8px 10px', fontSize: 11, color: '#9CA3AF', textAlign: 'center', borderTop: '1px solid #EEF0F3' }}>
                      Showing 50 of {parsedRows.length} rows
                    </div>
                  )}
                </div>
              </>
            )}

            {importing && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>Importing trades...</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{importProgress}%</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#EEF0F3', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${importProgress}%`, height: '100%', background: '#6C5CE7', borderRadius: 3, transition: 'width 300ms' }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
                  {Math.round((importProgress / 100) * parsedRows.length)} of {parsedRows.length} trades
                </div>
              </div>
            )}

            {importError && (
              <div style={{ marginTop: 16, fontSize: 12, color: '#E17055', background: '#FEF2F2', borderRadius: 8, padding: '10px 14px' }}>
                {importError}
              </div>
            )}

            <div style={{ borderTop: '1px solid #EEF0F3', marginTop: 24, paddingTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setImportOpen(false)}
                disabled={importing}
                style={{
                  height: 32, padding: '0 16px',
                  border: '1px solid #EEF0F3', borderRadius: 8,
                  background: '#FFFFFF', color: '#374151',
                  fontSize: 13, fontWeight: 500,
                  cursor: importing ? 'not-allowed' : 'pointer', fontFamily: 'Inter',
                  transition: 'all 150ms', opacity: importing ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!importing) e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={(e) => { if (!importing) e.currentTarget.style.background = '#FFFFFF' }}
              >
                Cancel
              </button>
              {parsedRows.length > 0 && (
                <button
                  onClick={startImport}
                  disabled={importing}
                  style={{
                    height: 32, padding: '0 16px',
                    background: importing ? '#8B7FE0' : '#6C5CE7', borderRadius: 8,
                    border: 'none', color: '#FFFFFF',
                    fontSize: 13, fontWeight: 600,
                    cursor: importing ? 'not-allowed' : 'pointer', fontFamily: 'Inter',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) => { if (!importing) e.currentTarget.style.background = '#5B4BD4' }}
                  onMouseLeave={(e) => { if (!importing) e.currentTarget.style.background = '#6C5CE7' }}
                >
                  {importing ? 'Importing...' : `Import ${parsedRows.length} Trade${parsedRows.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
