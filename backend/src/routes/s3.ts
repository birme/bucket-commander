import { Router } from 'express'
import { s3Controller } from '../controllers/s3Controller'

const router = Router()

router.get('/:credentialId/objects', s3Controller.listObjects)
router.get('/:credentialId/search', s3Controller.searchObjects)
router.get('/:credentialId/test', s3Controller.testConnection)
router.post('/copy', s3Controller.copyFile)
router.delete('/:credentialId/delete', s3Controller.deleteFile)
router.post('/:credentialId/create-folder', s3Controller.createFolder)
router.get('/job/:jobName/status', s3Controller.getJobStatus)

export default router