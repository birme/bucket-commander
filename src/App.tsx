import React, { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import { BucketCredential } from '@/types/bucket'
import { paneStorage, storageService } from '@/services/storage'
import { FilePane } from '@/components/FilePane'
import { CredentialModal } from '@/components/CredentialModal'
import { CredentialListModal } from '@/components/CredentialListModal'
import {
  AppContainer,
  Header,
  Title,
  MainContent,
  StatusBar,
  Button,
  CopyButtonsContainer,
  CopyButton
} from '@/components/styled'

const App: React.FC = () => {
  const [leftPaneCredentialId, setLeftPaneCredentialId] = useState<number | undefined>()
  const [rightPaneCredentialId, setRightPaneCredentialId] = useState<number | undefined>()
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false)
  const [isCredentialListModalOpen, setIsCredentialListModalOpen] = useState(false)
  const [editingCredential, setEditingCredential] = useState<BucketCredential | undefined>()
  const [credentials, setCredentials] = useState<BucketCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [activePaneRef, setActivePaneRef] = useState<'left' | 'right'>('left')
  const [leftSelectedFile, setLeftSelectedFile] = useState<string | null>(null)
  const [leftCurrentPath, setLeftCurrentPath] = useState<string>('')
  const [rightSelectedFile, setRightSelectedFile] = useState<string | null>(null)
  const [rightCurrentPath, setRightCurrentPath] = useState<string>('')
  const [copyLoading, setCopyLoading] = useState(false)
  const [activeJobs, setActiveJobs] = useState<Map<string, any>>(new Map())
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)

  useEffect(() => {
    loadCredentials()
    
    // Clean up expired localStorage items
    storageService.cleanup()
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Tab to switch between panes
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only handle if not in a modal
        if (!isCredentialModalOpen && !isCredentialListModalOpen) {
          e.preventDefault()
          setActivePaneRef(prev => prev === 'left' ? 'right' : 'left')
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isCredentialModalOpen, isCredentialListModalOpen])

  // Load saved pane selections after credentials are loaded
  useEffect(() => {
    if (!loading && credentials.length > 0 && !hasLoadedInitialData) {
      const savedSelections = paneStorage.loadPaneSelections()
      console.log('Loading saved selections:', savedSelections)
      
      if (savedSelections) {
        // Validate that saved credential IDs still exist
        const validLeftId = savedSelections.leftId && credentials.some(c => c.id === savedSelections.leftId) 
          ? savedSelections.leftId 
          : undefined
        const validRightId = savedSelections.rightId && credentials.some(c => c.id === savedSelections.rightId) 
          ? savedSelections.rightId 
          : undefined
        
        console.log('Valid IDs:', { validLeftId, validRightId, currentLeft: leftPaneCredentialId, currentRight: rightPaneCredentialId })
        
        if (validLeftId && !leftPaneCredentialId) {
          console.log('Setting left pane:', validLeftId, savedSelections.leftPath)
          setLeftPaneCredentialId(validLeftId)
          if (savedSelections.leftPath) {
            setLeftCurrentPath(savedSelections.leftPath)
          }
        }
        if (validRightId && !rightPaneCredentialId) {
          console.log('Setting right pane:', validRightId, savedSelections.rightPath)
          setRightPaneCredentialId(validRightId)
          if (savedSelections.rightPath) {
            setRightCurrentPath(savedSelections.rightPath)
          }
        }
      } else {
        console.log('No saved selections found')
      }
      
      // Mark that we've completed the initial load
      setHasLoadedInitialData(true)
    }
  }, [loading, credentials, hasLoadedInitialData])

  // Save pane selections to localStorage whenever they change (but only after initial load)
  useEffect(() => {
    if (hasLoadedInitialData) {
      console.log('Saving pane selections (after initial load):', { leftPaneCredentialId, rightPaneCredentialId, leftCurrentPath, rightCurrentPath })
      paneStorage.savePaneSelections(leftPaneCredentialId, rightPaneCredentialId, leftCurrentPath, rightCurrentPath)
    }
  }, [leftPaneCredentialId, rightPaneCredentialId, leftCurrentPath, rightCurrentPath, hasLoadedInitialData])

  const loadCredentials = async () => {
    try {
      setLoading(true)
      const creds = await apiService.getAllCredentials()
      setCredentials(creds)
    } catch (error) {
      console.error('Failed to load credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCredentialAdded = () => {
    loadCredentials()
  }

  const handleAddCredential = () => {
    setEditingCredential(undefined)
    setIsCredentialModalOpen(true)
  }

  const handleManageCredentials = () => {
    setIsCredentialListModalOpen(true)
  }

  const handleEditCredential = (credential: BucketCredential) => {
    setEditingCredential(credential)
    setIsCredentialModalOpen(true)
  }

  const handleCredentialModalClose = () => {
    setIsCredentialModalOpen(false)
    setEditingCredential(undefined)
  }

  // Poll job status for active copy operations
  const pollJobStatus = async (jobName: string, retryCount = 0) => {
    try {
      const status = await apiService.getJobStatus(jobName)
      
      setActiveJobs(prev => {
        const newJobs = new Map(prev)
        newJobs.set(jobName, status)
        return newJobs
      })

      // Final states - stop polling
      const finalStates = ['completed', 'failed', 'error', 'cancelled', 'timeout', 'SuccessCriteriaMet']
      
      if (finalStates.includes(status.status)) {
        setTimeout(() => {
          setActiveJobs(prev => {
            const newJobs = new Map(prev)
            newJobs.delete(jobName)
            return newJobs
          })
        }, 3000) // Remove from list after 3 seconds
        return
      }

      // Continue polling for any non-final state
      // This includes: running, pending, created, unknown, starting, queued, etc.
      console.log(`Continuing to poll job ${jobName} with status: ${status.status}`)
      setTimeout(() => pollJobStatus(jobName, 0), 2000) // Poll every 2 seconds
    } catch (error) {
      console.error(`Error polling job status for ${jobName}:`, error)
      
      // Retry up to 3 times before giving up
      if (retryCount < 3) {
        console.log(`Retrying job status poll for ${jobName} (attempt ${retryCount + 1})`)
        setTimeout(() => pollJobStatus(jobName, retryCount + 1), 5000) // Wait 5 seconds before retry
      } else {
        console.log(`Giving up on job ${jobName} after 3 retries`)
        // Remove job from active list after multiple failures
        setActiveJobs(prev => {
          const newJobs = new Map(prev)
          newJobs.delete(jobName)
          return newJobs
        })
      }
    }
  }

  const handleCopyLeftToRight = async () => {
    if (!leftPaneCredentialId || !rightPaneCredentialId || !leftSelectedFile) {
      alert('Please select both buckets and a file or folder to copy')
      return
    }

    if (leftSelectedFile === '..') {
      alert('Cannot copy parent directory')
      return
    }

    setCopyLoading(true)
    try {
      const result = await apiService.copyFile(
        leftPaneCredentialId,
        rightPaneCredentialId,
        leftSelectedFile,
        rightCurrentPath
      )
      
      // Start polling job status
      pollJobStatus(result.jobName)
      
      // Show initial success message
      console.log(`Copy job started: ${result.jobName}`)
    } catch (error) {
      console.error('Copy failed:', error)
      alert(`Copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCopyLoading(false)
    }
  }

  const handleCopyRightToLeft = async () => {
    if (!rightPaneCredentialId || !leftPaneCredentialId || !rightSelectedFile) {
      alert('Please select both buckets and a file or folder to copy')
      return
    }

    if (rightSelectedFile === '..') {
      alert('Cannot copy parent directory')
      return
    }

    setCopyLoading(true)
    try {
      const result = await apiService.copyFile(
        rightPaneCredentialId,
        leftPaneCredentialId,
        rightSelectedFile,
        leftCurrentPath
      )
      
      // Start polling job status
      pollJobStatus(result.jobName)
      
      // Show initial success message
      console.log(`Copy job started: ${result.jobName}`)
    } catch (error) {
      console.error('Copy failed:', error)
      alert(`Copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCopyLoading(false)
    }
  }

  return (
    <AppContainer>
      <Header>
        <Title>🪣 Bucket Commander</Title>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={handleAddCredential}>
            Add Bucket
          </Button>
          <Button onClick={handleManageCredentials}>
            Manage Buckets
          </Button>
        </div>
      </Header>

      <MainContent>
        <FilePane
          title="Left Pane"
          selectedCredentialId={leftPaneCredentialId}
          onCredentialChange={setLeftPaneCredentialId}
          credentials={credentials}
          credentialsLoading={loading}
          isActive={activePaneRef === 'left'}
          initialPath={leftCurrentPath}
          onSelectedFileChange={(fileKey, currentPath) => {
            setLeftSelectedFile(fileKey)
            setLeftCurrentPath(currentPath)
          }}
          onFileDeleted={() => {
            // Could add additional logic here if needed
          }}
        />
        
        <CopyButtonsContainer>
          <CopyButton 
            onClick={handleCopyLeftToRight}
            disabled={copyLoading || !leftPaneCredentialId || !rightPaneCredentialId || !leftSelectedFile || leftSelectedFile === '..'}
            title="Copy selected file or folder from left to right"
          >
            {copyLoading ? '⟳' : '→'}
          </CopyButton>
          <CopyButton 
            onClick={handleCopyRightToLeft}
            disabled={copyLoading || !leftPaneCredentialId || !rightPaneCredentialId || !rightSelectedFile || rightSelectedFile === '..'}
            title="Copy selected file or folder from right to left"
          >
            {copyLoading ? '⟳' : '←'}
          </CopyButton>
        </CopyButtonsContainer>
        
        <FilePane
          title="Right Pane"
          selectedCredentialId={rightPaneCredentialId}
          onCredentialChange={setRightPaneCredentialId}
          credentials={credentials}
          credentialsLoading={loading}
          isActive={activePaneRef === 'right'}
          initialPath={rightCurrentPath}
          onSelectedFileChange={(fileKey, currentPath) => {
            setRightSelectedFile(fileKey)
            setRightCurrentPath(currentPath)
          }}
          onFileDeleted={() => {
            // Could add additional logic here if needed
          }}
        />
      </MainContent>

      <StatusBar>
        <div>
          Buckets configured: {credentials.length}
          {activeJobs.size > 0 && (
            <span style={{ marginLeft: '16px', color: '#ffff00' }}>
              Active copies: {Array.from(activeJobs.values()).map((job, index) => {
                const getStatusIcon = (status: string) => {
                  if (['completed', 'SuccessCriteriaMet'].includes(status)) return ' ✅'
                  if (['failed', 'error', 'cancelled', 'timeout'].includes(status)) return ' ❌'
                  // Any non-final status gets spinning icon
                  return ' ⟳'
                }
                
                return (
                  <span key={job.jobName} style={{ marginLeft: index > 0 ? '8px' : '4px' }}>
                    {job.jobName.substring(4, 12)}:{job.status}{getStatusIcon(job.status)}
                  </span>
                )
              })}
            </span>
          )}
        </div>
        <div>
          ↑↓-Navigate | Enter-Open | Backspace-Up | Tab-Switch Panes | →←-Copy Between Panes | F7-New Folder | F8-Delete
        </div>
      </StatusBar>

      <CredentialModal
        isOpen={isCredentialModalOpen}
        onClose={handleCredentialModalClose}
        onCredentialAdded={handleCredentialAdded}
        editCredential={editingCredential}
      />

      <CredentialListModal
        isOpen={isCredentialListModalOpen}
        onClose={() => setIsCredentialListModalOpen(false)}
        credentials={credentials}
        onCredentialUpdated={handleCredentialAdded}
        onEditCredential={handleEditCredential}
      />
    </AppContainer>
  )
}

export default App