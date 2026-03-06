export interface Signer {
  _id: string
  name: string
  email: string
  role: string
  shareToken?: string
  status: 'pending' | 'signed' | 'rejected'
  signedAt?: string
}

export interface Document {
  _id: string
  title: string
  filename: string
  fileSize: number
  status: 'draft' | 'pending' | 'signed' | 'rejected'
  signers: Signer[]
  shareToken?: string
  signerName?: string
  signerEmail?: string
  signedFilePath?: string
  pages: number
  createdAt: string
  updatedAt: string
}

export interface Signature {
  _id: string
  document: string
  signerEmail: string
  signerName: string
  signerRole: string
  x: number
  y: number
  width: number
  height: number
  page: number
  signatureType: 'typed' | 'drawn' | 'initials'
  signatureData?: string
  signatureText?: string
  status: 'placed' | 'signed' | 'rejected'
  rejectionReason?: string
  signedAt?: string
  createdAt: string
}

export interface AuditLog {
  _id: string
  document: string
  action: string
  actor?: { name: string; email: string }
  actorName?: string
  actorEmail?: string
  ipAddress?: string
  createdAt: string
}
