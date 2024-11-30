const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const sanitize = require('mongo-sanitize');
const Partner = require('../models/partner.model');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

const validatePagination = (page, limit) => {
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 10;
  return { page, limit };
};

exports.createPartnerRequest = async (req, res, next) => {
  try {
    logger.info('Creating partner request', { userId: req.user?.userId });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error', 400, errors.array());
    }

    req.body = sanitize(req.body);

    // Validate preferences if present
    if (req.body.preferences) {
      if (typeof req.body.preferences === 'string') {
        req.body.preferences = JSON.parse(req.body.preferences);
      }
      
      const { gender, priceRange } = req.body.preferences;
      if (gender && !['male', 'female', 'any'].includes(gender)) {
        throw new AppError('Invalid gender preference', 400);
      }
      
      if (priceRange) {
        if (isNaN(priceRange.min) || isNaN(priceRange.max)) {
          throw new AppError('Invalid price range', 400);
        }
        if (priceRange.min > priceRange.max) {
          throw new AppError('Min price cannot be greater than max price', 400);
        }
      }
    }

    const partnerRequest = new Partner({
      ...req.body,
      student: req.user.userId
    });

    await partnerRequest.save();
    logger.info('Partner request created successfully', { id: partnerRequest._id });
    res.status(201).json(partnerRequest);
  } catch (error) {
    logger.error('Error creating partner request', { error: error.message });
    next(error);
  }
};

exports.getPartnerRequests = async (req, res, next) => {
  try {
    logger.info('Fetching partner requests', { query: req.query });

    const { state, type, status } = sanitize(req.query);
    const { page, limit } = validatePagination(req.query.page, req.query.limit);
    
    const query = {};
    if (state) query.state = state;
    if (type) query.type = type;
    if (status) query.status = status;

    const [requests, total] = await Promise.all([
      Partner.find(query)
        .populate('student', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Partner.countDocuments(query)
    ]);

    res.json({
      requests,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    logger.error('Error fetching partner requests', { error: error.message });
    next(error);
  }
};

exports.updatePartnerRequest = async (req, res, next) => {
  try {
    logger.info('Updating partner request', { id: req.params.id });

    const id = sanitize(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid partner request ID', 400);
    }

    req.body = sanitize(req.body);

    const request = await Partner.findOne({
      _id: id,
      student: req.user.userId
    });

    if (!request) {
      throw new AppError('Request not found or unauthorized', 404);
    }

    // Validate preferences if updated
    if (req.body.preferences) {
      if (typeof req.body.preferences === 'string') {
        req.body.preferences = JSON.parse(req.body.preferences);
      }
      const { gender, priceRange } = req.body.preferences;
      if (gender && !['male', 'female', 'any'].includes(gender)) {
        throw new AppError('Invalid gender preference', 400);
      }
      if (priceRange) {
        if (isNaN(priceRange.min) || isNaN(priceRange.max)) {
          throw new AppError('Invalid price range', 400);
        }
        if (priceRange.min > priceRange.max) {
          throw new AppError('Min price cannot be greater than max price', 400);
        }
      }
    }

    Object.assign(request, req.body);
    request.updatedAt = Date.now();
    await request.save();

    logger.info('Partner request updated successfully', { id });
    res.json(request);
  } catch (error) {
    logger.error('Error updating partner request', { error: error.message, id: req.params.id });
    next(error);
  }
};

exports.deletePartnerRequest = async (req, res, next) => {
  try {
    logger.info('Deleting partner request', { id: req.params.id });

    const id = sanitize(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid partner request ID', 400);
    }

    const request = await Partner.findOneAndDelete({
      _id: id,
      student: req.user.userId
    });

    if (!request) {
      throw new AppError('Request not found or unauthorized', 404);
    }

    logger.info('Partner request deleted successfully', { id });
    res.json({ 
      status: 'success',
      message: 'Partner request deleted successfully' 
    });
  } catch (error) {
    logger.error('Error deleting partner request', { error: error.message, id: req.params.id });
    next(error);
  }
};