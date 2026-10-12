import { useMutation, useQueryClient } from "@tanstack/react-query";
import { attachmentsApi, type UploadAttachmentPayload } from "@/lib/api/attachments";

// The proposal detail already carries the (role-filtered) attachments, so a change only
// needs the requests queries refreshed (the prefix also covers ["requests", id], whether
// the URL holds the id or the proposal code).
function useRefreshProposal() {
  const queryClient = useQueryClient();
  return (_proposalId: string) => queryClient.invalidateQueries({ queryKey: ["requests"] });
}

/** HU 5.2 — uploads a file to the proposal's private storage. */
export function useUploadAttachment() {
  const refresh = useRefreshProposal();
  return useMutation({
    mutationFn: ({ proposalId, ...payload }: { proposalId: string } & UploadAttachmentPayload) =>
      attachmentsApi.upload(proposalId, payload),
    onSuccess: (_data, variables) => refresh(variables.proposalId),
  });
}

/** HU 5.2 — removes a file (object and record). */
export function useDeleteAttachment() {
  const refresh = useRefreshProposal();
  return useMutation({
    mutationFn: ({ proposalId, attachmentId }: { proposalId: string; attachmentId: string }) =>
      attachmentsApi.remove(proposalId, attachmentId),
    onSuccess: (_data, variables) => refresh(variables.proposalId),
  });
}

/** HU 5.2 — asks for a short-lived download URL (permission is checked server-side). */
export function useDownloadAttachment() {
  return useMutation({
    mutationFn: ({ proposalId, attachmentId }: { proposalId: string; attachmentId: string }) =>
      attachmentsApi.getDownloadUrl(proposalId, attachmentId),
  });
}
