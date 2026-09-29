import { apiRequest } from "./client";
import type { AttachmentCategory, ProposalAttachment } from "./requests";

export interface AttachmentDownload {
  /** Presigned URL, valid for a few minutes. */
  url: string;
  expiresAt: string;
  fileName: string;
}

export interface UploadAttachmentPayload {
  file: File;
  category: AttachmentCategory;
  tag?: string;
}

// HU 5.2 — proposal files. Visibility and permissions are enforced by the backend
// (category + role + ownership); the client only reflects what it returns.
export const attachmentsApi = {
  list: (proposalId: string) => apiRequest<ProposalAttachment[]>(`/requests/${proposalId}/attachments`),

  upload: (proposalId: string, { file, category, tag }: UploadAttachmentPayload) => {
    const form = new FormData();
    form.append("category", category);
    if (tag) form.append("tag", tag);
    form.append("file", file);
    return apiRequest<ProposalAttachment>(`/requests/${proposalId}/attachments`, {
      method: "POST",
      body: form,
    });
  },

  getDownloadUrl: (proposalId: string, attachmentId: string) =>
    apiRequest<AttachmentDownload>(`/requests/${proposalId}/attachments/${attachmentId}/download`),

  remove: (proposalId: string, attachmentId: string) =>
    apiRequest<{ id: string }>(`/requests/${proposalId}/attachments/${attachmentId}`, {
      method: "DELETE",
    }),
};
