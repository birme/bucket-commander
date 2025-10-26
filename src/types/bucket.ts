export interface BucketCredential {
  id: number
  name: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  region: string
  endpoint?: string
  bucketName: string
  createdAt: string
  updatedAt: string
}

export interface S3Object {
  key: string
  size: number
  lastModified: Date
  etag: string
  storageClass?: string
  isFolder: boolean
}

export interface BucketContent {
  objects: S3Object[]
  folders: string[]
  prefix: string
  hasMore: boolean
  nextContinuationToken?: string
}