import { REVIEW_REMINDER_DAYS, reminderDelayMs } from "./review-reminder.js";

describe("review-reminder", () => {
  it("lembra nos dias 1, 5 e 7 após a conclusão", () => {
    expect(REVIEW_REMINDER_DAYS).toEqual([1, 5, 7]);
  });

  it("delay em ms a partir do dia (speedup acelera em dev)", () => {
    const dia = 86_400_000;
    expect(reminderDelayMs(1)).toBe(dia);
    expect(reminderDelayMs(5)).toBe(5 * dia);
    expect(reminderDelayMs(1, 86_400)).toBe(1000); // 1 dia vira 1s em dev
  });

  it("speedup < 1 é tratado como 1 (sem acelerar negativamente)", () => {
    expect(reminderDelayMs(1, 0)).toBe(86_400_000);
  });
});
