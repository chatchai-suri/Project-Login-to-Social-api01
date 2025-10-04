export default function createError(statusCode, msg, errors) {
  const err = new Error(msg);
  err.statusCode = statusCode;
  err.errors = errors || null;
  err.success = false;

  return err;
}