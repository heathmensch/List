/**
 * Domain/API error. The DomainExceptionFilter turns this into
 * `{ error: message }` with the given HTTP status (matches Takeoff toasts).
 */
export class DomainError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "DomainError";
  }
}
