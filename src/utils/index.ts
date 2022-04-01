type TExtendError = Error & { status?: number };

export const createError = (status: number, message: string): TExtendError => {
  const error: TExtendError = new Error(message);
  error.status = status;

  return error;
};

export const sleep = ms => new Promise(res => setTimeout(res, ms));

export const clear = (obj: any) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== undefined) {
      acc[key] = obj[key];
    }

    return acc;
  }, {});
};

export const bn = b => BigInt(`0x${b.toString('hex')}`);

import signale from 'signale';

export const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch((e) => {
    signale.error(e && e.message);
  });
};