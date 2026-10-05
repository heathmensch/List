import { Inject, Injectable } from "@nestjs/common";
import { DEMO_USER_EMAIL } from "../constants.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class MeService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Upsert demo user until email auth lands. */
  async getDemoUser() {
    const user = await this.prisma.user.upsert({
      where: { email: DEMO_USER_EMAIL },
      update: {},
      create: { email: DEMO_USER_EMAIL },
    });
    return { id: user.id, email: user.email };
  }
}
