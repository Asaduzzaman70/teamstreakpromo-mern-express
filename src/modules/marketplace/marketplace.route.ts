import { Router } from 'express';
import {
  createMarketplace,
  getAllMarketplaces,
  getMarketplaceById,
  updateMarketplace,
  deleteMarketplace,
} from './marketplace.controller.js';
import { createMarketplaceSchema, updateMarketplaceSchema } from './marketplace.validation.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { uploadAny } from '../../middlewares/multer.middleware.js';

const router = Router();
const marketplaceUploadFields = uploadAny();

router.post('/', marketplaceUploadFields, validateRequest(createMarketplaceSchema), createMarketplace);
router.get('/', getAllMarketplaces);
router.get('/:id', getMarketplaceById);
router.patch('/:id', marketplaceUploadFields, validateRequest(updateMarketplaceSchema), updateMarketplace);
router.delete('/:id', deleteMarketplace);

export const MarketplaceRoutes = router;
