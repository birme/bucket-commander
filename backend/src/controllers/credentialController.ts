import { Request, Response } from 'express'
import { databaseService } from '../services/database'
import { S3Service } from '../services/s3'

export const credentialController = {
  async getAllCredentials(req: Request, res: Response) {
    try {
      const credentials = databaseService.getAllCredentials()
      res.json(credentials)
    } catch (error) {
      console.error('Error getting credentials:', error)
      res.status(500).json({ error: 'Failed to get credentials' })
    }
  },

  async getCredentialById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid credential ID' })
      }

      const credential = databaseService.getCredentialById(id)
      if (!credential) {
        return res.status(404).json({ error: 'Credential not found' })
      }

      res.json(credential)
    } catch (error) {
      console.error('Error getting credential:', error)
      res.status(500).json({ error: 'Failed to get credential' })
    }
  },

  async createCredential(req: Request, res: Response) {
    try {
      const { name, accessKeyId, secretAccessKey, sessionToken, region, endpoint, bucketName } = req.body

      if (!name || !accessKeyId || !secretAccessKey || !region || !bucketName) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, accessKeyId, secretAccessKey, region, bucketName' 
        })
      }

      const testCredential = {
        id: 0,
        name,
        accessKeyId,
        secretAccessKey,
        sessionToken: sessionToken || undefined,
        region,
        endpoint: endpoint || undefined,
        bucketName,
        createdAt: '',
        updatedAt: ''
      }

      const s3Service = new S3Service(testCredential)
      const isValid = await s3Service.testConnection()
      
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid credentials or unable to connect to S3 bucket' })
      }

      const id = databaseService.addCredential({
        name,
        accessKeyId,
        secretAccessKey,
        sessionToken: sessionToken || undefined,
        region,
        endpoint: endpoint || undefined,
        bucketName
      })

      const newCredential = databaseService.getCredentialById(id)
      res.status(201).json(newCredential)
    } catch (error) {
      console.error('Error creating credential:', error)
      res.status(500).json({ error: 'Failed to create credential' })
    }
  },

  async updateCredential(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid credential ID' })
      }

      const existing = databaseService.getCredentialById(id)
      if (!existing) {
        return res.status(404).json({ error: 'Credential not found' })
      }

      const updates = req.body
      const updated = { ...existing, ...updates }

      const s3Service = new S3Service(updated)
      const isValid = await s3Service.testConnection()
      
      if (!isValid) {
        return res.status(400).json({ error: 'Updated credentials are invalid or unable to connect to S3 bucket' })
      }

      const success = databaseService.updateCredential(id, updates)
      if (!success) {
        return res.status(500).json({ error: 'Failed to update credential' })
      }

      const updatedCredential = databaseService.getCredentialById(id)
      res.json(updatedCredential)
    } catch (error) {
      console.error('Error updating credential:', error)
      res.status(500).json({ error: 'Failed to update credential' })
    }
  },

  async deleteCredential(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid credential ID' })
      }

      const success = databaseService.deleteCredential(id)
      if (!success) {
        return res.status(404).json({ error: 'Credential not found' })
      }

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting credential:', error)
      res.status(500).json({ error: 'Failed to delete credential' })
    }
  }
}