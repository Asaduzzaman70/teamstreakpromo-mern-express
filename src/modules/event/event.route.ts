import { Router } from 'express';
import { createEvent, getAllEventsAdmin, getEventById } from './event.controller.js';
import { createEventSchema } from './event.validation.js';
import { authorizeRoles, protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { uploadFields } from '../../middlewares/multer.middleware.js';

const router = Router();

const eventUploadFields = uploadFields([
  { name: 'images', maxCount: 10 },
  { name: 'artistImages', maxCount: 10 },
  { name: 'rewardImages', maxCount: 10 },
]);

router
  .route('/')
  .post(
    protect,
    eventUploadFields,
    validateRequest(createEventSchema),
    createEvent
  )
  .get(protect, getAllEventsAdmin);

router.get('/:id', protect, getEventById);

export default router;
