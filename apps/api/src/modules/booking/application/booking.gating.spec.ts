import { ForbiddenException } from "@nestjs/common";
import { UserType, type BookingRequest, type CreateBookingInput, type User } from "@obracerta/shared";
import type { AvailabilityService } from "../../availability/application/availability.service.js";
import type { BillingService } from "../../billing/application/billing.service.js";
import type { PenaltyService } from "../../decline-penalty/application/penalty.service.js";
import type { NotificationProvider } from "../../notifications/domain/notification.provider.js";
import type { InboxService } from "../../notifications/application/inbox.service.js";
import type { StoragePort } from "../../storage/domain/storage.port.js";
import type { UsersService } from "../../users/application/users.service.js";
import { Feature } from "../../entitlements/domain/entitlements.js";
import type { BookingRepository } from "../domain/ports/booking.repository.js";
import type { BookingScheduler } from "./booking.scheduler.js";
import type { ReviewReminderScheduler } from "./review-reminder.scheduler.js";
import { BookingService } from "./booking.service.js";

/**
 * Gating de plano no agendamento (homologação 18/07): o pedido exige plano dos
 * DOIS lados — quem contrata precisa de `booking.request` (plano de acesso
 * vigente) e o profissional alvo de `booking.receive`. A trava real fica no
 * serviço — este teste prova que `createForContractor` recusa antes de tocar o
 * repositório, e cria quando as duas features estão liberadas.
 */
describe("BookingService — gating do agendamento (dois lados)", () => {
  const professionalId = "pro-1";
  const contractorId = "ct-1";
  const professional = { id: professionalId, tipo: UserType.PROFISSIONAL, whatsapp: "+5511" } as User;

  const input: CreateBookingInput = {
    professionalId,
    especialidade: "Pedreiro",
    dataServico: new Date(Date.now() + 86_400_000).toISOString(),
  };

  function build(opts: { contractorCan: boolean; professionalCan: boolean }) {
    const repo = {
      countPending: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: "bk-1" } as BookingRequest),
    } as unknown as BookingRepository;
    const users = {
      findById: jest.fn().mockResolvedValue(professional),
    } as unknown as UsersService;
    const scheduler = { scheduleExpiry: jest.fn().mockResolvedValue(undefined) } as unknown as BookingScheduler;
    const billing = {
      can: jest.fn((userId: string) =>
        Promise.resolve(userId === contractorId ? opts.contractorCan : opts.professionalCan),
      ),
    } as unknown as BillingService;
    const notifications = { sendMessage: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationProvider;
    const service = new BookingService(
      repo,
      users,
      {} as AvailabilityService,
      scheduler,
      {} as ReviewReminderScheduler,
      {} as PenaltyService,
      billing,
      {} as StoragePort,
      notifications,
      { record: jest.fn().mockResolvedValue(undefined) } as unknown as InboxService,
    );
    return { service, repo, billing };
  }

  it("recusa quando o contratante não tem plano de acesso (booking.request)", async () => {
    const { service, repo, billing } = build({ contractorCan: false, professionalCan: true });

    await expect(service.createForContractor(contractorId, input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(billing.can).toHaveBeenCalledWith(contractorId, Feature.REQUEST_BOOKING);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("recusa o pedido quando o profissional não tem booking.receive", async () => {
    const { service, repo, billing } = build({ contractorCan: true, professionalCan: false });

    await expect(service.createForContractor(contractorId, input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(billing.can).toHaveBeenCalledWith(professionalId, Feature.RECEIVE_BOOKINGS);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("cria o pedido quando os dois lados têm as features", async () => {
    const { service, repo } = build({ contractorCan: true, professionalCan: true });

    const booking = await service.createForContractor(contractorId, input);

    expect(booking.id).toBe("bk-1");
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});
