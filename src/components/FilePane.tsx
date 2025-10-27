import React, { useState, useEffect, useRef } from 'react'
import { BucketCredential, S3Object, BucketContent } from '@/types/bucket'
import { apiService } from '@/services/api'
import {
  PaneContainer,
  PaneHeader,
  PaneTitle,
  PaneHeaderRight,
  BucketSelector,
  ReloadButton,
  FileList,
  FileItem,
  FileDetails,
  FileName,
  FileSize
} from './styled'

interface FilePaneProps {
  title: string
  selectedCredentialId?: number
  onCredentialChange: (credentialId: number | undefined) => void
  credentials: BucketCredential[]
  credentialsLoading: boolean
  isActive?: boolean
  initialPath?: string
  onSelectedFileChange?: (fileKey: string | null, currentPath: string) => void
  onFileDeleted?: () => void
}

export const FilePane: React.FC<FilePaneProps> = ({ 
  title, 
  selectedCredentialId, 
  onCredentialChange,
  credentials,
  credentialsLoading,
  isActive,
  initialPath,
  onSelectedFileChange,
  onFileDeleted
}) => {
  const [content, setContent] = useState<BucketContent | null>(null)
  const [currentPath, setCurrentPath] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [, setDeleteLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const fileListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedCredentialId) {
      const pathToLoad = initialPath || ''
      loadBucketContent(pathToLoad)
    } else {
      setContent(null)
      setCurrentPath('')
      setSelectedFile(null)
      setSelectedIndex(0)
      setError(null)
    }
  }, [selectedCredentialId, initialPath])

  // Get all available items for navigation
  const getAllItems = () => {
    if (!content) return []
    const items = []
    
    // Add ".." if we're not at root
    if (currentPath) {
      items.push({ type: 'parent', key: '..', isFolder: true })
    }
    
    // Add folders
    content.folders.forEach(folder => {
      items.push({ type: 'folder', key: folder, isFolder: true })
    })
    
    // Add files
    content.objects
      .filter(obj => obj.key !== currentPath)
      .forEach(obj => {
        items.push({ type: 'file', key: obj.key, isFolder: obj.isFolder, obj })
      })
    
    return items
  }

  const allItems = getAllItems()

  // Update selected file when index changes
  useEffect(() => {
    if (allItems.length > 0 && selectedIndex >= 0 && selectedIndex < allItems.length) {
      setSelectedFile(allItems[selectedIndex].key)
    }
  }, [selectedIndex, allItems.length])

  // Notify parent of selected file changes
  useEffect(() => {
    if (onSelectedFileChange) {
      onSelectedFileChange(selectedFile, currentPath)
    }
  }, [selectedFile, currentPath, onSelectedFileChange])

  // Keyboard navigation (only when file list is focused)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!content || allItems.length === 0) return

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(0, prev - 1))
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(allItems.length - 1, prev + 1))
        break
      case 'Enter':
        e.preventDefault()
        handleEnterKey()
        break
      case 'Backspace':
        e.preventDefault()
        if (currentPath) {
          handleGoUp()
        }
        break
      case 'F8':
        e.preventDefault()
        handleDelete()
        break
    }
  }

  const handleEnterKey = () => {
    if (allItems.length === 0 || selectedIndex < 0 || selectedIndex >= allItems.length) return
    
    const currentItem = allItems[selectedIndex]
    if (currentItem.type === 'parent') {
      handleGoUp()
    } else if (currentItem.type === 'folder') {
      loadBucketContent(currentItem.key)
    } else if (currentItem.isFolder) {
      loadBucketContent(currentItem.key)
    }
  }

  const loadBucketContent = async (prefix: string = '') => {
    if (!selectedCredentialId) return

    setLoading(true)
    setError(null)

    try {
      const bucketContent = await apiService.listObjects(selectedCredentialId, prefix)
      setContent(bucketContent)
      setCurrentPath(prefix)
      setSelectedFile(null)
      setSelectedIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bucket content')
      setContent(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFileDoubleClick = (item: S3Object | string) => {
    if (typeof item === 'string') {
      loadBucketContent(item)
    } else if (item.isFolder) {
      loadBucketContent(item.key)
    }
  }

  const handleFileClick = (key: string) => {
    setSelectedFile(key)
    const index = allItems.findIndex(item => item.key === key)
    if (index >= 0) {
      setSelectedIndex(index)
    }
  }

  // Handle bucket selector keyboard navigation
  const handleBucketSelectorKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        // Let the select handle its own navigation
        break
      case 'Enter':
        e.preventDefault()
        // Focus the file list after selecting a bucket
        setTimeout(() => {
          fileListRef.current?.focus()
        }, 100)
        break
      case 'Tab':
        // Tab should move to file list
        if (!e.shiftKey) {
          e.preventDefault()
          fileListRef.current?.focus()
        }
        break
    }
  }

  const handleGoUp = () => {
    if (currentPath) {
      const parentPath = currentPath.split('/').slice(0, -2).join('/')
      const newPath = parentPath ? parentPath + '/' : ''
      loadBucketContent(newPath)
    }
  }

  const handleReload = () => {
    if (selectedCredentialId) {
      loadBucketContent(currentPath)
    }
  }

  const handleDelete = async () => {
    if (!selectedCredentialId || !selectedFile || selectedFile === '..' || !content) {
      return
    }

    // Find the actual S3 object to get the full key
    const selectedObject = content.objects.find(obj => 
      obj.key === selectedFile || obj.key.endsWith('/' + selectedFile)
    )

    if (!selectedObject) {
      alert('Could not find the selected file')
      return
    }

    const fileName = selectedObject.key.split('/').pop() || selectedObject.key
    const isConfirmed = window.confirm(`Are you sure you want to delete "${fileName}"?`)
    
    if (!isConfirmed) {
      return
    }

    setDeleteLoading(true)
    try {
      // Use the full S3 object key for deletion
      await apiService.deleteFile(selectedCredentialId, selectedObject.key)
      // Reload the current directory
      await loadBucketContent(currentPath)
      // Notify parent if callback provided
      if (onFileDeleted) {
        onFileDeleted()
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }


  return (
    <PaneContainer isActive={isActive}>
      <PaneHeader>
        <PaneTitle>{title}</PaneTitle>
        <PaneHeaderRight>
          <BucketSelector
            value={selectedCredentialId || ''}
            onChange={(e) => onCredentialChange(e.target.value ? Number(e.target.value) : undefined)}
            onKeyDown={handleBucketSelectorKeyDown}
            disabled={credentialsLoading}
          >
            <option value="">
              {credentialsLoading ? 'Loading buckets...' : 'Select Bucket...'}
            </option>
            {!credentialsLoading && credentials.map(cred => (
              <option key={cred.id} value={cred.id}>
                {cred.name} ({cred.bucketName})
              </option>
            ))}
          </BucketSelector>
          <ReloadButton
            onClick={handleReload}
            disabled={!selectedCredentialId || loading}
            title="Reload bucket contents"
          >
            ⟳
          </ReloadButton>
        </PaneHeaderRight>
      </PaneHeader>

      <FileList 
        ref={fileListRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {loading && <div style={{ padding: '12px', color: '#ffff00' }}>Loading...</div>}
        
        {error && (
          <div style={{ padding: '12px', color: '#ff4444' }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && content && (
          <>
            {currentPath && (
              <FileItem
                isFolder
                selected={selectedFile === '..'}
                onClick={() => handleFileClick('..')}
                onDoubleClick={handleGoUp}
              >
                <FileDetails>
                  <FileName>..</FileName>
                  <FileSize>&lt;DIR&gt;</FileSize>
                </FileDetails>
              </FileItem>
            )}

            {content.folders.map(folder => (
              <FileItem
                key={folder}
                isFolder
                selected={selectedFile === folder}
                onClick={() => handleFileClick(folder)}
                onDoubleClick={() => handleFileDoubleClick(folder)}
              >
                <FileDetails>
                  <FileName>{folder.split('/').slice(-2)[0]}</FileName>
                  <FileSize>&lt;DIR&gt;</FileSize>
                </FileDetails>
              </FileItem>
            ))}

            {content.objects
              .filter(obj => obj.key !== currentPath)
              .map(obj => (
                <FileItem
                  key={obj.key}
                  selected={selectedFile === obj.key}
                  onClick={() => handleFileClick(obj.key)}
                  onDoubleClick={() => handleFileDoubleClick(obj)}
                >
                  <FileDetails>
                    <FileName>{obj.key.split('/').pop()}</FileName>
                    <FileSize>{formatFileSize(obj.size)}</FileSize>
                  </FileDetails>
                </FileItem>
              ))}
          </>
        )}

        {!loading && !error && !content && selectedCredentialId && (
          <div style={{ padding: '12px', color: '#aaaaaa' }}>
            No content loaded
          </div>
        )}

        {!selectedCredentialId && (
          <div style={{ padding: '12px', color: '#aaaaaa' }}>
            Please select a bucket to view its contents
          </div>
        )}
      </FileList>
    </PaneContainer>
  )
}