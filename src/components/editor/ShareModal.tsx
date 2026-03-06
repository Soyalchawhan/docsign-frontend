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
      setShareLinks(res.data.shareLinks || [])
      // Don't close modal - just update parent 
      if (res.data.doc) onShared(res.data.doc)
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
    toast.success('Link copied!')
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg" style={{height: 'auto', overflowY: 'auto'}}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Share for Signing</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-slate-400 mb-2">Signers ({doc.signers?.length || 0})</p>
            <div className="space-y-2">
              {doc.signers?.map((signer, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-800 rounded-lg p-2.5">
                  <div className={`w-2 h-2 rounded-full ${signer.status === 'signed' ? 'bg-emerald-400' : signer.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-white">{signer.name}</p>
                    <p className="text-xs text-slate-400">{signer.email}{signer.role ? ` · ${signer.role}` : ''}</p>
                  </div>
                  <span className="text-xs text-slate-400">{signer.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm text-slate-400 block mb-1">Link expires in</label>
            <select value={expiryDays} onChange={e => setExpiryDays(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          <button onClick={handleGenerate} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium mb-4 transition-colors">
            {loading ? 'Generating...' : shareLinks.length ? 'Regenerate Links' : 'Generate Links'}
          </button>

          {shareLinks.length > 0 && (
            <div>
              <p className="text-sm font-medium text-white mb-3">✅ Share these links with each signer:</p>
              <div className="space-y-3">
                {shareLinks.map((link, i) => (
                  <div key={i} className="bg-slate-800 border border-slate-600 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-white">{link.name}</span>
                      {link.role && <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">{link.role}</span>}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{link.email}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-950 rounded px-2 py-1.5 overflow-hidden">
                        <p className="text-xs text-blue-400 font-mono truncate">{link.shareUrl}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(link.shareUrl)}
                        className={`text-xs px-3 py-1.5 rounded font-medium transition-colors flex-shrink-0 ${copied === link.shareUrl ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        {copied === link.shareUrl ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={onClose} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
