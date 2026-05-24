import React from 'react'
import { FileText } from 'lucide-react'

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1a202c' }}>Reports</h1>
        <p className="text-sm mt-1" style={{ color: '#4a5568' }}>Generate and view trading reports</p>
      </div>

      <div
        className="flex flex-col items-center justify-center py-16 rounded-xl bg-white"
        style={{ border: '1px solid #eef0f3' }}
      >
        <FileText size={40} style={{ color: '#9ca3af' }} />
        <p className="text-sm font-medium mt-3" style={{ color: '#4a5568' }}>Custom reports coming soon</p>
        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Export your trade data in PDF, CSV, and more</p>
      </div>
    </div>
  )
}

export default ReportsPage
