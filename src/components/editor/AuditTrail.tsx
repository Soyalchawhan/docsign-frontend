import React from 'react'
import { AuditLog } from '../../utils/types'

interface Props { logs: AuditLog[] }

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  document_uploaded: { label: 'Uploaded', color: 'text-blue-400' },
  document_viewed: { label: 'Viewed', color: 'text-slate-400' },
  signature_placed: { label: 'Signature placed', color: 'text-ink-400' },
  share_link_generated: { label: 'Link shared', color: 'text-amber-400' },
  signing_started: { label: 'Signing started', color: 'text-amber-400' },
  document_signed: { label: 'Signed', color: 'text-emerald-400' },
  document_rejected: { label: 'Rejected', color: 'text-red-400' },
  signed_pdf_generated: { label: 'PDF generated', color: 'text-emerald-400' },
  document_downloaded: { label: 'Downloaded', color: 'text-slate-400' },
}

const AuditTrail: React.FC<Props> = ({ logs }) => {
  return (
    <div className="card p-4">
      <h3 className="font-medium text-white text-sm mb-4 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        Audit Trail
      </h3>

      {logs.length === 0 ? (
        <p className="text-slate-500 text-xs text-center py-4">No events yet</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {logs.map((log, i) => {
            const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'text-slate-400' }
            return (
              <div key={log._id} className="flex gap-2.5 text-xs">
                <div className="flex flex-col items-center">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 bg-current ${meta.color}`} />
                  {i < logs.length - 1 && <div className="flex-1 w-px bg-slate-800 mt-1" />}
                </div>
                <div className="pb-3 flex-1 min-w-0">
                  <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                  <div className="text-slate-500 mt-0.5">
                    {log.actorName || log.actor?.name || 'System'}
                  </div>
                  <div className="text-slate-600 font-mono text-[10px]">
                    {new Date(log.createdAt).toLocaleString()}
                    {log.ipAddress && ` · ${log.ipAddress}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AuditTrail
