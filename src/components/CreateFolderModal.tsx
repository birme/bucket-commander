import React, { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import {
  Modal,
  ModalContent,
  ModalHeader,
  FormGroup,
  Label,
  Input,
  Button
} from './styled'

interface CreateFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onFolderCreated: () => void
  credentialId?: number
  currentPath?: string
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onFolderCreated,
  credentialId,
  currentPath
}) => {
  const [folderName, setFolderName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFolderName('')
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!credentialId) {
      setError('No bucket selected')
      return
    }

    if (!folderName.trim()) {
      setError('Folder name is required')
      return
    }

    // Validate folder name (no slashes, special characters)
    if (!/^[a-zA-Z0-9._-]+$/.test(folderName.trim())) {
      setError('Folder name can only contain letters, numbers, dots, hyphens, and underscores')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await apiService.createFolder(credentialId, folderName.trim(), currentPath)
      onFolderCreated()
      onClose()
    } catch (error) {
      console.error('Failed to create folder:', error)
      setError(error instanceof Error ? error.message : 'Failed to create folder')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <Modal onClick={onClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Create New Folder</h2>
          <Button onClick={onClose}>×</Button>
        </ModalHeader>
        
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="folderName">Folder Name:</Label>
            <Input
              id="folderName"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              autoFocus
              disabled={loading}
            />
          </FormGroup>

          {currentPath && (
            <FormGroup>
              <Label>Location:</Label>
              <div style={{ color: '#888', fontSize: '14px' }}>
                {currentPath || '/ (root)'}
              </div>
            </FormGroup>
          )}

          {error && (
            <div style={{ color: '#ff6b6b', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !folderName.trim()}>
              {loading ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}