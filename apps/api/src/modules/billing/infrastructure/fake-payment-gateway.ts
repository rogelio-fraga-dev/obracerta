import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { buildPixPayload } from "../domain/pix-brcode.js";
import type {
  CreateChargeParams,
  CreateSubscriptionParams,
  GatewayRef,
  PaymentGateway,
  PixCode,
  PixCodeParams,
  RefundChargeParams,
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
  /** Sandbox: habilita o "Simular pagamento" no app (o adapter real será false). */
  readonly sandbox = true;
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

  refund(params: RefundChargeParams): Promise<GatewayRef> {
    const gatewayId = `ref_${randomUUID()}`;
    this.logger.log(`[fake] estorno ${gatewayId} (${params.valorCentavos}c) da cobrança ${params.chargeId}`);
    return Promise.resolve({ gatewayId });
  }

  /** Pix fictício (formato EMV válido, chave de exemplo) — o Asaas real devolve o dele. */
  getPixCode(params: PixCodeParams): Promise<PixCode> {
    const txid = params.chargeId.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "OBRACERTA";
    const payload = buildPixPayload({
      chave: "pagamentos@obracerta.com.br",
      merchantName: "ObraCerta",
      merchantCity: "Uberlandia",
      valorCentavos: params.valorCentavos,
      txid,
    });
    this.logger.log(`[fake] pix ${txid} (${params.valorCentavos}c) — ${params.descricao}`);
    return Promise.resolve({ payload, txid });
  }
}
