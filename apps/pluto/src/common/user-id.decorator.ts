import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { RequestWithUserId } from "./user-id.guard.js";

/** Reads userId set by UserIdGuard. Use only on routes that apply the guard. */
export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<RequestWithUserId>();
    return req.userId;
  },
);
