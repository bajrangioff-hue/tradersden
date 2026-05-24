import { LayoutDashboard, BookOpen, BarChart2, FileText, Layers, PenLine, Plus, Settings } from 'lucide-react'
import { useAuth } from '../../lib/auth'

const mainNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'journal', label: 'Trade Journal', icon: BookOpen },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'reports', label: 'Reports', icon: FileText },
]

const toolsNav = [
  { id: 'strategies', label: 'Strategies', icon: Layers },
  { id: 'notebook', label: 'Notebook', icon: PenLine },
]

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
  onAddTrade?: () => void
}

export default function Sidebar({ activePage, onNavigate, onAddTrade }: SidebarProps) {
  const { user } = useAuth()
  const displayName = user?.display_name || user?.email?.split('@')[0] || 'User'
  const email = user?.email || ''
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <aside
      style={{
        width: 220,
        minHeight: '100vh',
        background: '#FFFFFF',
        borderRight: '1px solid #EEF0F3',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '0 8px', marginBottom: 24 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', fontFamily: 'Inter' }}>TradePro</h1>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>ICT Execution</p>
      </div>

      <button
        onClick={onAddTrade}
        style={{
          width: '100%',
          height: 36,
          background: '#6C5CE7',
          color: '#FFFFFF',
          borderRadius: 8,
          border: 'none',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 24,
          transition: 'background 150ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#5B4BD4' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#6C5CE7' }}
      >
        <Plus size={14} color="#FFFFFF" />
        Add Trade
      </button>

      <nav style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', padding: '0 8px', marginBottom: 4, marginTop: 0 }}>
          Main
        </div>
        {mainNav.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activePage
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#6C5CE7' : '#6B7280',
                cursor: 'pointer',
                width: '100%',
                marginBottom: 2,
                transition: 'all 150ms',
                textDecoration: 'none',
                border: 'none',
                background: isActive ? '#EDE9FE' : 'transparent',
                boxSizing: 'border-box',
                fontFamily: 'Inter',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#F5F3FF'
                  e.currentTarget.style.color = '#6C5CE7'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#6B7280'
                }
              }}
            >
              <Icon size={16} strokeWidth={1.75} color={isActive ? '#6C5CE7' : '#9CA3AF'} />
              {item.label}
            </button>
          )
        })}

        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', padding: '0 8px', marginBottom: 4, marginTop: 16 }}>
          Tools
        </div>
        {toolsNav.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activePage
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#6C5CE7' : '#6B7280',
                cursor: 'pointer',
                width: '100%',
                marginBottom: 2,
                transition: 'all 150ms',
                textDecoration: 'none',
                border: 'none',
                background: isActive ? '#EDE9FE' : 'transparent',
                boxSizing: 'border-box',
                fontFamily: 'Inter',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#F5F3FF'
                  e.currentTarget.style.color = '#6C5CE7'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#6B7280'
                }
              }}
            >
              <Icon size={16} strokeWidth={1.75} color={isActive ? '#6C5CE7' : '#9CA3AF'} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '12px 8px', borderTop: '1px solid #EEF0F3' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#6C5CE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1A202C', fontFamily: 'Inter' }}>{displayName}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter' }}>{email}</div>
          </div>
          <Settings
            size={16}
            color="#9CA3AF"
            style={{ cursor: 'pointer', flexShrink: 0, transition: 'color 150ms' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6C5CE7' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}
          />
        </div>
        <div style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 12, fontFamily: 'Inter' }}>
          v3.0
        </div>
      </div>
    </aside>
  )
}
