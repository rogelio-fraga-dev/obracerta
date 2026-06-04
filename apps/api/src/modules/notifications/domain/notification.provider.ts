/** Canais de envio (roadmap §6/§22). WhatsApp é o primário; SMS é fallback. */
export type NotificationChannel = "whatsapp" | "sms";

/**
 * Porta de saída de notificações. Provedores externos (WhatsApp Cloud API, SMS)
 * ficam atrás desta interface; em dev usamos um adapter de console. Usada pelo
 * auth (OTP) e pelo onboarding (mensagens progressivas).
 */
export interface NotificationProvider {
  sendOtp(to: string, code: string, channel?: NotificationChannel): Promise<void>;
  sendMessage(to: string, text: string, channel?: NotificationChannel): Promise<void>;
}

export const NOTIFICATION_PROVIDER = Symbol("NOTIFICATION_PROVIDER");
