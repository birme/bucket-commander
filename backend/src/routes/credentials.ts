import { Router } from 'express'
import { credentialController } from '../controllers/credentialController'

const router = Router()

router.get('/', credentialController.getAllCredentials)
router.get('/:id', credentialController.getCredentialById)
router.post('/', credentialController.createCredential)
router.put('/:id', credentialController.updateCredential)
router.delete('/:id', credentialController.deleteCredential)

export default router