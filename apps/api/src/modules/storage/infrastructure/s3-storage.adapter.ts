import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { AppConfig } from "../../../config/configuration.js";
import type { StoragePort } from "../domain/storage.port.js";

/**
 * Adapter S3-compatível (MinIO em dev, Cloudflare R2 em prod). `forcePathStyle`
 * é exigido pelo MinIO. Na subida garante o bucket e uma policy de leitura
 * pública (dev) — não-fatal: se o storage estiver fora, a API sobe e a falha
 * aparece só no upload.
 */
@Injectable()
export class S3StorageAdapter implements StoragePort, OnModuleInit {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly isProduction: boolean;

  constructor(config: ConfigService<AppConfig, true>) {
    const s3 = config.get("s3", { infer: true });
    this.bucket = s3.bucket;
    this.publicUrl = s3.publicUrl;
    this.isProduction = config.get("nodeEnv", { infer: true }) === "production";
    this.client = new S3Client({
      endpoint: s3.endpoint,
      region: s3.region,
      credentials: { accessKeyId: s3.accessKey, secretAccessKey: s3.secretKey },
      forcePathStyle: true,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureBucket();
      this.logger.log(`Bucket "${this.bucket}" pronto`);
    } catch (error) {
      this.logger.warn(
        `Storage indisponível na subida (uploads falharão até o MinIO subir): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
    return `${this.publicUrl}/${this.bucket}/${key}`;
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return;
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
    // Leitura pública automática é conveniência de DEV (MinIO local). Em produção
    // a policy/CDN do bucket é gerida fora do app — jamais reaplicar `Principal:*`.
    if (this.isProduction) return;
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    };
    await this.client.send(
      new PutBucketPolicyCommand({ Bucket: this.bucket, Policy: JSON.stringify(policy) }),
    );
  }
}
