import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../utils/api'
import { Document } from '../utils/types'

const Dashboard: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetchDocs() }, [])

  const fetchDocs = async () => {
    try {
      const res = await api.get('/api/docs')
      setDocs(res.data.docs || [])
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    try {
      await api.delete(`/api/docs/${id}`)
      setDocs(docs.filter(d => d._id !== id))
      toast.success('Document deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = docs.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter ? d.status === statusFilter : true
    return matchSearch && matchStatus
  })

  const stats = {
    total: docs.length,
    pending: docs.filter(d => d.status === 'pending').length,
    signed: docs.filter(d => d.status === 'signed').length,
    draft: docs.filter(d => d.status === 'draft').length,
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Manage your documents</p>
          </div>
          <Link to="/upload" className="btn-primary flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Upload Document
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Draft', value: stats.draft, color: 'text-slate-400' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
            { label: 'Signed', value: stats.signed, color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="input flex-1 min-w-48"
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-40">
            <option value="">All status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="signed">Signed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Documents list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin w-8 h-8 text-ink-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-400">No documents found</p>
            <Link to="/upload" className="btn-primary mt-4 inline-flex">Upload your first document</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(doc => (
              <div key={doc._id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-ink-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      doc.status === 'signed' ? 'bg-emerald-900/50 text-emerald-400' :
                      doc.status === 'pending' ? 'bg-amber-900/50 text-amber-400' :
                      doc.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>{doc.status}</span>
                    <span className="text-xs text-slate-500">
                      {doc.signers?.filter(s => s.status === 'signed').length || 0}/{doc.signers?.length || 0} signed
                    </span>
                    <span className="text-xs text-slate-600">{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => navigate(`/doc/${doc._id}`)} className="btn-secondary text-sm py-1.5 px-3">View</button>
                  <button onClick={() => handleDelete(doc._id)} className="text-slate-500 hover:text-red-400 transition-colors p-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
