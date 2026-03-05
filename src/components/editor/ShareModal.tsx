import React, { useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../utils/api'
import { Document } from '../../utils/types'

interface Props {
  doc: Document
  onClose: () => void
  onShared: (doc: Document) => void
}

const ShareModal: React.FC<Props> = ({ doc, onClose, onShared }) => {
  const [signerName, setSignerName] = useState(doc.signerName || '')
  const [signerEmail, setSignerEmail] = useState(doc.signerEmail || '')
  const [expiryDays, setExpiryDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState(doc.shareToken ? `${window.location.origin}/sign/${doc.shareToken}` : '')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!signerEmail) { toast.error('Signer email required'); return }
    setLoading(true)
    try {
      const res = await api.post(`/api/docs/${doc._id}/share`, { signerName, signerEmail, expiryDays })
      setShareUrl(res.data.shareUrl)
      onShared(res.data.doc)
      toast.success('Share link generated!')
    } catch {
      toast.error('Failed to generate link')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-md animate-fade-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display text-white">Share for Signing</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Signer name</label>
              <input
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                type="text"
                placeholder="Bob Smith"
                className="input"
              />
            </div>
            <div>
              <label className="label">Signer email <span className="text-red-400">*</span></label>
              <input
                value={signerEmail}
                onChange={e => setSignerEmail(e.target.value)}
                type="email"
                placeholder="bob@company.com"
                className="input"
              />
            </div>
            <div>
              <label className="label">Link expires in</label>
              <select
                value={expiryDays}
                onChange={e => setExpiryDays(Number(e.target.value))}
                className="input"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>

            {shareUrl && (
              <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 animate-fade-in">
                <p className="text-xs text-slate-400 mb-2">Share link (expires in {expiryDays} days)</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-transparent text-sm text-ink-300 font-mono outline-none truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      copied ? 'bg-emerald-800 text-emerald-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Close</button>
            <button onClick={handleGenerate} disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Generating...' : shareUrl ? 'Regenerate' : 'Generate Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
