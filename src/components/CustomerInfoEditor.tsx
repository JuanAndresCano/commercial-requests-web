import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { customerApi, type CustomerUpdatePayload } from "@/lib/api/customer";
import type { CompanyType } from "@/lib/api/companies";
import { companyTypeLabel } from "@/lib/company";
import type { ProposalDetail } from "@/lib/api/requests";
import {
  customerContactErrors,
  customerContactServerMessage,
  hasValidContactChannel,
  pendingValue,
} from "@/lib/customer-contact";
import { ciiuListError, normalizeCiiuList, parseCiiu } from "@/lib/ciiu";
import { parseNit } from "@/lib/nit";

const FIELDS = [
  ["companyName", "Razón social"],
  ["companyNit", "NIT"],
  ["companyAddress", "Dirección corporativa"],
  ["companyPhone", "Teléfono corporativo"],
  ["companyEmail", "Correo corporativo"],
  ["website", "Página web"],
  ["ciiuCode", "CIIU principal"],
  ["sector", "Descripción de la actividad económica"],
  ["companyDescription", "Descripción de la empresa"],
  ["contactName", "Nombre del contacto"],
  ["contactRole", "Cargo del contacto"],
  ["contactArea", "Área del contacto"],
  ["contactPhone", "Teléfono del contacto"],
  ["contactEmail", "Correo del contacto"],
  ["contactSecondaryPhone", "Teléfono secundario del contacto"],
  ["contactAlternativeEmail", "Correo alternativo del contacto"],
] as const;
const COMPANY_TYPES: CompanyType[] = ["PUBLICA", "PRIVADA", "MIXTA", "SIN_ANIMO_LUCRO"];

type CustomerField = (typeof FIELDS)[number][0];
type Draft = Record<CustomerField, string> & { companyType: string; ciiuSecondary: string };

/** "8559, 7020 ,, 8559" -> ["8559", "7020"]: trimmed, no blanks/Pendiente, no repeats, none equal to the principal. */
function parseCiiuList(raw: string, principal?: string): string[] {
  return normalizeCiiuList(raw.split(","), principal);
}

function draftOf(proposal: ProposalDetail): Draft {
  return {
    companyName: proposal.company.name,
    companyNit: proposal.company.nit ?? "",
    companyAddress: proposal.company.address ?? "",
    companyPhone: proposal.company.phone ?? "",
    companyEmail: proposal.company.email ?? "",
    website: proposal.company.website ?? "",
    ciiuCode: proposal.company.ciiuCode ?? "",
    sector: proposal.company.sector ?? "",
    companyDescription: proposal.company.description ?? "",
    companyType: proposal.company.type ?? "",
    ciiuSecondary: (proposal.company.ciiuSecondary ?? []).join(", "),
    contactName: proposal.contact?.name ?? "",
    contactRole: proposal.contact?.role ?? "",
    contactArea: proposal.contact?.areaDependency ?? "",
    contactPhone: proposal.contact?.phone ?? "",
    contactEmail: proposal.contact?.email ?? "",
    contactSecondaryPhone: proposal.contact?.secondaryPhone ?? "",
    contactAlternativeEmail: proposal.contact?.alternativeEmail ?? "",
  };
}

/** Rendered only in the authenticated owner's customer-edit window. The server independently enforces it. */
export function CustomerInfoEditor({ proposal }: { proposal: ProposalDetail }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftOf(proposal));
  const [initial, setInitial] = useState<Draft>(() => draftOf(proposal));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (data: CustomerUpdatePayload) => customerApi.update(proposal.id, data),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["requests", proposal.id], updated);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["requests"] }),
        queryClient.invalidateQueries({ queryKey: ["companies"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] }),
      ]);
      setOpen(false);
    },
  });

  const hadValidChannel = hasValidContactChannel(initial);
  const lacksValidChannel = !hadValidChannel && !hasValidContactChannel(draft);

  const start = () => {
    const latest = draftOf(proposal);
    setDraft(latest);
    setInitial(latest);
    setErrors({});
    save.reset();
    setOpen(true);
  };

  const submit = () => {
    const issues = customerContactErrors(draft);
    // Inherited requests may open with no valid channel: that is not the KAM's
    // doing, so only deleting a channel the request had blocks the save.
    if (!hadValidChannel) delete issues.contactability;
    // Like the CIIU, a phone or email is validated only when the user changed it: an inherited malformed one
    // (free text from a historical record) never blocks an unrelated edit.
    for (const key of Object.keys(issues)) {
      if (key === "contactability") continue;
      const field = key as keyof Draft;
      if (pendingValue(draft[field]) === pendingValue(initial[field])) delete issues[key];
    }
    if (!pendingValue(draft.companyName)) issues.companyName = "La razón social es obligatoria.";
    const nit = parseNit(pendingValue(draft.companyNit) ?? "");
    const nitChanged = pendingValue(draft.companyNit) !== pendingValue(initial.companyNit);
    if (nitChanged && !nit.ok) issues.companyNit = nit.error;
    // A CIIU is validated only when the user changed it: an inherited invalid one never blocks an unrelated edit.
    const ciiu = parseCiiu(draft.ciiuCode);
    const ciiuChanged = pendingValue(draft.ciiuCode) !== pendingValue(initial.ciiuCode);
    if (ciiuChanged && !ciiu.ok) issues.ciiuCode = ciiu.error;
    const secondary = parseCiiuList(draft.ciiuSecondary, pendingValue(draft.ciiuCode));
    const secondaryChanged =
      secondary.join(",") !== parseCiiuList(initial.ciiuSecondary, pendingValue(initial.ciiuCode)).join(",");
    const secondaryError = secondaryChanged ? ciiuListError(secondary) : undefined;
    if (secondaryError) issues.ciiuSecondary = secondaryError;
    setErrors(issues);
    if (Object.keys(issues).length) return;
    const payload: CustomerUpdatePayload = {};
    for (const [key] of FIELDS) {
      if (pendingValue(draft[key]) !== pendingValue(initial[key])) {
        let value = pendingValue(draft[key]) ?? null;
        if (key === "companyNit" && nit.ok) value = nit.nit || null;
        if (key === "ciiuCode" && ciiu.ok) value = ciiu.code || null;
        if (key === "companyName") payload.companyName = pendingValue(draft.companyName);
        else payload[key] = value;
      }
    }
    if (draft.companyType !== initial.companyType) {
      payload.companyType = (draft.companyType || null) as CompanyType | null;
    }
    if (secondaryChanged) payload.ciiuSecondary = secondary;
    if (Object.keys(payload).length === 0) {
      setOpen(false);
      return;
    }
    save.mutate(payload);
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={start}>
        Editar empresa y contacto
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!save.isPending) setOpen(next);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Empresa y contacto de la solicitud</DialogTitle>
            <DialogDescription>
              La ficha de empresa se actualiza para futuras solicitudes. Los cambios de este contacto afectan solo esta
              solicitud. No elimines el último teléfono o correo válido que tenga la solicitud; lo demás puede quedar
              Pendiente.
            </DialogDescription>
          </DialogHeader>
          {lacksValidChannel && (
            <p role="status" className="text-sm text-amber-700 dark:text-amber-300">
              Falta un teléfono o correo válido; lo necesitarás para enviar la propuesta al cliente.
            </p>
          )}
          {errors.contactability && (
            <p role="alert" className="text-sm text-destructive">
              {errors.contactability}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`customer-${key}`}>{label}</Label>
                <Input
                  id={`customer-${key}`}
                  value={draft[key]}
                  placeholder={key === "companyName" ? "Razón social" : "Pendiente"}
                  disabled={save.isPending}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? `customer-${key}-error` : undefined}
                  onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                />
                {errors[key] && (
                  <p id={`customer-${key}-error`} className="text-sm text-destructive">
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="customer-companyType">Naturaleza jurídica</Label>
              <select
                id="customer-companyType"
                value={draft.companyType}
                disabled={save.isPending}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                onChange={(event) => setDraft((current) => ({ ...current, companyType: event.target.value }))}
              >
                <option value="">Pendiente</option>
                {COMPANY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {companyTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-ciiuSecondary">CIIU secundarios</Label>
              <Input
                id="customer-ciiuSecondary"
                value={draft.ciiuSecondary}
                placeholder="Pendiente (separados por coma)"
                disabled={save.isPending}
                aria-invalid={Boolean(errors.ciiuSecondary)}
                aria-describedby={errors.ciiuSecondary ? "customer-ciiuSecondary-error" : undefined}
                onChange={(event) => setDraft((current) => ({ ...current, ciiuSecondary: event.target.value }))}
              />
              {errors.ciiuSecondary && (
                <p id="customer-ciiuSecondary-error" className="text-sm text-destructive">
                  {errors.ciiuSecondary}
                </p>
              )}
            </div>
          </div>
          {save.isError && (
            <p role="alert" className="text-sm text-destructive">
              {customerContactServerMessage(save.error) ??
                "No se pudieron guardar los datos. Tus cambios siguen disponibles para reintentar."}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={save.isPending} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={save.isPending} onClick={submit}>
              {save.isPending ? "Guardando..." : "Guardar empresa y contacto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
