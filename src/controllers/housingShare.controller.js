const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const sanitize = require('mongo-sanitize');
const HousingShare = require('../models/housingShare.model');
const { AppError } = require('../utils/errors');
const cloudinary = require('../utils/cloudinary');
const { logger } = require('../utils/logger');
const fs = require('fs');

// Utility functions
const validatePagination = (page, limit) => {
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 10;
  return { page, limit };
};

const handlePhotoUpload = async (files, folder = 'housing-shares') => {
  const photos = [];
  for (const file of files) {
    const result = await cloudinary.uploader.upload(file.path, { folder });
    photos.push({ url: result.secure_url, publicId: result.public_id });
    fs.unlinkSync(file.path); // Clean up temp file
  }
  return photos;
};

const deletePhotos = async (photos) => {
  for (const photo of photos) {
    await cloudinary.uploader.destroy(photo.publicId);
  }
};

// Controller methods
exports.createHousingShare = async (req, res, next) => {
  try {
    logger.info('Creating housing share', { userId: req.user?.userId });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error', 400, errors.array());
    }

    req.body = sanitize(req.body);

    if (typeof req.body.preferences === 'string') {
      req.body.preferences = JSON.parse(req.body.preferences);
    }

    if (!['male', 'female', 'any'].includes(req.body.preferences?.gender)) {
      throw new AppError('Invalid gender preference', 400);
    }

    const photos = req.files?.length ? await handlePhotoUpload(req.files) : [];

    const housingShare = new HousingShare({
      ...req.body,
      student: req.user.userId,
      photos
    });

    await housingShare.save();
    logger.info('Housing share created successfully', { id: housingShare._id });
    res.status(201).json(housingShare);
  } catch (error) {
    logger.error('Error creating housing share', { error: error.message });
    next(error);
  }
};

exports.getHousingShares = async (req, res, next) => {
  try {
    logger.info('Fetching housing shares', { query: req.query });

    const { governorate, minPrice, maxPrice, status, gender } = sanitize(req.query);
    const { page, limit } = validatePagination(req.query.page, req.query.limit);

    const query = {};
    if (governorate) query.governorate = governorate;
    if (status) query.status = status;
    if (gender) query['preferences.gender'] = gender;
    if (minPrice || maxPrice) {
      query.pricePerPerson = {};
      if (minPrice) query.pricePerPerson.$gte = Number(minPrice);
      if (maxPrice) query.pricePerPerson.$lte = Number(maxPrice);
    }

    const [shares, total] = await Promise.all([
      HousingShare.find(query)
        .populate('student', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      HousingShare.countDocuments(query)
    ]);

    res.json({
      shares,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    logger.error('Error fetching housing shares', { error: error.message });
    next(error);
  }
};

exports.getHousingShareById = async (req, res, next) => {
  try {
    logger.info('Fetching housing share by id', { id: req.params.id });

    const id = sanitize(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid housing share ID', 400);
    }

    const share = await HousingShare.findById(id)
      .populate('student', 'name email phone');

    if (!share) {
      throw new AppError('Housing share not found', 404);
    }

    logger.info('Housing share fetched successfully', { id });
    res.json(share);
  } catch (error) {
    logger.error('Error fetching housing share', { error: error.message, id: req.params.id });
    next(error);
  }
};

exports.updateHousingShare = async (req, res, next) => {
  try {
    logger.info('Updating housing share', { id: req.params.id });

    const id = sanitize(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid housing share ID', 400);
    }

    req.body = sanitize(req.body);

    const share = await HousingShare.findOne({
      _id: id,
      student: req.user.userId
    });

    if (!share) {
      throw new AppError('Housing share not found or unauthorized', 404);
    }

    // Handle photo updates
    if (req.files?.length > 0) {
      try {
        await deletePhotos(share.photos);
        const newPhotos = await handlePhotoUpload(req.files);
        req.body.photos = newPhotos;
      } catch (error) {
        logger.error('Error handling photos', { error: error.message });
        throw new AppError('Error processing photos', 500);
      }
    }

    // Validate preferences if updated
    if (req.body.preferences) {
      if (typeof req.body.preferences === 'string') {
        req.body.preferences = JSON.parse(req.body.preferences);
      }
      if (!['male', 'female', 'any'].includes(req.body.preferences?.gender)) {
        throw new AppError('Invalid gender preference', 400);
      }
    }

    Object.assign(share, req.body);
    share.updatedAt = Date.now();
    await share.save();

    logger.info('Housing share updated successfully', { id });
    res.json(share);
  } catch (error) {
    logger.error('Error updating housing share', { error: error.message, id: req.params.id });
    next(error);
  }
};

exports.deleteHousingShare = async (req, res, next) => {
  try {
    logger.info('Deleting housing share', { id: req.params.id });

    const id = sanitize(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid housing share ID', 400);
    }

    const share = await HousingShare.findOne({
      _id: id,
      student: req.user.userId
    });

    if (!share) {
      throw new AppError('Housing share not found or unauthorized', 404);
    }

    try {
      await deletePhotos(share.photos);
    } catch (error) {
      logger.error('Error deleting photos', { error: error.message });
      // Continue with deletion even if photo cleanup fails
    }

    await share.deleteOne();

    logger.info('Housing share deleted successfully', { id });
    res.json({
      status: 'success',
      message: 'Housing share deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting housing share', { error: error.message, id: req.params.id });
    next(error);
  }
};