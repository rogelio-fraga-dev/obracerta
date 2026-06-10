import { ForbiddenException } from "@nestjs/common";
import { UserType, type BookingRequest, type CreateBookingInput, type User } from "@obracerta/shared";
import type { AvailabilityService } from "../../availability/application/availability.service.js";
import type { BillingService } from "../../billing/application/billing.service.js";
import type { PenaltyService } from "../../decline-penalty/application/penalty.service.js";
import type { NotificationProvider } from "../../notifications/domain/notification.provider.js";
import type { StoragePort } from "../../storage/domain/storage.port.js";
import type { UsersService } from "../../users/application/users.service.js";
import { Feature } from "../../entitlements/domain/entitlements.js";
import type { BookingRepository } from "../domain/ports/booking.repository.js";
import type { BookingScheduler } from "./booking.scheduler.js";
import type { ReviewReminderScheduler } from "./review-reminder.scheduler.js";
import { BookingService } from "./booking.service.js";

/**
 * Gating de plano no agendamento (roadmap §8.7): o agendamento exige a feature
 * `booking.receive` no profissional alvo. A trava real fica no serviço — este
 * teste prova que `createForContractor` recusa (quando a feature falta) antes de
 * tocar o repositório, e cria quando ela está liberada. (Pós-reprecificação Fase 8+
 * todos os planos recebem pedidos; o mecanismo do gate continua sendo testado aqui.)
 */
describe("BookingService — gating booking.receive", () => {
  const professionalId = "pro-1";
  const contractorId = "ct-1";
  const professional = { id: professionalId, tipo: UserType.PROFISSIONAL, whatsapp: "+5511" } as User;

  const input: CreateBookingInput = {
    professionalId,
    especialidade: "Pedreiro",
    dataServico: new Date(Date.now() + 86_400_000).toISOString(),
  };

  function build(can: boolean) {
    const repo = {
      countPending: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: "bk-1" } as BookingRequest),
    } as unknown as BookingRepository;
    const users = {
      findById: jest.fn().mockResolvedValue(professional),
    } as unknown as UsersService;
    const scheduler = { scheduleExpiry: jest.fn().mockResolvedValue(undefined) } as unknown as BookingScheduler;
    const billing = { can: jest.fn().mockResolvedValue(can) } as unknown as BillingService;
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
    );
    return { service, repo, billing };
  }

  it("recusa o pedido quando o profissional não tem booking.receive", async () => {
    const { service, repo, billing } = build(false);

    await expect(service.createForContractor(contractorId, input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(billing.can).toHaveBeenCalledWith(professionalId, Feature.RECEIVE_BOOKINGS);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("cria o pedido quando o profissional tem booking.receive (plano pago)", async () => {
    const { service, repo } = build(true);

    const booking = await service.createForContractor(contractorId, input);

    expect(booking.id).toBe("bk-1");
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});
