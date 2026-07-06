import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { MAX_PORTFOLIO_PHOTOS, type PortfolioPhoto } from "@obracerta/shared";
import type { BillingService } from "../../billing/application/billing.service.js";
import type { StoragePort } from "../../storage/domain/storage.port.js";
import type { PortfolioRepository } from "../domain/ports/portfolio.repository.js";
import { PortfolioService } from "./portfolio.service.js";

/**
 * Portfólio (§18): o upload é gated (feature `profile.portfolio`, planos pagos),
 * respeita o limite de fotos, e só o dono remove.
 */
describe("PortfolioService", () => {
  const proId = "pro-1";
  // Buffer com magic bytes REAIS de JPEG — a validação agora olha o conteúdo,
  // não o mimetype declarado (falsificável).
  const file = {
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]),
    mimetype: "image/jpeg",
  };

  function build(opts: { can?: boolean; count?: number; photoOwner?: string } = {}) {
    const repo = {
      countForProfessional: jest.fn().mockResolvedValue(opts.count ?? 0),
      create: jest.fn(async (d) => ({ id: "ph-1", criadoEm: "x", ...d }) as PortfolioPhoto),
      findById: jest.fn().mockResolvedValue(
        opts.photoOwner ? ({ id: "ph-1", professionalId: opts.photoOwner } as PortfolioPhoto) : null,
      ),
      delete: jest.fn().mockResolvedValue(undefined),
    } as unknown as PortfolioRepository;
    const storage = {
      putObject: jest.fn().mockResolvedValue("http://minio/x.jpg"),
    } as unknown as StoragePort;
    const billing = { can: jest.fn().mockResolvedValue(opts.can ?? true) } as unknown as BillingService;
    return { service: new PortfolioService(repo, storage, billing), repo, storage };
  }

  it("recusa upload sem a feature profile.portfolio", async () => {
    const { service, storage } = build({ can: false });
    await expect(service.addPhoto(proId, file, null)).rejects.toBeInstanceOf(ForbiddenException);
    expect(storage.putObject).not.toHaveBeenCalled();
  });

  it("recusa upload ao atingir o limite de fotos", async () => {
    const { service } = build({ can: true, count: MAX_PORTFOLIO_PHOTOS });
    await expect(service.addPhoto(proId, file, null)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("recusa arquivo que mente o Content-Type (conteúdo não é imagem)", async () => {
    const { service, storage } = build({ can: true, count: 0 });
    const falso = { buffer: Buffer.from("#!/bin/sh\nrm -rf /"), mimetype: "image/jpeg" };
    await expect(service.addPhoto(proId, falso, null)).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.putObject).not.toHaveBeenCalled();
  });

  it("sobe a foto e persiste a URL quando liberado", async () => {
    const { service, storage, repo } = build({ can: true, count: 0 });
    const photo = await service.addPhoto(proId, file, "Cozinha");
    expect(storage.putObject).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ professionalId: proId, legenda: "Cozinha" }),
    );
    expect(photo.id).toBe("ph-1");
  });

  it("só o dono remove a foto", async () => {
    const { service } = build({ photoOwner: "outro-pro" });
    await expect(service.removePhoto(proId, "ph-1")).rejects.toBeInstanceOf(ForbiddenException);
  });
});
