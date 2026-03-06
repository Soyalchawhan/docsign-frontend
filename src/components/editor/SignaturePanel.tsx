import React from 'react'
import { Signature } from '../../utils/types'

interface Props {
  signatures: Signature[]
  currentPage: number
  onDelete: (id: string) => void
}

const SignaturePanel: React.FC<Props> = ({ signatures, currentPage, onDelete }) => {
  return (
    <div className="card p-4">
      <h3 className="font-medium text-white text-sm mb-4 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        Signatures ({signatures.length})
      </h3>

      {signatures.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-500 text-xs">No signature fields yet.</p>
          <p className="text-slate-600 text-xs mt-1">Click "Add Signature Field" then select a signer.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {signatures.map(sig => (
            <div
              key={sig._id}
              className={`flex items-start gap-2 p-2.5 rounded-lg text-xs transition-colors ${
                sig.page === currentPage ? 'bg-slate-800' : 'bg-slate-900 opacity-60'
              }`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${
                sig.status === 'signed' ? 'bg-emerald-400' :
                sig.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 font-medium truncate">{sig.signerName}</p>
                {sig.signerRole && (
                  <p className="text-ink-400 truncate">{sig.signerRole}</p>
                )}
                <p className="text-slate-500 truncate">{sig.signerEmail}</p>
                <p className="text-slate-600 mt-0.5">Page {sig.page} · {sig.status}</p>
                {sig.status === 'signed' && sig.signedAt && (
                  <p className="text-emerald-500 text-[10px]">
                    Signed {new Date(sig.signedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              {sig.status === 'placed' && (
                <button
                  onClick={() => onDelete(sig._id)}
                  className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SignaturePanel
