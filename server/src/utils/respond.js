'use strict';

function success(res, { status = 200, message = 'OK', data = null, meta = undefined } = {}) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

module.exports = { success };
