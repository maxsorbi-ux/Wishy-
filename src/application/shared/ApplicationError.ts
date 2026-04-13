/**
 * Application-level errors
 */

export class ApplicationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export class RepositoryError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("REPOSITORY_ERROR", message, details);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super("NOT_FOUND", `${resource} with ID ${id} not found`, { resource, id });
  }
}
