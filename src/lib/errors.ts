import { ErrorCode } from "./enums";

/**
 * Custom error that standardizes a set of errors that can occur throught out the app.
 * Allows for an easy way to determine what went wrong the context of the error.
 * 
 * @param  message   Error message for error. Will be shown to the user via UI (Toast message etc.)
 * @param  code      Used to add context the error. Used by error handlers to determine response based on context.
 */
export class CustomError extends Error {
  constructor(message: string, public code: ErrorCode = ErrorCode.DEFAULT) {
    super(message);
    this.name = 'CustomError'
    this.code = code
  }
}

export class ResError<T> extends Error {
  constructor(public code?: T, message?: string) {
    super(message);
    this.name = 'ResError'
    this.code = code
  }
}

/**
 * Occurs when app requests for a resource that does not exist or unavailable.
 */
export class ResourceNotFoundError extends CustomError {
    constructor(message: string, public code: ErrorCode = ErrorCode.DEFAULT) {
      super(message);
      this.name = 'ResourceNotFoundError'
      this.code = code
    }
}

/**
 * Error indicating that an access token has expired.
 * Will be shown in a toast message, with a button to get a fresh token usually via login.
 */
export class ExpiredTokenError extends CustomError {
    constructor(message: string, public code: ErrorCode = ErrorCode.DEFAULT) {
      super(message);
      this.name = 'ExpiredTokenError'
      this.code = code
    }
}

/**
 * Occurs when user fails to log in properly.
 */
export class AuthenticationError extends CustomError {
    constructor(message: string, public code: ErrorCode = ErrorCode.DEFAULT) {
      super(message);
      this.name = 'AuthenticationError'
      this.code = code
    }
}

/**
 * Occurs when there is an error in an initiated Authorization Flow that leads to a failed app consent request.
 */
export class AuthorizationError extends CustomError {
    constructor(message: string, public code: ErrorCode = ErrorCode.DEFAULT) {
      super(message);
      this.name = 'AuthorizationError'
      this.code = code
    }
}

/**
 * Occurs when there is a error encountered when interacting with a player component (Music, Youtube players)
 */
export class PlayerError extends CustomError {
    constructor(message: string, public code: ErrorCode = ErrorCode.DEFAULT) {
      super(message);
      this.name = 'PlayerError'
      this.code = code
    }
}

/**
 * An abstracted error that occurs when there is an issue when interacting with a 3rd party API.
 * This is usually not relevant to the user but for developers.
 */
export class ApiError extends CustomError {
    constructor(message: string, public code: ErrorCode = ErrorCode.DEFAULT) {
      super(message);
      this.name = 'ApiError'
      this.code = code
    }
}

/**
 * Occurs when an error is encountered when validating user input.
 */
export class ValidationError extends CustomError {
    constructor(message: string, public code: ErrorCode = ErrorCode.DEFAULT) {
      super(message);
      this.name = 'ValidationError'
      this.code = code
    }
}

/**
 * Occurs when an error is encountered when working with the app's own server.
 */
export class AppServerError extends CustomError {
    constructor(message: string, public code: ErrorCode = ErrorCode.DEFAULT) {
      super(message);
      this.name = 'AppServerError'
      this.code = code
    }
}

/**
 * Occurs when an error is encountered when working with the app's own database.
 */
export class DatabaseError extends CustomError {
    constructor(message: string, public code: ErrorCode = ErrorCode.DEFAULT) {
      super(message);
      this.name = 'DatabaseError'
      this.code = code
    }
}