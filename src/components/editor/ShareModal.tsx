import React, { useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../utils/api'
import { Document } from '../../utils/types'

interface ShareLink {
  name: string
  email: string
  role: string
  shareUrl: string
  status: string
}

interface Props {
  doc: Document
  onClose: () => void
  onShared: (doc: Document) => void
}

const ShareModal: React.FC<Props> = ({ doc, onClose, onShared }) => {
  const [expiryDays, setExpiryDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/api/docs/${doc._id}/share`, { expiryDays })
      setShareLinks(res.data.shareLinks)
      onShared(res.data.doc)
      toast.success('Share links generated!')
    } catch {
      toast.error('Failed to generate links')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-lg animate-fade-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display text-white">Share for Signing</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Signers list */}
          <div className="mb-4">
            <p className="text-sm text-slate-400 mb-3">Signers ({doc.signers?.length || 0})</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {doc.signers?.map((signer, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-900 rounded-lg p-2.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    signer.status === 'signed' ? 'bg-emerald-400' :
                    signer.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{signer.name}</p>
                    <p className="text-xs text-slate-400 truncate">{signer.email}{signer.role ? ` · ${signer.role}` : ''}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    signer.status === 'signed' ? 'bg-emerald-900/50 text-emerald-400' :
                    signer.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                    'bg-amber-900/50 text-amber-400'
                  }`}>{signer.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expiry */}
          <div className="mb-4">
            <label className="label">Link expires in</label>
            <select value={expiryDays} onChange={e => setExpiryDays(Number(e.target.value))} className="input">
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          {/* Generated links */}
          {shareLinks.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs text-slate-400">Share links — send each link to the respective signer:</p>
              {shareLinks.map((link, i) => (
                <div key={i} className="bg-slate-950 border border-slate-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white">{link.name}</span>
                    {link.role && <span className="text-xs text-slate-400">{link.role}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input readOnly value={link.shareUrl} className="flex-1 bg-transparent text-xs text-ink-300 font-mono outline-none truncate" />
                    <button
                      onClick={() => handleCopy(link.shareUrl)}
                      className={`text-xs px-2 py-1 rounded flex-shrink-0 transition-colors ${
                        copied === link.shareUrl ? 'bg-emerald-800 text-emerald-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {copied === link.shareUrl ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Close</button>
            <button onClick={handleGenerate} disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Generating...' : shareLinks.length ? 'Regenerate' : 'Generate Links'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
