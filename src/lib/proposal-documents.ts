import type { ProposalDocument } from "@/lib/mock-data";
import type { AttachmentCategory, ProposalAttachment } from "@/lib/api/requests";

/** UI category (prototype naming) ↔ backend category. */
export const CATEGORY_TO_BACKEND: Record<ProposalDocument["category"], AttachmentCategory> = {
  client_kam: "CLIENT_FACING",
  internal_costing: "INTERNAL",
};

/** Human-readable size, e.g. "2.4 MB" / "180 KB". */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function documentTypeFromName(fileName: string): ProposalDocument["type"] {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return "excel";
  if (ext === "zip") return "archive";
  return "doc";
}

/** Backend attachment → the shape the documents section already renders. */
export function attachmentToDocument(attachment: ProposalAttachment): ProposalDocument {
  const uploader = attachment.uploadedBy
    ? [attachment.uploadedBy.firstName, attachment.uploadedBy.lastName].filter(Boolean).join(" ")
    : "";

  return {
    id: attachment.id,
    name: attachment.fileName,
    size: formatFileSize(attachment.sizeBytes),
    date: new Date(attachment.uploadedAt).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    type: documentTypeFromName(attachment.fileName),
    category: attachment.category === "INTERNAL" ? "internal_costing" : "client_kam",
    uploadedBy: uploader || undefined,
    tag: attachment.tag ?? undefined,
    downloadable: attachment.downloadable,
    canDelete: attachment.canDelete,
  };
}

/** Prototype-only: a metadata entry for a mock request (no file is stored anywhere). */
export function buildLocalDocument(
  file: File,
  category: ProposalDocument["category"],
  tag: string | undefined,
  uploadedBy: string,
): ProposalDocument {
  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    size: formatFileSize(file.size),
    date: new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }),
    type: documentTypeFromName(file.name),
    category,
    uploadedBy,
    tag,
  };
}

/** Splits real attachments into the two lists the section shows. */
export function splitAttachments(attachments: ProposalAttachment[]): {
  clientKam: ProposalDocument[];
  internalCosting: ProposalDocument[];
} {
  const docs = attachments.map(attachmentToDocument);
  return {
    clientKam: docs.filter((d) => d.category === "client_kam"),
    internalCosting: docs.filter((d) => d.category === "internal_costing"),
  };
}
