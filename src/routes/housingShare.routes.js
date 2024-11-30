const express = require('express');
const { body, query, param } = require('express-validator');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const housingShareController = require('../controllers/housingShare.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  }
});

// Rate limiting
const createShareLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5 // limit each IP to 5 creates per hour
});

// Input validation middlewares
const validateCreateShare = [
  body('title')
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Title must be between 1-100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .isLength({ max: 1000 })
    .withMessage('Description must be between 1-1000 characters'),
  body('governorate')
    .trim()
    .notEmpty()
    .isIn(['Ariana', 'Béja', 'Ben Arous', 'Bizerte', /* ...other governorates */])
    .withMessage('Invalid governorate'),
  body('city').trim().notEmpty(),
  body('address').trim().notEmpty(),
  body('university').trim().notEmpty(),
  body('currentOccupants')
    .isInt({ min: 1 })
    .withMessage('Current occupants must be at least 1'),
  body('totalCapacity')
    .isInt({ min: 2 })
    .custom((value, { req }) => {
      if (value <= req.body.currentOccupants) {
        throw new Error('Total capacity must be greater than current occupants');
      }
      return true;
    }),
  body('pricePerPerson')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('preferences.gender')
    .isIn(['male', 'female', 'any'])
    .withMessage('Invalid gender preference'),
  body('preferences.yearOfStudy')
    .optional()
    .trim()
    .notEmpty(),
  body('preferences.studyField')
    .optional()
    .trim()
    .notEmpty()
];

const router = express.Router();

/**
 * @swagger
 * /housing-shares:
 *   post:
 *     summary: Create a new housing share post
 *     tags: [Housing Shares]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/HousingShare'
 *     responses:
 *       201:
 *         description: Housing share created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HousingShare'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: 
 *                   type: string
 *                   example: error
 *                 message: 
 *                   type: string
 *                   example: Validation error
 *                 errors: 
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only students can create housing shares
 */
router.post('/',
  authenticate,
  authorize('student'),
  createShareLimit,
  upload.array('photos', 5),
  validateCreateShare,
  housingShareController.createHousingShare
);

/**
 * @swagger
 * /housing-shares:
 *   get:
 *     summary: Get all housing shares with filters
 *     tags: [Housing Shares]
 *     parameters:
 *       - in: query
 *         name: governorate
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of housing shares
 */
router.get('/',
  [
    query('governorate')
      .optional()
      .isIn(['Ariana', 'Béja', 'Ben Arous', 'Bizerte', /* ...other governorates */]),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 }),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .custom((value, { req }) => {
        if (req.query.minPrice && Number(value) <= Number(req.query.minPrice)) {
          throw new Error('Max price must be greater than min price');
        }
        return true;
      }),
    query('status')
      .optional()
      .isIn(['available', 'occupied', 'closed']),
    query('gender')
      .optional()
      .isIn(['male', 'female', 'any']),
    query('page')
      .optional()
      .isInt({ min: 1 }),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
  ],
  housingShareController.getHousingShares
);

/**
 * @swagger
 * /housing-shares/{id}:
 *   get:
 *     summary: Get a housing share by ID
 *     tags: [Housing Shares]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Housing share details
 *       404:
 *         description: Housing share not found
 */
router.get('/:id',
  param('id').isMongoId(),
  housingShareController.getHousingShareById
);

/**
 * @swagger
 * /housing-shares/{id}:
 *   put:
 *     summary: Update a housing share
 *     tags: [Housing Shares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Housing share updated successfully
 *       404:
 *         description: Housing share not found
 */
router.put('/:id',
  authenticate,
  authorize('student'),
  upload.array('photos', 5),
  [
    param('id').isMongoId(),
    ...validateCreateShare.map(validation => validation.optional())
  ],
  housingShareController.updateHousingShare
);

/**
 * @swagger
 * /housing-shares/{id}:
 *   delete:
 *     summary: Delete a housing share
 *     tags: [Housing Shares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Housing share deleted successfully
 *       404:
 *         description: Housing share not found
 */
router.delete('/:id',
  authenticate,
  authorize('student'),
  param('id').isMongoId(),
  housingShareController.deleteHousingShare
);

module.exports = router;