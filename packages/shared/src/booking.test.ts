import { describe, expect, it } from "vitest";
import { BookingStatus } from "./enums.js";
import { isBookingContactReleased } from "./booking.js";

describe("isBookingContactReleased", () => {
  it("libera o contato só a partir do aceite (APROVADO/INICIADO/CONCLUIDO)", () => {
    expect(isBookingContactReleased(BookingStatus.APROVADO)).toBe(true);
    expect(isBookingContactReleased(BookingStatus.INICIADO)).toBe(true);
    expect(isBookingContactReleased(BookingStatus.CONCLUIDO)).toBe(true);
  });

  it("mantém o sigilo enquanto o pedido não foi aceito ou saiu do fluxo", () => {
    expect(isBookingContactReleased(BookingStatus.PENDENTE)).toBe(false);
    expect(isBookingContactReleased(BookingStatus.RECUSADO)).toBe(false);
    expect(isBookingContactReleased(BookingStatus.EXPIRADO)).toBe(false);
    expect(isBookingContactReleased(BookingStatus.CANCELADO)).toBe(false);
  });
});
