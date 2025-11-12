/**
 * Custom error classes for consistent error handling across the application
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, "NOT_FOUND");
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 409, "CONFLICT", details);
  }
}

/**
 * External service error (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: unknown) {
    super(`External service error (${service}): ${message}`, 502, "EXTERNAL_SERVICE_ERROR", details);
  }
}

/**
 * Database error handler
 */
export function handleDatabaseError(error: unknown): AppError {
  if (typeof error === "object" && error !== null && "code" in error) {
    const prismaError = error as { code: string; meta?: unknown };
    
    switch (prismaError.code) {
      case "P2002":
        return new ConflictError("A record with this value already exists", prismaError.meta);
      case "P2025":
        return new NotFoundError("Record", "specified");
      case "P2003":
        return new ValidationError("Foreign key constraint failed", prismaError.meta);
      case "P2014":
        return new ValidationError("Invalid ID provided", prismaError.meta);
      default:
        return new AppError("Database operation failed", 500, prismaError.code, prismaError.meta);
    }
  }
  
  return new AppError("An unexpected database error occurred", 500);
}

/**
 * Convert error to API response format
 */
export function errorToResponse(error: unknown): { status: number; body: { error: string; code?: string; details?: unknown } } {
  if (error instanceof AppError) {
    const body: { error: string; code?: string; details?: unknown } = {
      error: error.message,
      code: error.code,
    };
    
    if (error.details !== undefined && error.details !== null) {
      body.details = error.details;
    }
    
    return {
      status: error.statusCode,
      body,
    };
  }
  
  if (error instanceof Error) {
    return {
      status: 500,
      body: {
        error: error.message || "Internal server error",
        code: "INTERNAL_ERROR",
      },
    };
  }
  
  return {
    status: 500,
    body: {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
  };
}

