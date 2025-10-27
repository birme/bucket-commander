import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { BucketCredential, S3Object, BucketContent } from '../models/BucketCredential'

export class S3Service {
  private client: S3Client
  private credential: BucketCredential

  constructor(credential: BucketCredential) {
    this.credential = credential
    this.client = new S3Client({
      region: credential.region,
      credentials: {
        accessKeyId: credential.accessKeyId,
        secretAccessKey: credential.secretAccessKey,
        ...(credential.sessionToken && { sessionToken: credential.sessionToken }),
      },
      ...(credential.endpoint && {
        endpoint: credential.endpoint,
        forcePathStyle: true,
      }),
    })
  }

  async listObjects(prefix: string = '', continuationToken?: string): Promise<BucketContent> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.credential.bucketName,
        Prefix: prefix,
        Delimiter: '/',
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      })

      const response: ListObjectsV2CommandOutput = await this.client.send(command)

      const objects: S3Object[] = (response.Contents || []).map(obj => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag || '',
        storageClass: obj.StorageClass,
        isFolder: false,
      }))

      const folders = (response.CommonPrefixes || []).map(prefix => prefix.Prefix || '')

      return {
        objects,
        folders,
        prefix,
        hasMore: response.IsTruncated || false,
        nextContinuationToken: response.NextContinuationToken,
      }
    } catch (error) {
      console.error('Error listing objects:', error)
      throw new Error(`Failed to list objects: ${error}`)
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.listObjects('', undefined)
      return true
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }

  getBucketName(): string {
    return this.credential.bucketName
  }

  getCredentialName(): string {
    return this.credential.name
  }

  async deleteObject(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.credential.bucketName,
        Key: key
      })

      await this.client.send(command)
    } catch (error) {
      console.error('Error deleting object:', error)
      throw new Error(`Failed to delete object: ${error}`)
    }
  }

  async createFolder(folderPath: string): Promise<void> {
    try {
      // Ensure the folder path ends with a slash
      const folderKey = folderPath.endsWith('/') ? folderPath : folderPath + '/'
      
      const command = new PutObjectCommand({
        Bucket: this.credential.bucketName,
        Key: folderKey,
        Body: '',
        ContentLength: 0
      })

      await this.client.send(command)
    } catch (error) {
      console.error('Error creating folder:', error)
      throw new Error(`Failed to create folder: ${error}`)
    }
  }

  async searchObjects(query: string, prefix: string = '', maxResults: number = 1000, continuationToken?: string): Promise<BucketContent> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.credential.bucketName,
        Prefix: prefix,
        Delimiter: '/',
        MaxKeys: maxResults,
        ContinuationToken: continuationToken,
      })

      const response: ListObjectsV2CommandOutput = await this.client.send(command)

      // Filter objects by search query
      const allObjects: S3Object[] = (response.Contents || []).map(obj => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag || '',
        storageClass: obj.StorageClass,
        isFolder: false,
      }))

      // Filter objects that match the search query
      const filteredObjects = allObjects.filter(obj => {
        const fileName = obj.key.split('/').pop() || obj.key
        return fileName.toLowerCase().includes(query.toLowerCase())
      })

      // Filter folders by search query  
      const allFolders = (response.CommonPrefixes || []).map(prefix => prefix.Prefix || '')
      const filteredFolders = allFolders.filter(folder => {
        const folderName = folder.split('/').slice(-2)[0]
        return folderName.toLowerCase().includes(query.toLowerCase())
      })

      return {
        objects: filteredObjects,
        folders: filteredFolders,
        prefix,
        hasMore: response.IsTruncated || false,
        nextContinuationToken: response.NextContinuationToken,
      }
    } catch (error) {
      console.error('Error searching objects:', error)
      throw new Error(`Failed to search objects: ${error}`)
    }
  }
}