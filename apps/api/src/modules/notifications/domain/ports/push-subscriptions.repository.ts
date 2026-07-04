/** Uma inscrição de Web Push persistida. */
export interface StoredPushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Porta de saída das inscrições de Web Push. */
export interface PushSubscriptionsRepository {
  /** Upsert por endpoint (o browser pode re-inscrever o mesmo endpoint). */
  upsert(userId: string, endpoint: string, p256dh: string, auth: string): Promise<void>;
  listForUser(userId: string): Promise<StoredPushSubscription[]>;
  removeByEndpoint(endpoint: string): Promise<void>;
}

export const PUSH_SUBSCRIPTIONS_REPOSITORY = Symbol("PUSH_SUBSCRIPTIONS_REPOSITORY");
