import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../utils/api'
import { Document } from '../utils/types'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = {
  draft: 'badge-draft',
  pending: 'badge-pending',
  signed: 'badge-signed',
  rejected: 'badge-rejected',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  pending: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
  signed: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  ),
  rejected: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const fetchDocs = async () => {
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/api/docs', { params })
      setDocs(res.data)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [search, statusFilter])

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/docs/${id}`)
      setDocs(d => d.filter(x => x._id !== id))
      toast.success('Document deleted')
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleteTarget(null)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const stats = {
    total: docs.length,
    pending: docs.filter(d => d.status === 'pending').length,
    signed: docs.filter(d => d.status === 'signed').length,
    rejected: docs.filter(d => d.status === 'rejected').length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display text-white">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
            <span className="text-ink-400">{user?.name.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 mt-1">Manage and track your document signatures</p>
        </div>
        <Link to="/upload" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Upload Document
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-300', bg: 'bg-slate-800/50' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-300', bg: 'bg-amber-900/20' },
          { label: 'Signed', value: stats.signed, color: 'text-emerald-300', bg: 'bg-emerald-900/20' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-300', bg: 'bg-red-900/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`card p-4 ${bg}`}>
            <p className="text-slate-500 text-sm">{label}</p>
            <p className={`text-3xl font-display font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input sm:w-40"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="signed">Signed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Documents */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-ink-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : docs.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
          </div>
          <h3 className="text-xl font-display text-white mb-2">No documents yet</h3>
          <p className="text-slate-400 mb-6">Upload your first PDF to get started</p>
          <Link to="/upload" className="btn-primary inline-flex">
            Upload your first document
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <div
              key={doc._id}
              className="card p-4 flex items-center gap-4 hover:border-slate-700 transition-all group animate-fade-in"
            >
              {/* Doc icon */}
              <div className="w-10 h-10 bg-ink-900/50 rounded-lg flex items-center justify-center flex-shrink-0 border border-ink-800/50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-white truncate">{doc.title}</h3>
                  <span className={STATUS_COLORS[doc.status]}>
                    {STATUS_ICONS[doc.status]}
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-sm text-slate-500">
                  <span>{formatSize(doc.fileSize)}</span>
                  {doc.signerEmail && <span>→ {doc.signerEmail}</span>}
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/doc/${doc._id}`)}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  View
                </button>
                <button
                  onClick={() => setDeleteTarget(doc._id)}
                  className="text-slate-600 hover:text-red-400 transition-colors p-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1 2-2h4a2,2 0 0,1 2,2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-sm animate-fade-up mx-4">
            <h3 className="font-display text-xl text-white mb-2">Delete document?</h3>
            <p className="text-slate-400 text-sm mb-6">This action cannot be undone. All signatures and audit logs will be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} className="btn-danger flex-1 justify-center">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
