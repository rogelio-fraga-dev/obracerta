/** Canais de envio de OTP (roadmap §6/§22). WhatsApp é o primário; SMS é fallback. */
export type NotificationChannel = "whatsapp" | "sms";

/**
 * Porta de saída para envio de notificações (OTP). Provedores externos
 * (WhatsApp Cloud API, SMS) ficam atrás desta interface — em dev usamos um
 * adapter de console, sem depender de credenciais externas.
 */
export interface NotificationProvider {
  sendOtp(to: string, code: string, channel?: NotificationChannel): Promise<void>;
}

export const NOTIFICATION_PROVIDER = Symbol("NOTIFICATION_PROVIDER");
