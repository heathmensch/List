import { Controller, Get, Inject } from "@nestjs/common";
import { MeService } from "./me.service.js";

@Controller("me")
export class MeController {
  constructor(@Inject(MeService) private readonly me: MeService) {}

  /**
   * GET /me
   * Returns { id, email }. Takeoff sends id as X-User-Id on later requests.
   */
  @Get()
  getMe() {
    return this.me.getDemoUser();
  }
}
