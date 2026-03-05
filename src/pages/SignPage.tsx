import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Document as PDFDocument, Page } from 'react-pdf'
import { toast } from 'react-toastify'
import api from '../utils/api'
import { Document, Signature } from '../utils/types'

type SignMode = 'type' | 'draw'

const SignPage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const [doc, setDoc] = useState<Document | null>(null)
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(1)
  const [pageWidth, setPageWidth] = useState(700)
  const [pageHeight, setPageHeight] = useState(900)
  const [showSignModal, setShowSignModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [signMode, setSignMode] = useState<SignMode>('type')
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [typedSig, setTypedSig] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<'signed' | 'rejected' | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const docRes = await api.get(`/api/docs/public/${token}`)
        setDoc(docRes.data)
        setSignerName(docRes.data.signerName || '')
        setSignerEmail(docRes.data.signerEmail || '')
        const sigRes = await api.get(`/api/signatures/${docRes.data._id}`)
        setSignatures(sigRes.data)
      } catch {
        setError('This signing link is invalid or has expired.')
      } finally {
        setLoading(false)
      }
    }
    fetchDoc()
  }, [token])

  // Canvas drawing
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const rect = canvasRef.current!.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')!
    const rect = canvasRef.current.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = '#4f5ee8'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  const stopDraw = () => { isDrawing.current = false }

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const handleSign = async () => {
    if (!signerName || !signerEmail) { toast.error('Please provide your name and email'); return }
    if (signMode === 'type' && !typedSig) { toast.error('Please type your signature'); return }

    setSubmitting(true)
    try {
      let signatureData = null
      if (signMode === 'draw' && canvasRef.current) {
        signatureData = canvasRef.current.toDataURL('image/png')
      }

      await api.post(`/api/signatures/sign/${token}`, {
        action: 'sign',
        signatureData,
        signatureType: signMode === 'draw' ? 'drawn' : 'typed',
        signatureText: signMode === 'type' ? typedSig : signerName,
        signerName,
        signerEmail
      })
      setDone('signed')
    } catch {
      toast.error('Failed to submit signature')
    } finally {
      setSubmitting(false)
      setShowSignModal(false)
    }
  }

  const handleReject = async () => {
    setSubmitting(true)
    try {
      await api.post(`/api/signatures/sign/${token}`, {
        action: 'reject',
        rejectionReason,
        signerName: doc?.signerName,
        signerEmail: doc?.signerEmail
      })
      setDone('rejected')
    } catch {
      toast.error('Failed to submit rejection')
    } finally {
      setSubmitting(false)
      setShowRejectModal(false)
    }
  }

  const pageSignatures = signatures.filter(s => s.page === currentPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <svg className="animate-spin w-10 h-10 text-ink-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card p-8 text-center max-w-md">
          <div className="w-14 h-14 bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 className="font-display text-xl text-white mb-2">Link Invalid</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card p-8 text-center max-w-md animate-fade-up">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            done === 'signed' ? 'bg-emerald-900/30' : 'bg-red-900/30'
          }`}>
            {done === 'signed' ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            )}
          </div>
          <h2 className="font-display text-2xl text-white mb-2">
            {done === 'signed' ? 'Document Signed!' : 'Document Rejected'}
          </h2>
          <p className="text-slate-400">
            {done === 'signed'
              ? 'Your signature has been recorded. The document owner will be notified.'
              : 'The document owner has been notified of the rejection.'}
          </p>
        </div>
      </div>
    )
  }

  if (!doc) return null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-gradient-to-br from-ink-500 to-ink-700 rounded-lg flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
            </div>
            <span className="text-slate-400 text-sm font-medium">DocSign</span>
          </div>
          <h1 className="text-2xl font-display text-white">{doc.title}</h1>
          <p className="text-slate-400 text-sm mt-0.5">Please review and sign this document</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setShowRejectModal(true)} className="btn-danger text-sm">
            Reject
          </button>
          <button onClick={() => setShowSignModal(true)} className="btn-primary text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Sign Document
          </button>
        </div>
      </div>

      {/* Info banner */}
      {signatures.some(s => s.status === 'placed') && (
        <div className="mb-4 bg-ink-900/40 border border-ink-800/50 rounded-lg px-4 py-2.5 text-sm text-ink-300 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {signatures.filter(s => s.status === 'placed').length} signature field(s) highlighted below
        </div>
      )}

      {/* PDF */}
      <div className="relative" style={{ lineHeight: 0 }}>
        <PDFDocument
          file={`/uploads/${doc.filename}`}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          className="rounded-lg overflow-hidden shadow-2xl"
        >
          <Page
            pageNumber={currentPage}
            onRenderSuccess={(p: any) => { setPageWidth(p.width); setPageHeight(p.height) }}
            width={Math.min(pageWidth, 760)}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </PDFDocument>

        {/* Signature fields */}
        {pageSignatures.map(sig => (
          <div
            key={sig._id}
            style={{
              position: 'absolute',
              left: `${sig.x}%`,
              top: `${sig.y}%`,
              width: `${(sig.width / pageWidth) * 100}%`,
              height: `${(sig.height / pageHeight) * 100}%`,
              minWidth: '140px',
              minHeight: '40px',
            }}
            className="sig-field animate-pulse-slow"
          >
            <div className="text-ink-400 text-xs text-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Click 'Sign Document' above
            </div>
          </div>
        ))}
      </div>

      {/* Page nav */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary text-sm py-1 px-2 disabled:opacity-40">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <span className="text-slate-300 text-sm font-mono">{currentPage} / {numPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages} className="btn-secondary text-sm py-1 px-2 disabled:opacity-40">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
          </button>
        </div>
      )}

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md animate-fade-up">
            <div className="p-6">
              <h2 className="text-xl font-display text-white mb-4">Sign Document</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Your name</label>
                    <input value={signerName} onChange={e => setSignerName(e.target.value)} className="input" placeholder="Bob Smith" />
                  </div>
                  <div>
                    <label className="label">Your email</label>
                    <input value={signerEmail} onChange={e => setSignerEmail(e.target.value)} type="email" className="input" placeholder="bob@email.com" />
                  </div>
                </div>

                {/* Sig mode tabs */}
                <div>
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-lg mb-3">
                    {(['type', 'draw'] as SignMode[]).map(m => (
                      <button
                        key={m}
                        onClick={() => setSignMode(m)}
                        className={`flex-1 py-1.5 text-sm rounded-md transition-all ${
                          signMode === m ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {m === 'type' ? 'Type' : 'Draw'}
                      </button>
                    ))}
                  </div>

                  {signMode === 'type' ? (
                    <div>
                      <label className="label">Type your signature</label>
                      <input
                        value={typedSig}
                        onChange={e => setTypedSig(e.target.value)}
                        placeholder="Type your full name"
                        className="input font-display text-lg text-ink-400"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="label">Draw your signature</label>
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={100}
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={stopDraw}
                        onMouseLeave={stopDraw}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg cursor-crosshair"
                      />
                      <button onClick={clearCanvas} className="text-xs text-slate-500 hover:text-slate-300 mt-1 transition-colors">
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowSignModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={handleSign} disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? 'Signing...' : 'Confirm Signature'}
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
              <h2 className="text-xl font-display text-white mb-2">Reject Document</h2>
              <p className="text-slate-400 text-sm mb-4">Please provide a reason for rejection (optional)</p>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Terms are not acceptable..."
                className="input resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowRejectModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={handleReject} disabled={submitting} className="btn-danger flex-1 justify-center">
                  {submitting ? 'Rejecting...' : 'Confirm Rejection'}
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
