import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { OnboardingScheduler, ONBOARDING_QUEUE } from "./application/onboarding.scheduler.js";
import { OnboardingProcessor } from "./infrastructure/onboarding.processor.js";

/**
 * Onboarding (roadmap §5): agenda e processa as mensagens progressivas via
 * BullMQ. O scheduler é exportado para o cadastro disparar a sequência. O
 * NotificationProvider vem do NotificationsModule (@Global).
 */
@Module({
  imports: [BullModule.registerQueue({ name: ONBOARDING_QUEUE })],
  providers: [OnboardingScheduler, OnboardingProcessor],
  exports: [OnboardingScheduler],
})
export class OnboardingModule {}
