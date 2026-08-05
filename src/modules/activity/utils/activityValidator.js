const HttpError = require('../../../utils/httpError');

const ALLOWED_FIELDS = ['action', 'info'];

function validatePayloadShape(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'Body must be a JSON object.');
  }
}

function ensureNoUnknownFields(payload) {
  const unknownFields = Object.keys(payload).filter(
    (field) => !ALLOWED_FIELDS.includes(field)
  );

  if (unknownFields.length > 0) {
    throw new HttpError(400, 'Body contains unsupported fields.', {
      unsupportedFields: unknownFields,
    });
  }
}

function normalizeAction(payload, normalized) {
  if (typeof payload.action !== 'string') {
    throw new HttpError(400, '"action" is required and must be a string.');
  }

  const trimmedAction = payload.action.trim();
  if (!trimmedAction) {
    throw new HttpError(400, '"action" cannot be empty.');
  }

  normalized.action = trimmedAction;
}

function normalizeInfo(payload, normalized) {
  if (typeof payload.info !== 'string') {
    throw new HttpError(400, '"info" is required and must be a string.');
  }

  const trimmedInfo = payload.info.trim();
  if (!trimmedInfo) {
    throw new HttpError(400, '"info" cannot be empty.');
  }

  normalized.info = trimmedInfo;
}

function validateCreateActivity(payload) {
  validatePayloadShape(payload);
  ensureNoUnknownFields(payload);

  const normalized = {};
  normalizeAction(payload, normalized);
  normalizeInfo(payload, normalized);

  return normalized;
}

module.exports = {
  validateCreateActivity,
};