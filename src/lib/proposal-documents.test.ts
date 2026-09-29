import { describe, expect, it } from "vitest";
import type { ProposalAttachment } from "@/lib/api/requests";
import { attachmentToDocument, documentTypeFromName, formatFileSize, splitAttachments } from "./proposal-documents";

const base: ProposalAttachment = {
  id: "att-1",
  fileName: "Matriz de costeo.xlsx",
  category: "INTERNAL",
  tag: "Matriz de Costeo",
  mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  sizeBytes: 2_516_582,
  uploadedAt: "2026-09-29T15:00:00.000Z",
  uploadedById: "u-1",
  uploadedBy: { id: "u-1", firstName: "Laura", lastName: "Diaz" },
  downloadable: true,
  canDelete: true,
};

describe("proposal documents mapping (HU 5.2)", () => {
  it("formats sizes", () => {
    expect(formatFileSize(2_516_582)).toBe("2.4 MB");
    expect(formatFileSize(180 * 1024)).toBe("180 KB");
    expect(formatFileSize(10)).toBe("1 KB");
    expect(formatFileSize(null)).toBe("—");
  });

  it("derives the icon type from the extension", () => {
    expect(documentTypeFromName("a.pdf")).toBe("pdf");
    expect(documentTypeFromName("a.XLSX")).toBe("excel");
    expect(documentTypeFromName("a.csv")).toBe("excel");
    expect(documentTypeFromName("a.zip")).toBe("archive");
    expect(documentTypeFromName("a.docx")).toBe("doc");
  });

  it("maps an INTERNAL attachment to the internal_costing document", () => {
    expect(attachmentToDocument(base)).toMatchObject({
      id: "att-1",
      name: "Matriz de costeo.xlsx",
      category: "internal_costing",
      type: "excel",
      tag: "Matriz de Costeo",
      uploadedBy: "Laura Diaz",
      downloadable: true,
      canDelete: true,
    });
  });

  it("keeps the backend permission flags and tolerates missing uploader/tag", () => {
    const doc = attachmentToDocument({
      ...base,
      category: "CLIENT_FACING",
      tag: null,
      uploadedBy: null,
      downloadable: false,
      canDelete: false,
    });
    expect(doc).toMatchObject({ category: "client_kam", downloadable: false, canDelete: false });
    expect(doc.uploadedBy).toBeUndefined();
    expect(doc.tag).toBeUndefined();
  });

  it("splits attachments by category", () => {
    const { clientKam, internalCosting } = splitAttachments([
      base,
      { ...base, id: "att-2", category: "CLIENT_FACING", fileName: "propuesta.pdf" },
    ]);
    expect(internalCosting.map((d) => d.id)).toEqual(["att-1"]);
    expect(clientKam.map((d) => d.id)).toEqual(["att-2"]);
  });
});
