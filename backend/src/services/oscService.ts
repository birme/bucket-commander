import { Context, createJob, getJob } from '@osaas/client-core'
import { BucketCredential } from '../models/BucketCredential'

export interface CopyJobParams {
  sourceCredential: BucketCredential
  destCredential: BucketCredential
  sourceKey: string
  destKey: string
}

export interface CopyJobResult {
  jobName: string
  status: string
}

export class OSCService {
  private ctx: Context

  constructor() {
    this.ctx = new Context()
  }

  async copyFile(params: CopyJobParams): Promise<CopyJobResult> {
    const { sourceCredential, destCredential, sourceKey, destKey } = params

    // The OSC_ACCESS_TOKEN should be set as an environment variable for the Context to use
    // Get service access token - this will use the OSC_ACCESS_TOKEN from environment
    const serviceAccessToken = await this.ctx.getServiceAccessToken('eyevinn-s3-sync')

    // Construct S3 URLs
    const sourceUrl = `s3://${sourceCredential.bucketName}/${sourceKey}`
    const destUrl = `s3://${destCredential.bucketName}/${destKey}`

    // Create job parameters - OSC only allows alphabetic characters in names
    const generateJobName = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz'
      let result = 'copy'
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const jobParams = {
      name: generateJobName(),
      cmdLineArgs: `--single-file ${sourceUrl} ${destUrl}`,
      SourceAccessKey: sourceCredential.accessKeyId,
      SourceSecretKey: sourceCredential.secretAccessKey,
      DestAccessKey: destCredential.accessKeyId,
      DestSecretKey: destCredential.secretAccessKey,
      // Only include region if no custom endpoint is set
      ...(!sourceCredential.endpoint && { SourceRegion: sourceCredential.region }),
      ...(!destCredential.endpoint && { DestRegion: destCredential.region }),
      // Include endpoint if provided
      ...(sourceCredential.endpoint && { SourceEndpoint: sourceCredential.endpoint }),
      ...(destCredential.endpoint && { DestEndpoint: destCredential.endpoint }),
      // Include session tokens if provided
      ...(sourceCredential.sessionToken && { SourceSessionToken: sourceCredential.sessionToken }),
      ...(destCredential.sessionToken && { DestSessionToken: destCredential.sessionToken })
    }

    // Create the job
    const job = await createJob(
      this.ctx,
      'eyevinn-s3-sync',
      serviceAccessToken,
      jobParams
    )

    return {
      jobName: job.name,
      status: job.status || 'created'
    }
  }

  async getJobStatus(jobName: string): Promise<any> {
    try {
      // Get service access token first
      const serviceAccessToken = await this.ctx.getServiceAccessToken('eyevinn-s3-sync')
      const job = await getJob(this.ctx, 'eyevinn-s3-sync', jobName, serviceAccessToken)
      
      // Check if job exists and has valid data
      if (!job) {
        throw new Error(`Job ${jobName} not found`)
      }

      console.log('Job response:', JSON.stringify(job, null, 2))
      
      return {
        jobName,
        status: job.status || 'unknown',
        createdAt: job.createdAt || null,
        updatedAt: job.updatedAt || null,
        output: job.output || null,
        error: job.error || null,
        rawJob: job // Include raw job data for debugging
      }
    } catch (error) {
      console.error('Error getting job status:', error)
      throw new Error(`Failed to get job status: ${error}`)
    }
  }
}

export const oscService = new OSCService()