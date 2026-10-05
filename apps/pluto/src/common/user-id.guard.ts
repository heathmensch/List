import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";
import { DomainError } from "./domain.error.js";

/** Attached by UserIdGuard after reading X-User-Id. */
export type RequestWithUserId = Request & { userId: string };

/**
 * Requires header X-User-Id (from GET /me until real auth exists).
 * Controllers read it via the @UserId() param decorator.
 */
@Injectable()
export class UserIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUserId>();
    const raw = req.header("x-user-id");
    const userId = typeof raw === "string" ? raw.trim() : "";
    if (!userId) {
      throw new DomainError(
        401,
        "Missing X-User-Id header. Call GET /me first.",
      );
    }
    req.userId = userId;
    return true;
  }
}
