import { Router } from 'express';
import {
  getAllTickets,
  getSingleTicket,
  createNewTicket,
  patchTicket,
  deleteSingleTicket,
  getTicketMessages,
  postTicketMessage,
} from '../controllers/ticket.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createTicketSchema,
  updateTicketSchema,
  createMessageSchema,
} from '../validators/ticket.validator';

const router = Router();

// All ticket routes require authentication
router.use(authenticate);

// GET /api/tickets
router.get('/', getAllTickets);

// POST /api/tickets
router.post('/', validateBody(createTicketSchema), createNewTicket);

// GET /api/tickets/:id
router.get('/:id', getSingleTicket);

// PATCH /api/tickets/:id
router.patch('/:id', validateBody(updateTicketSchema), patchTicket);

// DELETE /api/tickets/:id
router.delete('/:id', deleteSingleTicket);

// GET /api/tickets/:id/messages
router.get('/:id/messages', getTicketMessages);

// POST /api/tickets/:id/messages
router.post('/:id/messages', validateBody(createMessageSchema), postTicketMessage);

export default router;
