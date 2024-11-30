const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const sanitize = require('mongo-sanitize');
const Listing = require('../models/listing.model');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

const validatePagination = (page, limit) => {
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 10;
  return { page, limit };
};

exports.createListing = async (req, res, next) => {
  try {
    logger.info('Creating listing', { userId: req.user?.userId });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error', 400, errors.array());
    }

    req.body = sanitize(req.body);

    // Validate numeric fields
    const { price, bedrooms, bathrooms } = req.body;
    if (!price || isNaN(price)) throw new AppError('Invalid price', 400);
    if (bedrooms && isNaN(bedrooms)) throw new AppError('Invalid bedrooms', 400);
    if (bathrooms && isNaN(bathrooms)) throw new AppError('Invalid bathrooms', 400);

    const listing = new Listing({
      ...req.body,
      owner: req.user.userId
    });

    await listing.save();
    logger.info('Listing created successfully', { id: listing._id });
    res.status(201).json(listing);
  } catch (error) {
    logger.error('Error creating listing', { error: error.message });
    next(error);
  }
};

exports.getListings = async (req, res, next) => {
  try {
    logger.info('Fetching listings', { query: req.query });
    
    const { state, city, propertyType, minPrice, maxPrice } = sanitize(req.query);
    const { page, limit } = validatePagination(req.query.page, req.query.limit);

    const query = {};
    if (state) query.state = state;
    if (city) query.city = city;
    if (propertyType) query.propertyType = propertyType;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate('owner', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Listing.countDocuments(query)
    ]);

    res.json({
      listings,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    logger.error('Error fetching listings', { error: error.message });
    next(error);
  }
};

exports.updateListing = async (req, res, next) => {
  try {
    logger.info('Updating listing', { id: req.params.id });

    const id = sanitize(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid listing ID', 400);
    }

    req.body = sanitize(req.body);

    const listing = await Listing.findOne({
      _id: id,
      owner: req.user.userId
    });

    if (!listing) {
      throw new AppError('Listing not found or unauthorized', 404);
    }

    // Validate numeric fields if updated
    const { price, bedrooms, bathrooms } = req.body;
    if (price && isNaN(price)) throw new AppError('Invalid price', 400);
    if (bedrooms && isNaN(bedrooms)) throw new AppError('Invalid bedrooms', 400);
    if (bathrooms && isNaN(bathrooms)) throw new AppError('Invalid bathrooms', 400);

    Object.assign(listing, req.body);
    listing.updatedAt = Date.now();
    await listing.save();

    logger.info('Listing updated successfully', { id });
    res.json(listing);
  } catch (error) {
    logger.error('Error updating listing', { error: error.message, id: req.params.id });
    next(error);
  }
};

exports.deleteListing = async (req, res, next) => {
  try {
    logger.info('Deleting listing', { id: req.params.id });

    const id = sanitize(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid listing ID', 400);
    }

    const listing = await Listing.findOneAndDelete({
      _id: id,
      owner: req.user.userId
    });

    if (!listing) {
      throw new AppError('Listing not found or unauthorized', 404);
    }

    logger.info('Listing deleted successfully', { id });
    res.json({ 
      status: 'success',
      message: 'Listing deleted successfully' 
    });
  } catch (error) {
    logger.error('Error deleting listing', { error: error.message, id: req.params.id });
    next(error);
  }
};