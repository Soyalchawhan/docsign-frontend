import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import { toast } from 'react-toastify'
import api from '../utils/api'
import { Document, Signature, AuditLog, Signer } from '../utils/types'
import ShareModal from '../components/editor/ShareModal'
import AuditTrail from '../components/editor/AuditTrail'
import SignaturePanel from '../components/editor/SignaturePanel'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

const DocView: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<Document | null>(null)
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [numPages, setNumPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [pdfWidth, setPdfWidth] = useState(700)
  const [placing, setPlacing] = useState(false)
  const [selectedSigner, setSelectedSigner] = useState<Signer | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showAudit, setShowAudit] = useState(false)
  const [loading, setLoading] = useState(true)
  const pdfRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAll()
  }, [id])

  const fetchAll = async () => {
    try {
      const [docRes, sigRes, auditRes] = await Promise.all([
        api.get(`/api/docs/${id}`),
        api.get(`/api/signatures/${id}`),
        api.get(`/api/audit/${id}`)
      ])
      setDoc(docRes.data.doc)
      setSignatures(sigRes.data.signatures)
      setAuditLogs(auditRes.data.logs)
      if (docRes.data.doc.signers?.length > 0) {
        setSelectedSigner(docRes.data.doc.signers[0])
      }
    } catch {
      toast.error('Failed to load document')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handlePdfClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placing || !selectedSigner || !pdfRef.current) return
    const rect = pdfRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    try {
      const res = await api.post('/api/signatures', {
        documentId: id,
        signerEmail: selectedSigner.email,
        signerName: selectedSigner.name,
        signerRole: selectedSigner.role,
        x, y,
        width: 22,
        height: 10,
        page: currentPage
      })
      setSignatures([...signatures, res.data.signature])
      toast.success(`Signature field placed for ${selectedSigner.name}`)
      setPlacing(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place signature')
    }
  }

  const handleDeleteSignature = async (sigId: string) => {
    try {
      await api.delete(`/api/signatures/${sigId}`)
      setSignatures(signatures.filter(s => s._id !== sigId))
      toast.success('Signature field removed')
    } catch {
      toast.error('Failed to delete signature')
    }
  }

  const handleFinalize = async () => {
    try {
      await api.post(`/api/signatures/finalize/${id}`)
      toast.success('Signed PDF generated!')
      fetchAll()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate PDF')
    }
  }

  const handleDownload = async (signed = false) => {
    try {
      const res = await api.get(`/api/docs/${id}/download${signed ? '?signed=true' : ''}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = signed ? `signed-${doc?.filename}` : doc?.filename || 'document.pdf'
      a.click()
    } catch {
      toast.error('Failed to download')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <svg className="animate-spin w-10 h-10 text-ink-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  )

  if (!doc) return null

  const pdfUrl = `${import.meta.env.VITE_API_URL}/uploads/${doc.filename}`
  const allSigned = doc.signers?.every(s => s.status === 'signed')

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-display text-white">{doc.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  doc.status === 'signed' ? 'bg-emerald-900/50 text-emerald-400' :
                  doc.status === 'pending' ? 'bg-amber-900/50 text-amber-400' :
                  doc.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                  'bg-slate-800 text-slate-400'
                }`}>{doc.status}</span>
                <span className="text-xs text-slate-500">
                  {doc.signers?.filter(s => s.status === 'signed').length}/{doc.signers?.length} signed
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!placing ? (
              <button onClick={() => setPlacing(true)} className="btn-primary flex items-center gap-2 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Signature Field
              </button>
            ) : (
              <button onClick={() => setPlacing(false)} className="btn-secondary text-sm">Cancel</button>
            )}
            <button onClick={() => setShowShareModal(true)} className="btn-secondary text-sm">Share</button>
            {allSigned && <button onClick={handleFinalize} className="btn-primary text-sm">Generate Signed PDF</button>}
            {doc.signedFilePath && <button onClick={() => handleDownload(true)} className="btn-secondary text-sm">Download Signed</button>}
            <button onClick={() => handleDownload(false)} className="btn-secondary text-sm">Download</button>
            <button onClick={() => setShowAudit(!showAudit)} className="btn-secondary text-sm">Audit</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* PDF Viewer */}
        <div className="flex-1 min-w-0 flex flex-col items-center">
          {/* Signer selector when placing */}
          {placing && (
            <div className="card p-4 mb-4 animate-fade-in">
              <p className="text-sm text-slate-400 mb-3">Select which signer this field is for:</p>
              <div className="flex flex-wrap gap-2">
                {doc.signers?.map((signer, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSigner(signer)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedSigner?.email === signer.email
                        ? 'bg-ink-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-medium">{signer.name}</span>
                    {signer.role && <span className="text-xs opacity-70 ml-1">· {signer.role}</span>}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-400 mt-3 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Now click on the PDF to place a signature field for <strong>{selectedSigner?.name}</strong>
              </p>
            </div>
          )}

          <div
  ref={pdfRef}
  className={`relative bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-3xl ${placing ? 'cursor-crosshair' : ''}`}
            onClick={handlePdfClick}
          >
            <PDFDocument
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={() => toast.error('Failed to load PDF')}
            >
              <Page
                pageNumber={currentPage}
                width={Math.min(window.innerWidth - 500, 800)}
                onLoadSuccess={page => setPdfWidth(page.originalWidth > 700 ? 700 : page.originalWidth)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </PDFDocument>

            {/* Signature overlays */}
{signatures.filter(s => s.page === currentPage).map(sig => (
  <div
    key={sig._id}
    style={{ left: `${sig.x}%`, top: `${sig.y}%`, width: `${sig.width}%`, height: `${sig.height}%`, position: 'absolute', cursor: 'move' }}
    className={`border-2 rounded flex flex-col justify-between p-1 select-none ${
      sig.status === 'signed' ? 'border-emerald-400 bg-emerald-50/90' :
      sig.status === 'rejected' ? 'border-red-400 bg-red-50/90' :
      'border-blue-400 bg-blue-50/90 border-dashed'
    }`}
    onMouseDown={e => {
      if (sig.status !== 'placed') return
      e.preventDefault()
      const startX = e.clientX
      const startY = e.clientY
      const startLeft = sig.x
      const startTop = sig.y
      const rect = pdfRef.current?.getBoundingClientRect()
      if (!rect) return
      const onMove = (me: MouseEvent) => {
        const dx = ((me.clientX - startX) / rect.width) * 100
        const dy = ((me.clientY - startY) / rect.height) * 100
        setSignatures(prev => prev.map(s => s._id === sig._id ? {...s, x: Math.max(0, Math.min(80, startLeft + dx)), y: Math.max(0, Math.min(90, startTop + dy))} : s))
      }
      const onUp = async (me: MouseEvent) => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        const dx = ((me.clientX - startX) / rect.width) * 100
        const dy = ((me.clientY - startY) / rect.height) * 100
        const newX = Math.max(0, Math.min(80, startLeft + dx))
        const newY = Math.max(0, Math.min(90, startTop + dy))
        try {
          await api.patch(`/api/signatures/${sig._id}`, { x: newX, y: newY })
        } catch { toast.error('Failed to save position') }
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }}
  >
    {sig.status === 'signed' && sig.signatureText ? (
      <p className="text-blue-800 font-bold text-xs italic truncate">{sig.signatureText}</p>
    ) : (
      <p className="text-blue-600 text-xs font-medium truncate">Sign here</p>
    )}
    <div className="text-[9px] leading-tight">
      <p className="text-gray-700 font-medium truncate">{sig.signerName}</p>
      {sig.signerRole && <p className="text-gray-500 truncate">{sig.signerRole}</p>}
      {sig.status === 'signed' && sig.signedAt && (
        <p className="text-gray-400 truncate">{new Date(sig.signedAt).toLocaleDateString()}</p>
      )}
    </div>
  </div>
))}

          {/* Page navigation */}
          {numPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary text-sm py-1.5 px-3">Previous</button>
              <span className="text-slate-400 text-sm">Page {currentPage} of {numPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages} className="btn-secondary text-sm py-1.5 px-3">Next</button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Signers status */}
          <div className="card p-4">
            <h3 className="font-medium text-white text-sm mb-3">Signers</h3>
            <div className="space-y-2">
              {doc.signers?.map((signer, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    signer.status === 'signed' ? 'bg-emerald-400' :
                    signer.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0 flex flex-col items-center">
                    <p className="text-slate-200 font-medium truncate">{signer.name}</p>
                    {signer.role && <p className="text-ink-400 truncate text-[11px]">{signer.role}</p>}
                    <p className="text-slate-500 truncate">{signer.email}</p>
                  </div>
                  <span className={`flex-shrink-0 ${
                    signer.status === 'signed' ? 'text-emerald-400' :
                    signer.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                  }`}>{signer.status}</span>
                </div>
              ))}
            </div>
          </div>

          <SignaturePanel
            signatures={signatures}
            currentPage={currentPage}
            onDelete={handleDeleteSignature}
          />

          {showAudit && <AuditTrail logs={auditLogs} />}
        </div>
      </div>

      {showShareModal && doc && (
        <ShareModal
          doc={doc}
          onClose={() => setShowShareModal(false)}
          onShared={updatedDoc => { setDoc(updatedDoc); setShowShareModal(false) }}
        />
      )}
    </div>
  )
}

export default DocView
