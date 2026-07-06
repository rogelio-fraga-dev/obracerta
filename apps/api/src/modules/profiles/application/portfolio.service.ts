import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MAX_PORTFOLIO_PHOTOS, type PortfolioPhoto } from "@obracerta/shared";
import { BillingService } from "../../billing/application/billing.service.js";
import { Feature } from "../../entitlements/domain/entitlements.js";
import { STORAGE_PORT, type StoragePort } from "../../storage/domain/storage.port.js";
import {
  PORTFOLIO_REPOSITORY,
  type PortfolioRepository,
} from "../domain/ports/portfolio.repository.js";

import { IMAGE_MIME, sniffImageExt } from "../../../common/uploads/image-upload.js";

@Injectable()
export class PortfolioService {
  constructor(
    @Inject(PORTFOLIO_REPOSITORY) private readonly repo: PortfolioRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly billing: BillingService,
  ) {}

  list(professionalId: string): Promise<PortfolioPhoto[]> {
    return this.repo.listForProfessional(professionalId);
  }

  /**
   * Adiciona uma foto ao portfólio. Gated: a galeria de obras é benefício de
   * plano pago (feature `profile.portfolio`). Respeita o limite por profissional.
   */
  async addPhoto(
    professionalId: string,
    file: { buffer: Buffer; mimetype: string },
    legenda: string | null,
  ): Promise<PortfolioPhoto> {
    if (!(await this.billing.can(professionalId, Feature.PORTFOLIO))) {
      throw new ForbiddenException(
        "O portfólio de obras é um benefício dos planos pagos. Faça upgrade em Cobranças.",
      );
    }
    // Valida o CONTEÚDO (magic bytes), não o mimetype do cliente (falsificável).
    const ext = sniffImageExt(file.buffer);
    if (!ext) {
      throw new BadRequestException("Formato inválido. Use JPEG, PNG ou WebP.");
    }
    const total = await this.repo.countForProfessional(professionalId);
    if (total >= MAX_PORTFOLIO_PHOTOS) {
      throw new BadRequestException(
        `Seu portfólio já tem o máximo de ${MAX_PORTFOLIO_PHOTOS} fotos. Remova uma para adicionar outra.`,
      );
    }
    const key = `portfolio/${professionalId}/${Date.now()}.${ext}`;
    const url = await this.storage.putObject(key, file.buffer, IMAGE_MIME[ext]);
    return this.repo.create({ professionalId, url, legenda: legenda?.trim() || null });
  }

  /** Edita a legenda de uma foto — só o profissional dono. */
  async updateLegenda(
    professionalId: string,
    photoId: string,
    legenda: string | null,
  ): Promise<PortfolioPhoto> {
    const photo = await this.repo.findById(photoId);
    if (!photo) throw new NotFoundException("Foto não encontrada.");
    if (photo.professionalId !== professionalId) {
      throw new ForbiddenException("Esta foto não é sua.");
    }
    const updated = await this.repo.updateLegenda(photoId, legenda?.trim() || null);
    if (!updated) throw new NotFoundException("Foto não encontrada.");
    return updated;
  }

  /** Remove uma foto do portfólio — só o profissional dono. */
  async removePhoto(professionalId: string, photoId: string): Promise<void> {
    const photo = await this.repo.findById(photoId);
    if (!photo) throw new NotFoundException("Foto não encontrada.");
    if (photo.professionalId !== professionalId) {
      throw new ForbiddenException("Esta foto não é sua.");
    }
    await this.repo.delete(photoId);
  }
}
