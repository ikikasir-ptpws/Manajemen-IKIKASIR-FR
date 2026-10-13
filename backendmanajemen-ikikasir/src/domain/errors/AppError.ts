/**
 * Base Application Error
 * Digunakan sebagai fondasi penanganan error di seluruh layer (Clean Architecture)
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: unknown[];

  constructor(message: string, statusCode = 500, errors?: unknown[]) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    // Mempertahankan stack trace yang tepat
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request
 * Digunakan ketika input dari client tidak valid atau format salah
 */
export class BadRequestError extends AppError {
  constructor(message = 'Permintaan tidak valid.', errors?: unknown[]) {
    super(message, 400, errors);
  }
}

/**
 * 401 Unauthorized
 * Digunakan ketika kredensial login salah atau token JWT tidak valid / kadaluarsa
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Kredensial tidak valid atau sesi telah berakhir.') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden
 * Digunakan ketika user berhasil login tetapi tidak memiliki hak akses role (misal: Sales mencoba akses login Super Admin)
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Akses ditolak. Anda tidak memiliki izin untuk mengakses resource ini.') {
    super(message, 403);
  }
}

/**
 * 404 Not Found
 * Digunakan ketika data user atau resource tidak ditemukan
 */
export class NotFoundError extends AppError {
  constructor(message = 'Data yang diminta tidak ditemukan.') {
    super(message, 404);
  }
}

/**
 * 409 Conflict
 * Digunakan jika terjadi duplikasi data (misal: email sudah terdaftar)
 */
export class ConflictError extends AppError {
  constructor(message = 'Data sudah ada di dalam sistem.') {
    super(message, 409);
  }
}

/**
 * 500 Internal Server Error
 * Digunakan untuk kegagalan teknis server yang tidak terduga
 */
export class InternalServerError extends AppError {
  constructor(message = 'Terjadi kesalahan internal pada server.') {
    super(message, 500);
  }
}
