import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../utils/api'

interface Signer {
  name: string
  email: string
  role: string
}

const Upload: React.FC = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [signers, setSigners] = useState<Signer[]>([{ name: '', email: '', role: '' }])
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setFile(f)
    else toast.error('Only PDF files are allowed')
  }, [])

  const addSigner = () => {
    if (signers.length >= 10) { toast.error('Maximum 10 signers'); return }
    setSigners([...signers, { name: '', email: '', role: '' }])
  }

  const removeSigner = (index: number) => {
    if (signers.length === 1) { toast.error('At least one signer required'); return }
    setSigners(signers.filter((_, i) => i !== index))
  }

  const updateSigner = (index: number, field: keyof Signer, value: string) => {
    const updated = [...signers]
    updated[index][field] = value
    setSigners(updated)
  }

  const handleSubmit = async () => {
    if (!file) { toast.error('Please select a PDF'); return }
    if (!title.trim()) { toast.error('Please enter a title'); return }
    if (signers.some(s => !s.name || !s.email)) {
      toast.error('All signers need a name and email')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('pdf', file)
      formData.append('title', title)
      formData.append('signers', JSON.stringify(signers))

      const res = await api.post('/api/docs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Document uploaded!')
      navigate(`/doc/${res.data.doc._id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display text-white">Upload Document</h1>
          <p className="text-slate-400 mt-1">Upload a PDF and add signers</p>
        </div>

        {/* File Drop Zone */}
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => document.getElementById('fileInput')?.click()}
          className={`card p-8 text-center cursor-pointer border-2 border-dashed transition-all mb-6 ${
            dragging ? 'border-ink-400 bg-ink-900/20' : 'border-slate-700 hover:border-slate-500'
          }`}
        >
          {file ? (
            <div>
              <div className="w-12 h-12 bg-ink-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-slate-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button onClick={e => { e.stopPropagation(); setFile(null) }} className="text-red-400 text-sm mt-2 hover:text-red-300">Remove file</button>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <p className="text-white font-medium">Drop PDF here or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">Max 20MB</p>
            </div>
          )}
          <input id="fileInput" type="file" accept=".pdf" className="hidden" onChange={e => {
            const f = e.target.files?.[0]
            if (f) setFile(f)
          }} />
        </div>

        {/* Title */}
        <div className="card p-6 mb-6">
          <label className="label">Document title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Employment Contract"
            className="input"
          />
        </div>

        {/* Signers */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium">Signers ({signers.length})</h2>
            <button onClick={addSigner} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Signer
            </button>
          </div>

          <div className="space-y-4">
            {signers.map((signer, index) => (
              <div key={index} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-ink-400">Signer {index + 1}</span>
                  {signers.length > 1 && (
                    <button onClick={() => removeSigner(index)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="label">Full name *</label>
                    <input
                      value={signer.name}
                      onChange={e => updateSigner(index, 'name', e.target.value)}
                      placeholder="John Smith"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input
                      value={signer.email}
                      onChange={e => updateSigner(index, 'email', e.target.value)}
                      type="email"
                      placeholder="john@company.com"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Role / Post</label>
                    <input
                      value={signer.role}
                      onChange={e => updateSigner(index, 'role', e.target.value)}
                      placeholder="e.g. CEO, Manager, Director"
                      className="input"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          {loading ? 'Uploading...' : '⬆ Upload & Continue'}
        </button>
      </div>
    </div>
  )
}

export default Upload
