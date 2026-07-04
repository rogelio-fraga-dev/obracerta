import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { AddressesService } from "./application/addresses.service.js";
import { ADDRESSES_REPOSITORY } from "./domain/ports/addresses.repository.js";
import { DrizzleAddressesRepository } from "./infrastructure/drizzle-addresses.repository.js";
import { AddressesController } from "./interface/addresses.controller.js";

/** Endereços salvos (aba Endereços): CRUD + eleição do principal. */
@Module({
  imports: [AuthModule],
  controllers: [AddressesController],
  providers: [
    AddressesService,
    { provide: ADDRESSES_REPOSITORY, useClass: DrizzleAddressesRepository },
  ],
  exports: [AddressesService],
})
export class AddressesModule {}
