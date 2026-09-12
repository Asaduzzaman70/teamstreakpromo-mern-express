import { Router } from 'express';
import {
  createMarketplace,
  getAllMarketplaces,
  getMyMarketplaces,
  getMarketplaceById,
  updateMarketplace,
  deleteMarketplace,
} from './marketplace.controller.js';
import { createMarketplaceSchema, updateMarketplaceSchema } from './marketplace.validation.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { uploadAny } from '../../middlewares/multer.middleware.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';

const router = Router();
const marketplaceUploadFields = uploadAny();

router.post(
  '/',
  protect,
  authorizeRoles('BUSINESS'),
  marketplaceUploadFields,
  validateRequest(createMarketplaceSchema),
  createMarketplace
);
router.get('/', getAllMarketplaces);
router.get(
  '/my-marketplaces',
  protect,
  authorizeRoles('BUSINESS'),
  getMyMarketplaces
);
router.get('/:id', getMarketplaceById);
router.patch(
  '/:id',
  protect,
  authorizeRoles('BUSINESS'),
  marketplaceUploadFields,
  validateRequest(updateMarketplaceSchema),
  updateMarketplace
);
router.delete(
  '/:id',
  protect,
  authorizeRoles('BUSINESS'),
  deleteMarketplace
);

export const MarketplaceRoutes = router;

