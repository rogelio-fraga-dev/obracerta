import { ForbiddenException } from "@nestjs/common";
import { BookingStatus, type BookingRequest, type User } from "@obracerta/shared";
import type { AvailabilityService } from "../../availability/application/availability.service.js";
import type { BillingService } from "../../billing/application/billing.service.js";
import type { PenaltyService } from "../../decline-penalty/application/penalty.service.js";
import type { NotificationProvider } from "../../notifications/domain/notification.provider.js";
import type { InboxService } from "../../notifications/application/inbox.service.js";
import type { StoragePort } from "../../storage/domain/storage.port.js";
import type { UsersService } from "../../users/application/users.service.js";
import type { BookingRepository } from "../domain/ports/booking.repository.js";
import type { BookingScheduler } from "./booking.scheduler.js";
import type { ReviewReminderScheduler } from "./review-reminder.scheduler.js";
import { BookingService } from "./booking.service.js";

/**
 * Liberação de contato pós-aceite (§8.4/§24, double-blind). `getContact` só
 * revela o WhatsApp/e-mail da outra parte depois que o pedido foi aceito.
 */
describe("BookingService — getContact (double-blind)", () => {
  const contractorId = "ct-1";
  const professionalId = "pro-1";
  const professional = {
    id: professionalId,
    nomeCompleto: "Joana Pro",
    whatsapp: "+5511988887777",
    email: "joana@example.com",
  } as User;

  function build(status: BookingStatus) {
    const booking = { id: "bk-1", contractorId, professionalId, status } as BookingRequest;
    const repo = { findById: jest.fn().mockResolvedValue(booking) } as unknown as BookingRepository;
    const users = {
      findById: jest.fn().mockResolvedValue(professional),
    } as unknown as UsersService;
    const service = new BookingService(
      repo,
      users,
      {} as AvailabilityService,
      {} as BookingScheduler,
      {} as ReviewReminderScheduler,
      {} as PenaltyService,
      {} as BillingService,
      {} as StoragePort,
      {} as NotificationProvider,
      { record: jest.fn().mockResolvedValue(undefined) } as unknown as InboxService,
    );
    return { service };
  }

  it("nega o contato enquanto o pedido está PENDENTE", async () => {
    const { service } = build(BookingStatus.PENDENTE);
    await expect(service.getContact(contractorId, "bk-1")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("revela o contato da outra parte depois de APROVADO", async () => {
    const { service } = build(BookingStatus.APROVADO);
    const contato = await service.getContact(contractorId, "bk-1");
    expect(contato).toEqual({
      nome: "Joana Pro",
      whatsapp: "+5511988887777",
      email: "joana@example.com",
    });
  });
});
