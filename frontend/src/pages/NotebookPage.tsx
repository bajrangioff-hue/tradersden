import React from 'react'
import { Bookmark } from 'lucide-react'

const NotebookPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1a202c' }}>Notebook</h1>
        <p className="text-sm mt-1" style={{ color: '#4a5568' }}>Trading notes and strategy documentation</p>
      </div>

      <div
        className="flex flex-col items-center justify-center py-16 rounded-xl bg-white"
        style={{ border: '1px solid #eef0f3' }}
      >
        <Bookmark size={40} style={{ color: '#9ca3af' }} />
        <p className="text-sm font-medium mt-3" style={{ color: '#4a5568' }}>Notebook coming soon</p>
        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Document your trading strategies and insights</p>
      </div>
    </div>
  )
}

export default NotebookPage
