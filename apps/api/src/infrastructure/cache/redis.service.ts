import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { AppConfig } from "../../config/configuration.js";

/**
 * Thin Redis adapter. Fase 0: connectivity + health ping.
 * Will back cache, OTP/sessions and BullMQ in later phases (plan §3.2).
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(config: ConfigService<AppConfig, true>) {
    this.client = new Redis(config.get("redisUrl", { infer: true }), {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.logger.log("Redis client connected");
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }

  /** Returns true if Redis replies to PING. */
  async ping(): Promise<boolean> {
    const pong = await this.client.ping();
    return pong === "PONG";
  }
}
