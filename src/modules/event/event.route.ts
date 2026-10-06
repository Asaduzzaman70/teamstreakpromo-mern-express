import { Router } from 'express';
import { createEvent, updateEvent, getAllEvents, getAdminEvents, getEventById,
  getEventStats, deleteEvent,
  updateEventStatus } from './event.controller.js';
import { createEventSchema, updateEventSchema } from './event.validation.js';
import { authorizeRoles, protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { uploadAny } from '../../middlewares/multer.middleware.js';

const router = Router();

const eventUploadFields = uploadAny();

router
  .route('/')
  .post(
    protect,
    eventUploadFields,
    validateRequest(createEventSchema),
    createEvent
  )
  .get(protect, getAllEvents);

router.get('/admin', protect, authorizeRoles('ADMIN'), getAdminEvents);

router.get('/stats', protect, getEventStats);

router.patch('/:id/status', protect, authorizeRoles('ADMIN', 'HOST'), updateEventStatus);



router
  .route('/:id')
  .get(protect, getEventById)
  .patch(
    protect,
    eventUploadFields,
    validateRequest(updateEventSchema),
    updateEvent
  )
  .put(
    protect,
    eventUploadFields,
    validateRequest(updateEventSchema),
    updateEvent
  )
  .delete(protect, deleteEvent);

export default router;

