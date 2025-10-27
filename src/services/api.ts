import { BucketCredential, BucketContent } from '@/types/bucket'

const API_BASE_URL = '/api'

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async getAllCredentials(): Promise<BucketCredential[]> {
    return this.request<BucketCredential[]>('/credentials')
  }

  async getCredentialById(id: number): Promise<BucketCredential> {
    return this.request<BucketCredential>(`/credentials/${id}`)
  }

  async createCredential(credential: Omit<BucketCredential, 'id' | 'createdAt' | 'updatedAt'>): Promise<BucketCredential> {
    return this.request<BucketCredential>('/credentials', {
      method: 'POST',
      body: JSON.stringify(credential),
    })
  }

  async updateCredential(id: number, updates: Partial<Omit<BucketCredential, 'id' | 'createdAt' | 'updatedAt'>>): Promise<BucketCredential> {
    return this.request<BucketCredential>(`/credentials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteCredential(id: number): Promise<void> {
    await this.request<void>(`/credentials/${id}`, {
      method: 'DELETE',
    })
  }

  async listObjects(credentialId: number, prefix?: string, continuationToken?: string): Promise<BucketContent> {
    const params = new URLSearchParams()
    if (prefix) params.append('prefix', prefix)
    if (continuationToken) params.append('continuationToken', continuationToken)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<BucketContent>(`/s3/${credentialId}/objects${query}`)
  }

  async testConnection(credentialId: number): Promise<{ valid: boolean }> {
    return this.request<{ valid: boolean }>(`/s3/${credentialId}/test`)
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/health')
  }

  async copyFile(sourceCredentialId: number, destCredentialId: number, sourceKey: string, destKey?: string): Promise<{ success: boolean; jobName: string; status: string; message: string }> {
    return this.request<{ success: boolean; jobName: string; status: string; message: string }>('/s3/copy', {
      method: 'POST',
      body: JSON.stringify({
        sourceCredentialId,
        destCredentialId,
        sourceKey,
        destKey
      })
    })
  }

  async deleteFile(credentialId: number, key: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/s3/${credentialId}/delete`, {
      method: 'DELETE',
      body: JSON.stringify({ key })
    })
  }

  async getJobStatus(jobName: string): Promise<{ jobName: string; status: string; createdAt?: string; updatedAt?: string; output?: string; error?: string }> {
    return this.request<{ jobName: string; status: string; createdAt?: string; updatedAt?: string; output?: string; error?: string }>(`/s3/job/${jobName}/status`)
  }

  async createFolder(credentialId: number, folderName: string, currentPath?: string): Promise<{ success: boolean; message: string; folderPath: string }> {
    return this.request<{ success: boolean; message: string; folderPath: string }>(`/s3/${credentialId}/create-folder`, {
      method: 'POST',
      body: JSON.stringify({
        folderName,
        currentPath
      })
    })
  }
}

export const apiService = new ApiService()