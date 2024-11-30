const express = require('express');
const { body, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const listingController = require('../controllers/listing.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const createListingLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10 // limit each IP to 10 listings per hour
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Listing:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - propertyType
 *         - state
 *         - city
 *         - price
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 2000
 *         propertyType:
 *           type: string
 *           enum: [apartment, house, room]
 *         state:
 *           type: string
 *         city:
 *           type: string
 *         address:
 *           type: string
 *         price:
 *           type: number
 *           minimum: 0
 *         bedrooms:
 *           type: number
 *           minimum: 0
 *         bathrooms:
 *           type: number
 *           minimum: 0
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         available:
 *           type: boolean
 *           default: true
 */

router.post('/',
  authenticate,
  authorize('owner'),
  createListingLimit,
  [
    body('title')
      .trim()
      .notEmpty()
      .isLength({ max: 100 })
      .withMessage('Title must be between 1-100 characters'),
    body('description')
      .trim()
      .notEmpty()
      .isLength({ max: 2000 })
      .withMessage('Description must be between 1-2000 characters'),
    body('propertyType')
      .isIn(['apartment', 'house', 'room'])
      .withMessage('Invalid property type'),
    body('state')
      .trim()
      .notEmpty()
      .withMessage('State is required'),
    body('city')
      .trim()
      .notEmpty()
      .withMessage('City is required'),
    body('price')
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('bedrooms')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Bedrooms must be a non-negative integer'),
    body('bathrooms')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Bathrooms must be a non-negative number'),
    body('amenities')
      .optional()
      .isArray()
      .withMessage('Amenities must be an array'),
    body('amenities.*')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Each amenity must be a non-empty string'),
    body('images')
      .optional()
      .isArray()
      .withMessage('Images must be an array'),
    body('images.*')
      .optional()
      .isURL()
      .withMessage('Each image must be a valid URL')
  ],
  listingController.createListing
);

router.get('/',
  [
    query('state').optional().trim(),
    query('city').optional().trim(),
    query('propertyType')
      .optional()
      .isIn(['apartment', 'house', 'room'])
      .withMessage('Invalid property type'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be non-negative'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be non-negative'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  listingController.getListings
);

router.put('/:id',
  authenticate,
  authorize('owner'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid listing ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Title must be between 1-100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be between 1-2000 characters'),
    body('propertyType')
      .optional()
      .isIn(['apartment', 'house', 'room'])
      .withMessage('Invalid property type'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('bedrooms')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Bedrooms must be a non-negative integer'),
    body('bathrooms')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Bathrooms must be a non-negative number')
  ],
  listingController.updateListing
);

router.delete('/:id',
  authenticate,
  authorize('owner'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid listing ID')
  ],
  listingController.deleteListing
);

module.exports = router;