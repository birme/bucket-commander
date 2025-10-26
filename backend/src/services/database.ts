import Database from 'better-sqlite3'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { BucketCredential } from '../models/BucketCredential'

class DatabaseService {
  private db: Database.Database

  constructor() {
    const userDataPath = path.join(os.homedir(), '.bucket-commander')
    
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true })
    }
    
    const dbPath = path.join(userDataPath, 'bucket-commander.db')
    this.db = new Database(dbPath)
    this.initializeDatabase()
  }

  private initializeDatabase() {
    const createCredentialsTable = `
      CREATE TABLE IF NOT EXISTS bucket_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        access_key_id TEXT NOT NULL,
        secret_access_key TEXT NOT NULL,
        session_token TEXT,
        region TEXT NOT NULL,
        endpoint TEXT,
        bucket_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `

    this.db.exec(createCredentialsTable)

    // Add session_token column to existing tables if it doesn't exist
    try {
      this.db.exec('ALTER TABLE bucket_credentials ADD COLUMN session_token TEXT')
    } catch (error) {
      // Column already exists, ignore error
    }

    const createUpdateTrigger = `
      CREATE TRIGGER IF NOT EXISTS update_bucket_credentials_timestamp 
      AFTER UPDATE ON bucket_credentials
      BEGIN
        UPDATE bucket_credentials SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `

    this.db.exec(createUpdateTrigger)
  }

  addCredential(credential: Omit<BucketCredential, 'id' | 'createdAt' | 'updatedAt'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO bucket_credentials (name, access_key_id, secret_access_key, session_token, region, endpoint, bucket_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      credential.name,
      credential.accessKeyId,
      credential.secretAccessKey,
      credential.sessionToken || null,
      credential.region,
      credential.endpoint || null,
      credential.bucketName
    )

    return result.lastInsertRowid as number
  }

  getAllCredentials(): BucketCredential[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        name,
        access_key_id as accessKeyId,
        secret_access_key as secretAccessKey,
        session_token as sessionToken,
        region,
        endpoint,
        bucket_name as bucketName,
        created_at as createdAt,
        updated_at as updatedAt
      FROM bucket_credentials
      ORDER BY name
    `)

    return stmt.all() as BucketCredential[]
  }

  getCredentialById(id: number): BucketCredential | undefined {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        name,
        access_key_id as accessKeyId,
        secret_access_key as secretAccessKey,
        session_token as sessionToken,
        region,
        endpoint,
        bucket_name as bucketName,
        created_at as createdAt,
        updated_at as updatedAt
      FROM bucket_credentials
      WHERE id = ?
    `)

    return stmt.get(id) as BucketCredential | undefined
  }

  updateCredential(id: number, credential: Partial<Omit<BucketCredential, 'id' | 'createdAt' | 'updatedAt'>>): boolean {
    const fields = []
    const values = []

    if (credential.name !== undefined) {
      fields.push('name = ?')
      values.push(credential.name)
    }
    if (credential.accessKeyId !== undefined) {
      fields.push('access_key_id = ?')
      values.push(credential.accessKeyId)
    }
    if (credential.secretAccessKey !== undefined) {
      fields.push('secret_access_key = ?')
      values.push(credential.secretAccessKey)
    }
    if (credential.sessionToken !== undefined) {
      fields.push('session_token = ?')
      values.push(credential.sessionToken)
    }
    if (credential.region !== undefined) {
      fields.push('region = ?')
      values.push(credential.region)
    }
    if (credential.endpoint !== undefined) {
      fields.push('endpoint = ?')
      values.push(credential.endpoint)
    }
    if (credential.bucketName !== undefined) {
      fields.push('bucket_name = ?')
      values.push(credential.bucketName)
    }

    if (fields.length === 0) return false

    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE bucket_credentials 
      SET ${fields.join(', ')}
      WHERE id = ?
    `)

    const result = stmt.run(...values)
    return result.changes > 0
  }

  deleteCredential(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM bucket_credentials WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  close() {
    this.db.close()
  }
}

export const databaseService = new DatabaseService()