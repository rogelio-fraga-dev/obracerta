import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "./schema/index.js";

/**
 * Tipo do client Drizzle com o schema acoplado — dá autocomplete e checagem de
 * tipos nas queries (ex.: `db.query.users.findFirst(...)`). Injete via token
 * `DRIZZLE`: `@Inject(DRIZZLE) private readonly db: Database`.
 */
export type Database = NodePgDatabase<typeof schema>;
