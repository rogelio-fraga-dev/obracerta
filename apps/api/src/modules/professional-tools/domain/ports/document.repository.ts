import type { DocumentItem, DocumentType, ProfessionalDocument } from "@obracerta/shared";

/** Dados para persistir um documento (com o total já calculado no serviço). */
export interface CreateDocumentData {
  professionalId: string;
  tipo: DocumentType;
  clienteNome: string;
  titulo: string;
  observacoes: string | null;
  itens: DocumentItem[];
  totalCentavos: number;
}

/** Porta de saída para os documentos (orçamentos/recibos) do profissional. */
export interface DocumentRepository {
  create(data: CreateDocumentData): Promise<ProfessionalDocument>;
  findById(id: string): Promise<ProfessionalDocument | null>;
  listForProfessional(professionalId: string): Promise<ProfessionalDocument[]>;
}

export const DOCUMENT_REPOSITORY = Symbol("DOCUMENT_REPOSITORY");
