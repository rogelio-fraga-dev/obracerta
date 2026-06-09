import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import type { DocumentType, ProfessionalDocument } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { professionalDocuments } from "../../../infrastructure/database/schema/professional-documents.js";
import type {
  CreateDocumentData,
  DocumentRepository,
} from "../domain/ports/document.repository.js";

type DocumentRow = typeof professionalDocuments.$inferSelect;

/** Mapeia a linha do documento para o contrato público (timestamp em ISO). */
export function rowToDocument(row: DocumentRow): ProfessionalDocument {
  return {
    id: row.id,
    professionalId: row.professionalId,
    tipo: row.tipo as DocumentType,
    clienteNome: row.clienteNome,
    titulo: row.titulo,
    observacoes: row.observacoes,
    itens: row.itens,
    totalCentavos: row.totalCentavos,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleDocumentRepository implements DocumentRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateDocumentData): Promise<ProfessionalDocument> {
    const [row] = await this.db
      .insert(professionalDocuments)
      .values({
        professionalId: data.professionalId,
        tipo: data.tipo,
        clienteNome: data.clienteNome,
        titulo: data.titulo,
        observacoes: data.observacoes,
        itens: data.itens,
        totalCentavos: data.totalCentavos,
      })
      .returning();
    if (!row) throw new Error("Falha ao criar o documento.");
    return rowToDocument(row);
  }

  async findById(id: string): Promise<ProfessionalDocument | null> {
    const [row] = await this.db
      .select()
      .from(professionalDocuments)
      .where(eq(professionalDocuments.id, id))
      .limit(1);
    return row ? rowToDocument(row) : null;
  }

  async listForProfessional(professionalId: string): Promise<ProfessionalDocument[]> {
    const rows = await this.db
      .select()
      .from(professionalDocuments)
      .where(eq(professionalDocuments.professionalId, professionalId))
      .orderBy(desc(professionalDocuments.criadoEm));
    return rows.map(rowToDocument);
  }
}
