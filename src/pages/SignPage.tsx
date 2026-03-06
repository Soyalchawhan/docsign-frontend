import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import { toast } from 'react-toastify'
import api from '../utils/api'
import { Document, Signature, Signer } from '../utils/types'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

const SignPage: React.FC = () => {
  const { token } = useParams()
  const [doc, setDoc] = useState<Document | null>(null)
  const [signer, setSigner] = useState<Signer | null>(null)
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showSignModal, setShowSignModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [signatureText, setSignatureText] = useState('')
  const [signatureType, setSignatureType] = useState<'typed' | 'drawn'>('typed')
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<'signed' | 'rejected' | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    fetchDoc()
  }, [token])

  const fetchDoc = async () => {
    try {
      const res = await api.get(`/api/docs/public/${token}`)
      setDoc(res.data.doc)
      setSigner(res.data.signer)
      const sigRes = await api.get(`/api/signatures/${res.data.doc._id}`)
      setSignatures(sigRes.data.signatures.filter((s: Signature) => s.signerEmail === res.data.signer.email))
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) { ctx.beginPath(); ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY) }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) { ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); ctx.stroke() }
  }

  const handleSign = async () => {
    const sigData = signatureType === 'drawn' ? canvasRef.current?.toDataURL() : undefined
    const sigText = signatureType === 'typed' ? signatureText : signer?.name

    if (signatureType === 'typed' && !signatureText.trim()) {
      toast.error('Please enter your signature')
      return
    }

    setSubmitting(true)
    try {
      await api.post(`/api/signatures/sign/${token}`, {
        signatureType,
        signatureData: sigData,
        signatureText: sigText,
        rejected: false
      })
      setDone('signed')
      toast.success('Document signed successfully!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sign')
    } finally {
      setSubmitting(false)
      setShowSignModal(false)
    }
  }

  const handleReject = async () => {
    setSubmitting(true)
    try {
      await api.post(`/api/signatures/sign/${token}`, {
        rejected: true,
        rejectionReason
      })
      setDone('rejected')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject')
    } finally {
      setSubmitting(false)
      setShowRejectModal(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <svg className="animate-spin w-10 h-10 text-ink-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${done === 'signed' ? 'bg-emerald-900/50' : 'bg-red-900/50'}`}>
          {done === 'signed' ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          )}
        </div>
        <h2 className="text-2xl font-display text-white mb-2">
          {done === 'signed' ? 'Document Signed!' : 'Document Rejected'}
        </h2>
        <p className="text-slate-400">
          {done === 'signed'
            ? 'Your signature has been recorded successfully.'
            : 'You have rejected this document.'}
        </p>
      </div>
    </div>
  )

  if (!doc || !signer) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-400">Document not found or link has expired.</p>
    </div>
  )

  const pdfUrl = `${import.meta.env.VITE_API_URL}/uploads/${doc.filename}`
  const alreadySigned = signer.status === 'signed'

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-gradient-to-br from-ink-500 to-ink-700 rounded flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <span className="text-white font-display">DocSign</span>
            </div>
            <p className="text-slate-400 text-sm">{doc.title}</p>
            <p className="text-xs text-slate-500">
              Signing as <span className="text-ink-400 font-medium">{signer.name}</span>
              {signer.role && <span className="text-slate-400"> · {signer.role}</span>}
            </p>
          </div>
          {!alreadySigned && (
            <div className="flex gap-2">
              <button onClick={() => setShowRejectModal(true)} className="btn-secondary text-sm text-red-400 border-red-900/50 hover:bg-red-900/20">
                Reject
              </button>
              <button onClick={() => setShowSignModal(true)} className="btn-primary text-sm">
                Sign Document
              </button>
            </div>
          )}
          {alreadySigned && (
            <span className="px-3 py-1.5 bg-emerald-900/50 text-emerald-400 rounded-lg text-sm">
              ✓ Already signed
            </span>
          )}
        </div>
      </div>

      {/* PDF */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden">
          <PDFDocument
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          >
            <Page
              pageNumber={currentPage}
              width={Math.min(window.innerWidth - 48, 800)}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </PDFDocument>

          {/* Signature overlays */}
          {signatures.filter(s => s.page === currentPage).map(sig => (
            <div
              key={sig._id}
              style={{ left: `${sig.x}%`, top: `${sig.y}%`, width: `${sig.width}%`, height: `${sig.height}%` }}
              className="absolute border-2 border-dashed border-blue-400 bg-blue-50/90 rounded flex flex-col justify-between p-1"
            >
              <p className="text-blue-600 text-xs font-medium">← Sign here</p>
              <div className="text-[9px]">
                <p className="text-gray-600 font-medium">{sig.signerName}</p>
                {sig.signerRole && <p className="text-gray-400">{sig.signerRole}</p>}
              </div>
            </div>
          ))}
        </div>

        {numPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary text-sm py-1.5 px-3">Previous</button>
            <span className="text-slate-400 text-sm">Page {currentPage} of {numPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages} className="btn-secondary text-sm py-1.5 px-3">Next</button>
          </div>
        )}
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md animate-fade-up">
            <div className="p-6">
              <h2 className="text-xl font-display text-white mb-1">Sign Document</h2>
              <p className="text-slate-400 text-sm mb-4">
                Signing as <span className="text-ink-400">{signer.name}</span>
                {signer.role && <span className="text-slate-400"> · {signer.role}</span>}
              </p>

              <div className="flex gap-2 mb-4">
                {(['typed', 'drawn'] as const).map(t => (
                  <button key={t} onClick={() => setSignatureType(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${signatureType === t ? 'bg-ink-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {t === 'typed' ? 'Type' : 'Draw'}
                  </button>
                ))}
              </div>

              {signatureType === 'typed' ? (
                <input
                  value={signatureText}
                  onChange={e => setSignatureText(e.target.value)}
                  placeholder="Type your full name"
                  className="input font-serif text-lg mb-4"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
              ) : (
                <div className="mb-4">
                  <canvas
                    ref={canvasRef}
                    width={400} height={120}
                    className="w-full bg-white rounded-lg border border-slate-600 cursor-crosshair"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                  />
                  <button onClick={() => {
                    const ctx = canvasRef.current?.getContext('2d')
                    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                  }} className="text-xs text-slate-400 hover:text-white mt-1">Clear</button>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowSignModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={handleSign} disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? 'Signing...' : 'Sign Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md animate-fade-up">
            <div className="p-6">
              <h2 className="text-xl font-display text-white mb-4">Reject Document</h2>
              <label className="label">Reason for rejection</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Please explain why you are rejecting this document..."
                rows={4}
                className="input resize-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowRejectModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={handleReject} disabled={submitting} className="btn-danger flex-1 justify-center">
                  {submitting ? 'Rejecting...' : 'Reject Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SignPage
