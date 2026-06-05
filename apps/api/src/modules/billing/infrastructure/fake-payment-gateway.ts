import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type {
  CreateChargeParams,
  CreateSubscriptionParams,
  GatewayRef,
  PaymentGateway,
} from "../domain/ports/payment-gateway.js";

/**
 * Adapter de desenvolvimento do gateway de pagamento: não chama provedor externo,
 * só devolve ids fake (logando). Permite exercitar assinatura/compra/webhook em
 * localhost sem Asaas real. Em produção, trocado pelo adapter Asaas (mesma porta).
 * Usa o nome "asaas" para que o fluxo de webhook seja idêntico ao de produção.
 */
@Injectable()
export class FakePaymentGateway implements PaymentGateway {
  readonly name = "asaas";
  private readonly logger = new Logger("PaymentGateway");

  createSubscription(params: CreateSubscriptionParams): Promise<GatewayRef> {
    const gatewayId = `sub_${randomUUID()}`;
    this.logger.log(
      `[fake] assinatura ${gatewayId} (${params.plano}, ${params.valorCentavos}c) p/ ${params.userId}`,
    );
    return Promise.resolve({ gatewayId });
  }

  createCharge(params: CreateChargeParams): Promise<GatewayRef> {
    const gatewayId = `chg_${randomUUID()}`;
    this.logger.log(
      `[fake] cobrança ${gatewayId} (${params.valorCentavos}c, vence ${params.vencimento}) p/ ${params.userId}`,
    );
    return Promise.resolve({ gatewayId });
  }
}
