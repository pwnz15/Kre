const express = require('express');
const { body, query, param } = require('express-validator');
const partnerController = require('../controllers/partner.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const createPartnerLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Partner:
 *       type: object
 *       required:
 *         - type
 *         - state
 *       properties:
 *         type:
 *           type: string
 *           enum: [binome, trinome, quadrinome]
 *         state:
 *           type: string
 *         university:
 *           type: string
 *         description:
 *           type: string
 *         preferences:
 *           type: object
 *           properties:
 *             gender:
 *               type: string
 *               enum: [male, female, any]
 *             priceRange:
 *               type: object
 *               properties:
 *                 min:
 *                   type: number
 *                 max:
 *                   type: number
 *             studyField:
 *               type: string
 */

router.post('/',
  authenticate,
  authorize('student'),
  createPartnerLimit,
  [
    body('type')
      .isIn(['binome', 'trinome', 'quadrinome'])
      .withMessage('Invalid partner type'),
    body('state')
      .trim()
      .notEmpty()
      .withMessage('State is required'),
    body('university')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('University cannot be empty if provided'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('preferences.gender')
      .optional()
      .isIn(['male', 'female', 'any'])
      .withMessage('Invalid gender preference'),
    body('preferences.priceRange.min')
      .optional()
      .isNumeric()
      .withMessage('Min price must be a number'),
    body('preferences.priceRange.max')
      .optional()
      .isNumeric()
      .withMessage('Max price must be a number'),
    body('preferences.studyField')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Study field cannot be empty if provided')
  ],
  partnerController.createPartnerRequest
);

router.get('/',
  [
    query('state').optional().trim(),
    query('type').optional().isIn(['binome', 'trinome', 'quadrinome']),
    query('status').optional().isIn(['active', 'found', 'closed']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  partnerController.getPartnerRequests
);

router.put('/:id',
  authenticate,
  authorize('student'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid partner request ID'),
    body('type')
      .optional()
      .isIn(['binome', 'trinome', 'quadrinome'])
      .withMessage('Invalid partner type'),
    body('state')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('State cannot be empty'),
    body('preferences.gender')
      .optional()
      .isIn(['male', 'female', 'any'])
      .withMessage('Invalid gender preference'),
    body('preferences.priceRange.min')
      .optional()
      .isNumeric()
      .withMessage('Min price must be a number'),
    body('preferences.priceRange.max')
      .optional()
      .isNumeric()
      .withMessage('Max price must be a number')
  ],
  partnerController.updatePartnerRequest
);

router.delete('/:id',
  authenticate,
  authorize('student'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid partner request ID')
  ],
  partnerController.deletePartnerRequest
);

module.exports = router;