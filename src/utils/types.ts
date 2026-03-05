export interface Document {
  _id: string
  title: string
  filename: string
  originalName: string
  filePath: string
  fileSize: number
  owner: { _id: string; name: string; email: string }
  status: 'draft' | 'pending' | 'signed' | 'rejected'
  signerEmail?: string
  signerName?: string
  shareToken?: string
  shareTokenExpiry?: string
  signedFilePath?: string
  pages: number
  createdAt: string
  updatedAt: string
}

export interface Signature {
  _id: string
  document: string
  signer?: { _id: string; name: string; email: string }
  signerName: string
  signerEmail: string
  x: number
  y: number
  width: number
  height: number
  page: number
  signatureType?: 'typed' | 'drawn' | 'initials'
  signatureData?: string
  signatureText?: string
  status: 'placed' | 'signed' | 'rejected'
  rejectionReason?: string
  signedAt?: string
  ipAddress?: string
  createdAt: string
}

export interface AuditLog {
  _id: string
  document: string
  action: string
  actor?: { _id: string; name: string; email: string }
  actorName: string
  actorEmail?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
  createdAt: string
}
