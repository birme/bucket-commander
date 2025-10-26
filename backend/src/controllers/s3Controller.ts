import { Request, Response } from 'express'
import { databaseService } from '../services/database'
import { S3Service } from '../services/s3'
import { oscService } from '../services/oscService'

export const s3Controller = {
  async listObjects(req: Request, res: Response) {
    try {
      const credentialId = parseInt(req.params.credentialId)
      if (isNaN(credentialId)) {
        return res.status(400).json({ error: 'Invalid credential ID' })
      }

      const credential = databaseService.getCredentialById(credentialId)
      if (!credential) {
        return res.status(404).json({ error: 'Credential not found' })
      }

      const prefix = req.query.prefix as string || ''
      const continuationToken = req.query.continuationToken as string

      const s3Service = new S3Service(credential)
      const content = await s3Service.listObjects(prefix, continuationToken)

      res.json(content)
    } catch (error) {
      console.error('Error listing objects:', error)
      res.status(500).json({ error: 'Failed to list objects' })
    }
  },

  async testConnection(req: Request, res: Response) {
    try {
      const credentialId = parseInt(req.params.credentialId)
      if (isNaN(credentialId)) {
        return res.status(400).json({ error: 'Invalid credential ID' })
      }

      const credential = databaseService.getCredentialById(credentialId)
      if (!credential) {
        return res.status(404).json({ error: 'Credential not found' })
      }

      const s3Service = new S3Service(credential)
      const isValid = await s3Service.testConnection()

      res.json({ valid: isValid })
    } catch (error) {
      console.error('Error testing connection:', error)
      res.status(500).json({ error: 'Failed to test connection' })
    }
  },

  async copyFile(req: Request, res: Response) {
    try {
      const { sourceCredentialId, destCredentialId, sourceKey, destKey } = req.body

      if (!sourceCredentialId || !destCredentialId || !sourceKey) {
        return res.status(400).json({ error: 'Missing required parameters' })
      }

      const sourceCredential = databaseService.getCredentialById(sourceCredentialId)
      if (!sourceCredential) {
        return res.status(404).json({ error: 'Source credential not found' })
      }

      const destCredential = databaseService.getCredentialById(destCredentialId)
      if (!destCredential) {
        return res.status(404).json({ error: 'Destination credential not found' })
      }

      // Use the same key if destKey is not provided
      const finalDestKey = destKey || sourceKey

      const result = await oscService.copyFile({
        sourceCredential,
        destCredential,
        sourceKey,
        destKey: finalDestKey
      })

      res.json({
        success: true,
        jobName: result.jobName,
        status: result.status,
        message: 'Copy job initiated successfully'
      })
    } catch (error) {
      console.error('Error copying file:', error)
      res.status(500).json({ 
        error: 'Failed to initiate copy job',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  async deleteFile(req: Request, res: Response) {
    try {
      const credentialId = parseInt(req.params.credentialId)
      const { key } = req.body

      if (isNaN(credentialId)) {
        return res.status(400).json({ error: 'Invalid credential ID' })
      }

      if (!key) {
        return res.status(400).json({ error: 'File key is required' })
      }

      const credential = databaseService.getCredentialById(credentialId)
      if (!credential) {
        return res.status(404).json({ error: 'Credential not found' })
      }

      const s3Service = new S3Service(credential)
      await s3Service.deleteObject(key)

      res.json({
        success: true,
        message: 'File deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      res.status(500).json({ 
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  async getJobStatus(req: Request, res: Response) {
    try {
      const { jobName } = req.params

      if (!jobName) {
        return res.status(400).json({ error: 'Job name is required' })
      }

      const status = await oscService.getJobStatus(jobName)
      res.json(status)
    } catch (error) {
      console.error('Error getting job status:', error)
      res.status(500).json({ 
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}