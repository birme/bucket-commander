import React, { useState } from 'react'
import { BucketCredential } from '@/types/bucket'
import { apiService } from '@/services/api'
import {
  Modal,
  ModalContent,
  ModalHeader,
  Button
} from './styled'

interface CredentialListModalProps {
  isOpen: boolean
  onClose: () => void
  credentials: BucketCredential[]
  onCredentialUpdated: () => void
  onEditCredential: (credential: BucketCredential) => void
}

export const CredentialListModal: React.FC<CredentialListModalProps> = ({
  isOpen,
  onClose,
  credentials,
  onCredentialUpdated,
  onEditCredential
}) => {
  const [deleting, setDeleting] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bucket credential?')) {
      return
    }

    setDeleting(id)
    try {
      await apiService.deleteCredential(id)
      onCredentialUpdated()
    } catch (error) {
      console.error('Failed to delete credential:', error)
      alert('Failed to delete credential: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (credential: BucketCredential) => {
    onEditCredential(credential)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()} style={{ minWidth: '600px', maxWidth: '800px' }}>
        <ModalHeader>
          Manage Bucket Credentials ({credentials.length})
        </ModalHeader>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {credentials.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#aaaaaa' }}>
              No bucket credentials configured
            </div>
          ) : (
            credentials.map(credential => (
              <div
                key={credential.id}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #404040',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#00ffff', marginBottom: '4px' }}>
                    {credential.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaaaaa' }}>
                    Bucket: {credential.bucketName} | Region: {credential.region}
                    {credential.endpoint && ` | Endpoint: ${credential.endpoint}`}
                    {credential.sessionToken && ' | Has Session Token'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666666', marginTop: '2px' }}>
                    Created: {new Date(credential.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    onClick={() => handleEdit(credential)}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(credential.id)}
                    disabled={deleting === credential.id}
                    style={{ 
                      fontSize: '11px', 
                      padding: '4px 8px',
                      backgroundColor: '#cc4444',
                      borderColor: '#cc4444'
                    }}
                  >
                    {deleting === credential.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
}