// LocalStorage utility with expiration support

interface StoredData<T> {
  data: T
  timestamp: number
  expiresIn: number // milliseconds
}

class StorageService {
  private prefix = 'bucket-commander-'

  // Store data with expiration (default 6 hours)
  set<T>(key: string, data: T, expiresInHours: number = 6): void {
    try {
      const storedData: StoredData<T> = {
        data,
        timestamp: Date.now(),
        expiresIn: expiresInHours * 60 * 60 * 1000 // convert hours to milliseconds
      }
      localStorage.setItem(this.prefix + key, JSON.stringify(storedData))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  // Get data if not expired
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key)
      if (!item) return null

      const storedData: StoredData<T> = JSON.parse(item)
      const now = Date.now()
      
      // Check if expired
      if (now - storedData.timestamp > storedData.expiresIn) {
        this.remove(key)
        return null
      }

      return storedData.data
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
      return null
    }
  }

  // Remove specific key
  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  }

  // Clear all bucket-commander data
  clear(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix))
      keys.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }

  // Clean up expired items
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix))
      keys.forEach(key => {
        const item = localStorage.getItem(key)
        if (item) {
          try {
            const storedData: StoredData<any> = JSON.parse(item)
            const now = Date.now()
            if (now - storedData.timestamp > storedData.expiresIn) {
              localStorage.removeItem(key)
            }
          } catch {
            // Invalid data, remove it
            localStorage.removeItem(key)
          }
        }
      })
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error)
    }
  }
}

export const storageService = new StorageService()

// Pane selection specific methods
interface PaneSelections {
  leftId?: number
  rightId?: number
  leftPath?: string
  rightPath?: string
}

export const paneStorage = {
  savePaneSelections: (leftId?: number, rightId?: number, leftPath?: string, rightPath?: string) => {
    const data = { leftId, rightId, leftPath, rightPath }
    console.log('Saving pane selections:', data)
    storageService.set('pane-selections', data, 6) // 6 hours
  },

  loadPaneSelections: (): PaneSelections | null => {
    const data = storageService.get<PaneSelections>('pane-selections')
    console.log('Loading pane selections from storage:', data)
    return data
  },

  clearPaneSelections: () => {
    storageService.remove('pane-selections')
  }
}