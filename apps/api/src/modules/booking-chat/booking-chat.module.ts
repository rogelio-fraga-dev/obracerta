import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BookingModule } from "../booking/booking.module.js";
import { BookingChatService } from "./application/booking-chat.service.js";
import { BOOKING_CHAT_REPOSITORY } from "./domain/ports/booking-chat.repository.js";
import { DrizzleBookingChatRepository } from "./infrastructure/drizzle-booking-chat.repository.js";
import { BookingChatController } from "./interface/booking-chat.controller.js";

/** Chat do pedido: conversa centralizada no serviço, aberta após o aceite. */
@Module({
  imports: [AuthModule, BookingModule],
  controllers: [BookingChatController],
  providers: [
    BookingChatService,
    { provide: BOOKING_CHAT_REPOSITORY, useClass: DrizzleBookingChatRepository },
  ],
})
export class BookingChatModule {}
