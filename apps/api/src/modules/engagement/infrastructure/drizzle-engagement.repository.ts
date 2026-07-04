import { Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import type {
  EngagementRepository,
  ExpiringBooking,
  ProfessionalTarget,
} from "../domain/ports/engagement.repository.js";

@Injectable()
export class DrizzleEngagementRepository implements EngagementRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async pendingExpiringSoon(withinHours: number): Promise<ExpiringBooking[]> {
    const result = await this.db.execute(sql`
      select b.id as booking_id, b.professional_id, b.especialidade
      from booking_requests b
      where b.status = 'PENDENTE'
        and b.expira_em between now() and now() + make_interval(hours => ${withinHours})
    `);
    return (result.rows as { booking_id: string; professional_id: string; especialidade: string }[]).map(
      (r) => ({ bookingId: r.booking_id, professionalId: r.professional_id, especialidade: r.especialidade }),
    );
  }

  async incompleteProfiles(olderThanDays: number): Promise<ProfessionalTarget[]> {
    const result = await this.db.execute(sql`
      select pp.user_id
      from professional_profiles pp
      join users u on u.id = pp.user_id
      where u.status = 'ATIVO'
        and pp.completude_pct < 100
        and u.criado_em < now() - make_interval(days => ${olderThanDays})
    `);
    return (result.rows as { user_id: string }[]).map((r) => ({ userId: r.user_id }));
  }

  async withoutAgenda(olderThanDays: number): Promise<ProfessionalTarget[]> {
    const result = await this.db.execute(sql`
      select pp.user_id
      from professional_profiles pp
      join users u on u.id = pp.user_id
      where u.status = 'ATIVO'
        and u.criado_em < now() - make_interval(days => ${olderThanDays})
        and not exists (select 1 from availability a where a.professional_id = pp.user_id)
    `);
    return (result.rows as { user_id: string }[]).map((r) => ({ userId: r.user_id }));
  }

  async hasRecentNotification(
    userId: string,
    titulo: string,
    link: string | null,
    days: number,
  ): Promise<boolean> {
    const result = await this.db.execute(sql`
      select 1
      from notifications n
      where n.user_id = ${userId}
        and n.titulo = ${titulo}
        and (${link}::varchar is null or n.link = ${link})
        and n.criado_em > now() - make_interval(days => ${days})
      limit 1
    `);
    return result.rows.length > 0;
  }
}
