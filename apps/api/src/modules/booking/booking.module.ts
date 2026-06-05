import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { AvailabilityModule } from "../availability/availability.module.js";
import { DeclinePenaltyModule } from "../decline-penalty/decline-penalty.module.js";
import { UsersModule } from "../users/users.module.js";
import { BookingScheduler, BOOKING_EXPIRY_QUEUE } from "./application/booking.scheduler.js";
import { BookingService } from "./application/booking.service.js";
import { BOOKING_REPOSITORY } from "./domain/ports/booking.repository.js";
import { BookingExpiryProcessor } from "./infrastructure/booking-expiry.processor.js";
import { DrizzleBookingRepository } from "./infrastructure/drizzle-booking.repository.js";
import { BookingController } from "./interface/booking.controller.js";

/**
 * Agendamento (roadmap §4.2/§7/§11, Fatia 2.2). Máquina de estados + expiração
 * de 24h (fila BullMQ) + limite por especialidade + bloqueio bilateral na
 * aprovação (via AvailabilityModule). NotificationProvider vem do módulo @Global.
 */
@Module({
  imports: [
    AuthModule,
    UsersModule,
    AvailabilityModule,
    DeclinePenaltyModule,
    BullModule.registerQueue({ name: BOOKING_EXPIRY_QUEUE }),
  ],
  controllers: [BookingController],
  providers: [
    BookingService,
    BookingScheduler,
    BookingExpiryProcessor,
    { provide: BOOKING_REPOSITORY, useClass: DrizzleBookingRepository },
  ],
  exports: [BookingService],
})
export class BookingModule {}
