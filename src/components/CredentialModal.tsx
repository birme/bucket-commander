import React, { useState, useEffect } from 'react'
import { BucketCredential } from '@/types/bucket'
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

interface CredentialModalProps {
  isOpen: boolean
  onClose: () => void
  onCredentialAdded: () => void
  editCredential?: BucketCredential
}

export const CredentialModal: React.FC<CredentialModalProps> = ({
  isOpen,
  onClose,
  onCredentialAdded,
  editCredential
}) => {
  const [formData, setFormData] = useState({
    name: '',
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
    region: 'us-east-1',
    endpoint: '',
    bucketName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update form data when editCredential changes
  useEffect(() => {
    if (editCredential) {
      setFormData({
        name: editCredential.name || '',
        accessKeyId: editCredential.accessKeyId || '',
        secretAccessKey: editCredential.secretAccessKey || '',
        sessionToken: editCredential.sessionToken || '',
        region: editCredential.region || 'us-east-1',
        endpoint: editCredential.endpoint || '',
        bucketName: editCredential.bucketName || ''
      })
    } else {
      setFormData({
        name: '',
        accessKeyId: '',
        secretAccessKey: '',
        sessionToken: '',
        region: 'us-east-1',
        endpoint: '',
        bucketName: ''
      })
    }
  }, [editCredential])

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (editCredential) {
        await apiService.updateCredential(editCredential.id, {
          ...formData,
          sessionToken: formData.sessionToken || undefined,
          endpoint: formData.endpoint || undefined
        })
      } else {
        await apiService.createCredential({
          ...formData,
          sessionToken: formData.sessionToken || undefined,
          endpoint: formData.endpoint || undefined
        })
      }
      
      onCredentialAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save credential')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onClose()
    setError(null)
  }

  if (!isOpen) return null

  return (
    <Modal onClick={handleCancel}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          {editCredential ? 'Edit Bucket Credential' : 'Add New Bucket Credential'}
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Name</Label>
            <Input
              type="text"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
              placeholder="My S3 Bucket"
            />
          </FormGroup>

          <FormGroup>
            <Label>Access Key ID</Label>
            <Input
              type="text"
              value={formData.accessKeyId}
              onChange={handleInputChange('accessKeyId')}
              required
              placeholder="AKIAIOSFODNN7EXAMPLE"
            />
          </FormGroup>

          <FormGroup>
            <Label>Secret Access Key</Label>
            <Input
              type="password"
              value={formData.secretAccessKey}
              onChange={handleInputChange('secretAccessKey')}
              required
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            />
          </FormGroup>

          <FormGroup>
            <Label>Session Token (Optional)</Label>
            <Input
              type="password"
              value={formData.sessionToken}
              onChange={handleInputChange('sessionToken')}
              placeholder="FwoGZXIvYXdzEDoaDFyJSDJF..."
            />
          </FormGroup>

          <FormGroup>
            <Label>Region</Label>
            <Input
              type="text"
              value={formData.region}
              onChange={handleInputChange('region')}
              required
              placeholder="us-east-1"
            />
          </FormGroup>

          <FormGroup>
            <Label>Endpoint (Optional)</Label>
            <Input
              type="text"
              value={formData.endpoint}
              onChange={handleInputChange('endpoint')}
              placeholder="https://s3.amazonaws.com"
            />
          </FormGroup>

          <FormGroup>
            <Label>Bucket Name</Label>
            <Input
              type="text"
              value={formData.bucketName}
              onChange={handleInputChange('bucketName')}
              required
              placeholder="my-bucket-name"
            />
          </FormGroup>

          {error && (
            <div style={{ color: '#ff4444', marginBottom: '16px', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button type="button" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Testing...' : editCredential ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}