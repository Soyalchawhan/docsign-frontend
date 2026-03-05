import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document as PDFDocument, Page } from 'react-pdf'
import { toast } from 'react-toastify'
import api from '../utils/api'
import { Document, Signature, AuditLog } from '../utils/types'
import ShareModal from '../components/editor/ShareModal'
import AuditTrail from '../components/editor/AuditTrail'
import SignaturePanel from '../components/editor/SignaturePanel'

const DocView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [doc, setDoc] = useState<Document | null>(null)
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [numPages, setNumPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageWidth, setPageWidth] = useState(700)
  const [pageHeight, setPageHeight] = useState(900)
  const [showShare, setShowShare] = useState(false)
  const [showAudit, setShowAudit] = useState(false)
  const [showSigPanel, setShowSigPanel] = useState(false)
  const [placingMode, setPlacingMode] = useState(false)
  const [draggingSig, setDraggingSig] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [finalizing, setFinalizing] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [docRes, sigRes, auditRes] = await Promise.all([
          api.get(`/api/docs/${id}`),
          api.get(`/api/signatures/${id}`),
          api.get(`/api/audit/${id}`)
        ])
        setDoc(docRes.data)
        setSignatures(sigRes.data)
        setAuditLogs(auditRes.data)
      } catch {
        toast.error('Failed to load document')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  const handlePageRenderSuccess = useCallback((page: any) => {
    setPageWidth(page.width)
    setPageHeight(page.height)
  }, [])

  const handleContainerClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placingMode || !id) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    try {
      const res = await api.post('/api/signatures', {
        documentId: id,
        x, y,
        width: 200,
        height: 60,
        page: currentPage,
        signerName: doc?.signerName || 'Signer',
        signerEmail: doc?.signerEmail || 'signer@example.com'
      })
      setSignatures(prev => [...prev, res.data])
      toast.success('Signature field placed')
      setPlacingMode(false)
    } catch {
      toast.error('Failed to place signature')
    }
  }

  const handleMouseDown = (e: React.MouseEvent, sigId: string) => {
    e.stopPropagation()
    if (signatures.find(s => s._id === sigId)?.status !== 'placed') return
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const sig = signatures.find(s => s._id === sigId)!
    setDraggingSig(sigId)
    setDragOffset({
      x: e.clientX - rect.left - (sig.x / 100) * rect.width,
      y: e.clientY - rect.top - (sig.y / 100) * rect.height
    })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingSig || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(((e.clientX - rect.left - dragOffset.x) / rect.width) * 100, 95))
    const y = Math.max(0, Math.min(((e.clientY - rect.top - dragOffset.y) / rect.height) * 100, 95))
    setSignatures(prev => prev.map(s => s._id === draggingSig ? { ...s, x, y } : s))
  }, [draggingSig, dragOffset])

  const handleMouseUp = useCallback(async () => {
    if (!draggingSig) return
    const sig = signatures.find(s => s._id === draggingSig)
    if (sig) {
      try {
        await api.patch(`/api/signatures/${draggingSig}`, { x: sig.x, y: sig.y })
      } catch {
        toast.error('Failed to save position')
      }
    }
    setDraggingSig(null)
  }, [draggingSig, signatures])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleDeleteSig = async (sigId: string) => {
    try {
      await api.delete(`/api/signatures/${sigId}`)
      setSignatures(prev => prev.filter(s => s._id !== sigId))
      toast.success('Signature removed')
    } catch {
      toast.error('Failed to remove signature')
    }
  }

  const handleFinalize = async () => {
    setFinalizing(true)
    try {
      await api.post(`/api/signatures/finalize/${id}`)
      const res = await api.get(`/api/docs/${id}`)
      setDoc(res.data)
      toast.success('Signed PDF generated!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Finalization failed')
    } finally {
      setFinalizing(false)
    }
  }

  const handleDownload = async (signed = false) => {
    try {
      const res = await api.get(`/api/docs/${id}/download?signed=${signed}`, {
        responseType: 'blob'
      })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${signed ? 'signed-' : ''}${doc?.originalName}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    }
  }

  const pageSignatures = signatures.filter(s => s.page === currentPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="animate-spin w-10 h-10 text-ink-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    )
  }

  if (!doc) return null

  const pdfUrl = `${import.meta.env.VITE_API_URL}/uploads/${doc.filename}`
  const statusMap: Record<string, string> = {
    draft: 'badge-draft', pending: 'badge-pending',
    signed: 'badge-signed', rejected: 'badge-rejected'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display text-white">{doc.title}</h1>
              <span className={statusMap[doc.status]}>
                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
              </span>
            </div>
            {doc.signerEmail && (
              <p className="text-sm text-slate-400 mt-0.5">Signer: {doc.signerName} &lt;{doc.signerEmail}&gt;</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {doc.status === 'draft' && (
            <button
              onClick={() => setPlacingMode(!placingMode)}
              className={`${placingMode ? 'btn-primary' : 'btn-secondary'} text-sm`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {placingMode ? 'Click to place...' : 'Add Signature Field'}
            </button>
          )}
          {doc.status === 'draft' && signatures.some(s => s.status === 'placed') && (
            <button onClick={() => setShowShare(true)} className="btn-secondary text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share
            </button>
          )}
          {doc.status === 'signed' && !doc.signedFilePath && (
            <button onClick={handleFinalize} disabled={finalizing} className="btn-primary text-sm">
              {finalizing ? 'Generating...' : 'Generate Signed PDF'}
            </button>
          )}
          {doc.signedFilePath && (
            <button onClick={() => handleDownload(true)} className="btn-primary text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Signed
            </button>
          )}
          <button onClick={() => handleDownload(false)} className="btn-secondary text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </button>
          <button onClick={() => setShowAudit(!showAudit)} className="btn-secondary text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Audit
          </button>
        </div>
      </div>

      {/* Placing mode hint */}
      {placingMode && (
        <div className="mb-4 bg-ink-900/50 border border-ink-800 rounded-lg px-4 py-2.5 text-sm text-ink-300 flex items-center gap-2 animate-fade-in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Click anywhere on the document to place a signature field. Press Escape to cancel.
        </div>
      )}

      <div className="flex gap-6">
        {/* PDF Viewer */}
        <div className="flex-1 min-w-0">
          <div
            ref={containerRef}
            onClick={handleContainerClick}
            className={`relative select-none ${placingMode ? 'cursor-crosshair' : ''}`}
            style={{ lineHeight: 0 }}
          >
            <PDFDocument
              file={pdfUrl}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              className="rounded-lg overflow-hidden shadow-2xl"
            >
              <Page
                pageNumber={currentPage}
                onRenderSuccess={handlePageRenderSuccess}
                width={Math.min(pageWidth, 760)}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </PDFDocument>

            {/* Signature overlays */}
            {pageSignatures.map(sig => (
              <div
                key={sig._id}
                onMouseDown={e => handleMouseDown(e, sig._id)}
                style={{
                  position: 'absolute',
                  left: `${sig.x}%`,
                  top: `${sig.y}%`,
                  width: `${(sig.width / pageWidth) * 100}%`,
                  height: `${(sig.height / pageHeight) * 100}%`,
                  minWidth: '140px',
                  minHeight: '40px',
                }}
                className={`sig-field ${sig.status === 'signed' ? 'signed' : ''}`}
              >
                <div className="w-full h-full flex flex-col justify-center px-2 overflow-hidden">
                  {sig.status === 'signed' ? (
                    <div className="text-emerald-400 text-xs font-mono">
                      <div className="font-semibold text-sm">{sig.signatureText || sig.signerName}</div>
                      <div className="text-emerald-600 text-[10px] truncate">✓ {sig.signerEmail}</div>
                    </div>
                  ) : (
                    <div className="text-ink-400 text-xs text-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-0.5">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                      Sign here
                    </div>
                  )}
                </div>
                {sig.status === 'placed' && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteSig(sig._id) }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Page controls */}
          {numPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary text-sm py-1 px-2 disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6"/>
                </svg>
              </button>
              <span className="text-slate-300 text-sm font-mono">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                disabled={currentPage === numPages}
                className="btn-secondary text-sm py-1 px-2 disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="w-72 flex-shrink-0 hidden lg:block space-y-4">
          {showAudit && (
            <AuditTrail logs={auditLogs} />
          )}
          <SignaturePanel
            signatures={signatures}
            currentPage={currentPage}
            onDelete={handleDeleteSig}
          />
        </div>
      </div>

      {/* Modals */}
      {showShare && doc && (
        <ShareModal
          doc={doc}
          onClose={() => setShowShare(false)}
          onShared={updated => setDoc(updated)}
        />
      )}
    </div>
  )
}

export default DocView
