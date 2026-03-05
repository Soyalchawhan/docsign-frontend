import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-toastify'
import api from '../utils/api'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  signerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  signerName: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const Upload: React.FC = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error('File size must be under 20MB')
      return
    }
    setFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const onSubmit = async (data: FormData) => {
    if (!file) { toast.error('Please select a PDF'); return }
    setLoading(true)
    try {
      const form = new FormData()
      form.append('pdf', file)
      form.append('title', data.title)
      if (data.signerEmail) form.append('signerEmail', data.signerEmail)
      if (data.signerName) form.append('signerName', data.signerName)

      const res = await api.post('/api/docs/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Document uploaded!')
      navigate(`/doc/${res.data._id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-white">Upload Document</h1>
        <p className="text-slate-400 mt-1">Upload a PDF to prepare it for signatures</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-ink-500 bg-ink-950/50'
              : file
              ? 'border-emerald-700 bg-emerald-950/30'
              : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="animate-fade-in">
              <div className="w-14 h-14 bg-emerald-900/50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-emerald-800/50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-slate-400 text-sm mt-1">{formatSize(file.size)}</p>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setFile(null) }}
                className="text-red-400 text-sm mt-3 hover:text-red-300 transition-colors"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
                  <polyline points="16,16 12,12 8,16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
              </div>
              <p className="text-slate-200 font-medium">Drop your PDF here</p>
              <p className="text-slate-400 text-sm mt-1">or click to browse — max 20MB</p>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="label">Document title <span className="text-red-400">*</span></label>
          <input {...register('title')} type="text" placeholder="e.g. NDA Agreement Q1 2025" className="input" />
          {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
        </div>

        {/* Signer info */}
        <div className="card p-4 space-y-4">
          <h3 className="font-medium text-white text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Signer details (optional)
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Signer name</label>
              <input {...register('signerName')} type="text" placeholder="Bob Smith" className="input" />
            </div>
            <div>
              <label className="label">Signer email</label>
              <input {...register('signerEmail')} type="email" placeholder="bob@company.com" className="input" />
              {errors.signerEmail && <p className="text-red-400 text-sm mt-1">{errors.signerEmail.message}</p>}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading || !file} className="btn-primary w-full justify-center">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Uploading...
            </span>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              Upload & Continue
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default Upload
