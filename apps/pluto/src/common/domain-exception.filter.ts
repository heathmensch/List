import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import { DomainError } from "./domain.error.js";

/**
 * Maps thrown errors to the JSON shape Takeoff expects: `{ error: string }`.
 * DomainError → its status; HttpException → Nest status; anything else → 500.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof DomainError) {
      res.status(exception.status).json({ error: exception.message });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === "string"
          ? body
          : typeof body === "object" &&
              body !== null &&
              "message" in body &&
              (typeof (body as { message: unknown }).message === "string" ||
                Array.isArray((body as { message: unknown }).message))
            ? Array.isArray((body as { message: unknown }).message)
              ? ((body as { message: string[] }).message.join(", "))
              : String((body as { message: string }).message)
            : exception.message;
      res.status(status).json({ error: message });
      return;
    }

    console.error(exception);
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: "Unexpected server error." });
  }
}
