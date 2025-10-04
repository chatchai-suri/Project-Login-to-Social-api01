import { ZodError } from "zod";

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if(error instanceof ZodError) {
    const validateErrors = error.errors.reduce((acc, cur) => (
      {
        ...acc,
        [cur.path[0]]: cur.message
      }
    ), {});

    error.errors = validateErrors;
  }

  res.status(...error, err.statusCode || 500).json({ message: err.message || 'Somthing went wrong' });
}

export default errorMiddleware;