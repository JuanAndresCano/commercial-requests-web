import { useState, useEffect } from "react";
import {
  ShieldCheck,
  MessageSquare,
  ExternalLink,
  ChevronUp,
} from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatCop, RequestItem, ProposalCosting, calculateCosting } from "@/lib/mock-data";
import { toast } from "sonner";

interface ProposalCostingModuleProps {
  request: RequestItem;
  onUpdateCosting: (newCosting: ProposalCosting) => void;
  onOpenAdvisorModal: () => void;
  isReadOnly?: boolean;
}

export function ProposalCostingModule({
  request,
  onUpdateCosting,
  onOpenAdvisorModal,
  isReadOnly = false,
}: ProposalCostingModuleProps) {
  const reqType = request.type;
  const isCapacitacion = reqType === "Capacitación";

  // Valores iniciales: si el Líder ya guardó un costeo real se usa ese; si
  // no, arranca en blanco (0) para que el Líder escriba el valor real — no
  // se sugiere un monto que pueda confundirse con un valor ya definido.
  const initialCosting = request.costing ?? calculateCosting(request.type, 0, 30);

  // El campo que antes era "Costo Base Directo" ahora captura directamente
  // el Valor Final de la Propuesta — ya no hay un cálculo hacia adelante de
  // base → total (docs/11, Requisito 1).
  const [totalOfferedCop, setTotalOfferedCop] = useState<number>(initialCosting.totalOfferedCop);
  const [marginPercent, setMarginPercent] = useState<number>(initialCosting.expectedMarginPercent ?? 30);
  // Margen en plata: input manual e independiente, ya no derivado de
  // baseCostCop * marginPercent.
  const [marginAmountCop, setMarginAmountCop] = useState<number>(initialCosting.marginAmountCop ?? 0);
  const [requiresExternalAdvisor, setRequiresExternalAdvisor] = useState<boolean>(
    initialCosting.requiresExternalAdvisor ?? (request.professorType === "externo")
  );
  const [externalAdvisorDetails, setExternalAdvisorDetails] = useState<string>(
    initialCosting.externalAdvisorDetails ?? ""
  );
  const [negotiationNotes, setNegotiationNotes] = useState<string>(
    initialCosting.negotiationNotes ?? ""
  );
  // Gate de envío al KAM (docs/11, Requisito 2) — se preserva tal cual al
  // guardar cambios que no afectan el valor final ni el margen, y se
  // invalida (vuelve a false) si el Líder vuelve a tocar esos campos.
  const [readyForKam, setReadyForKam] = useState<boolean>(initialCosting.readyForKam ?? false);
  const [costingSentAt, setCostingSentAt] = useState<string | undefined>(initialCosting.costingSentAt);

  // Collapsible section for the scope/negotiation note
  const [showNoteField, setShowNoteField] = useState<boolean>(
    Boolean(initialCosting.negotiationNotes && initialCosting.negotiationNotes.trim().length > 0)
  );

  // Sync state when request prop changes
  useEffect(() => {
    if (request.costing) {
      setTotalOfferedCop(request.costing.totalOfferedCop);
      setMarginPercent(request.costing.expectedMarginPercent);
      setMarginAmountCop(request.costing.marginAmountCop ?? 0);
      setRequiresExternalAdvisor(request.costing.requiresExternalAdvisor);
      setExternalAdvisorDetails(request.costing.externalAdvisorDetails ?? "");
      setNegotiationNotes(request.costing.negotiationNotes ?? "");
      setReadyForKam(request.costing.readyForKam ?? false);
      setCostingSentAt(request.costing.costingSentAt);
      if (request.costing.negotiationNotes?.trim()) {
        setShowNoteField(true);
      }
    }
  }, [request.costing]);

  // Referencia informativa: 1.5% solo para Capacitación, calculada sobre el
  // valor final ya digitado. Nunca se suma ni se resta de `totalOfferedCop`
  // — el equipo ya la contempla en el Excel externo del que sale ese valor
  // (docs/11, Requisito 1).
  const proCulturaTaxAmount = isCapacitacion ? Math.round(totalOfferedCop * 0.015) : 0;

  const triggerSave = (
    newTotalOffered: number,
    newMarginPercent: number,
    newMarginAmountCop: number,
    newExternal: boolean,
    newExtDetails: string,
    newNotes: string,
    // Requisito 2: editar el valor final o el margen invalida el "Enviado
    // al KAM" previo — el Líder debe volver a confirmarlo explícitamente.
    invalidateReadyForKam: boolean = false
  ) => {
    const updatedTaxAmount = isCapacitacion ? Math.round(newTotalOffered * 0.015) : 0;
    const nextReadyForKam = invalidateReadyForKam ? false : readyForKam;
    const nextCostingSentAt = invalidateReadyForKam ? undefined : costingSentAt;
    if (invalidateReadyForKam && readyForKam) {
      setReadyForKam(false);
      setCostingSentAt(undefined);
    }

    const updatedCosting: ProposalCosting = {
      requiresExternalAdvisor: newExternal,
      externalAdvisorDetails: newExtDetails,
      marginAmountCop: newMarginAmountCop,
      expectedMarginPercent: newMarginPercent,
      proCulturaTaxPercent: isCapacitacion ? 1.5 : 0,
      proCulturaTaxAmount: updatedTaxAmount,
      totalOfferedCop: newTotalOffered,
      negotiationNotes: newNotes,
      readyForKam: nextReadyForKam,
      costingSentAt: nextCostingSentAt,
    };

    onUpdateCosting(updatedCosting);
  };

  // `min`/`max` en el <Input> solo afectan las flechitas del navegador — si
  // se escribe o pega un valor directamente, no bloquean nada. Sin este
  // clamp se podía guardar un valor final o margen negativo sin ningún aviso.
  const handleTotalOfferedChange = (rawVal: number) => {
    const val = Math.max(0, rawVal);
    setTotalOfferedCop(val);
    triggerSave(val, marginPercent, marginAmountCop, requiresExternalAdvisor, externalAdvisorDetails, negotiationNotes, true);
  };

  const handleMarginPercentChange = (rawVal: number) => {
    const val = Math.min(100, Math.max(0, rawVal));
    setMarginPercent(val);
    triggerSave(totalOfferedCop, val, marginAmountCop, requiresExternalAdvisor, externalAdvisorDetails, negotiationNotes, true);
  };

  const handleMarginAmountChange = (rawVal: number) => {
    const val = Math.max(0, rawVal);
    setMarginAmountCop(val);
    triggerSave(totalOfferedCop, marginPercent, val, requiresExternalAdvisor, externalAdvisorDetails, negotiationNotes, true);
  };

  const handleRequiresExternalChange = (checked: boolean) => {
    setRequiresExternalAdvisor(checked);
    triggerSave(totalOfferedCop, marginPercent, marginAmountCop, checked, externalAdvisorDetails, negotiationNotes);
    if (checked && request.professorType !== "externo") {
      toast.info("Requiere asesor externo seleccionado. Puedes registrar sus datos en un clic.", {
        action: {
          label: "Registrar Asesor",
          onClick: onOpenAdvisorModal,
        },
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-border dark:bg-card">
      {/* SECTION TITLE & BADGE */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-border">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Costeo Financiero
          </h2>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
            Registro directo del valor final de la propuesta comercial
          </p>
        </div>

        <Badge
          variant="outline"
          className="text-xs font-medium border-slate-200 bg-slate-50 text-slate-700 dark:border-border dark:bg-secondary/40 dark:text-slate-300"
        >
          {reqType}
        </Badge>
      </div>

      <div className="mt-5 space-y-5">
        {/* 1. FILA SUPERIOR: VALOR FINAL DE LA PROPUESTA + SWITCH ELEGANTE ASESOR EXTERNO */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Valor Final de la Propuesta (7 cols) */}
          <div className="md:col-span-7 space-y-1.5">
            <Label
              htmlFor="total-offered-input"
              className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-muted-foreground"
            >
              Valor Final de la Propuesta (COP)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">$</span>
              <Input
                id="total-offered-input"
                type="number"
                step="500000"
                min="0"
                value={totalOfferedCop || ""}
                onChange={(e) => handleTotalOfferedChange(Number(e.target.value) || 0)}
                placeholder="0"
                className="pl-7 font-mono text-sm h-9 bg-slate-50/50 border-slate-200 focus-visible:ring-1 focus-visible:ring-primary dark:bg-background dark:border-border"
                disabled={isReadOnly}
              />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Equivale a {formatCop(totalOfferedCop)} COP — valor oficial para presentación al cliente
            </p>
          </div>

          {/* Switch inline Asesor Externo (5 cols) */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/40 p-2.5 dark:border-border dark:bg-secondary/20">
              <div className="space-y-0.5">
                <Label
                  htmlFor="external-advisor-switch"
                  className="text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer block"
                >
                  ¿Requiere asesor externo?
                </Label>
                <span className="text-[11px] text-slate-500 dark:text-muted-foreground block">
                  {requiresExternalAdvisor ? "Sí, consultor externo" : "No, docente planta"}
                </span>
              </div>
              <Switch
                id="external-advisor-switch"
                checked={requiresExternalAdvisor}
                onCheckedChange={handleRequiresExternalChange}
                disabled={isReadOnly}
              />
            </div>

            {/* Input sutil de nombre sin crear otra caja gigante */}
            {requiresExternalAdvisor && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    Nombre o empresa consultora:
                  </span>
                  <button
                    type="button"
                    onClick={onOpenAdvisorModal}
                    className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
                  >
                    Detalles <ExternalLink className="h-2.5 w-2.5" />
                  </button>
                </div>
                <Input
                  value={externalAdvisorDetails}
                  onChange={(e) => {
                    setExternalAdvisorDetails(e.target.value);
                    triggerSave(
                      totalOfferedCop,
                      marginPercent,
                      marginAmountCop,
                      requiresExternalAdvisor,
                      e.target.value,
                      negotiationNotes
                    );
                  }}
                  placeholder="Ej: Ing. Jorge Mendoza (Consultoría TIC)"
                  className="h-8 text-xs bg-white dark:bg-background border-slate-200 dark:border-border"
                  disabled={isReadOnly}
                />
              </div>
            )}
          </div>
        </div>

        {/* 2. FILA MEDIA: MARGEN DE CONTRIBUCIÓN — % Y $ SON CAMPOS MANUALES E INDEPENDIENTES */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-border">
          <Label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
            Margen de Contribución
          </Label>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Input porcentual */}
            <div className="relative w-full sm:w-32">
              <Input
                id="margin-percent-input"
                type="number"
                step="1"
                min="0"
                max="100"
                value={marginPercent || ""}
                onChange={(e) => handleMarginPercentChange(Number(e.target.value) || 0)}
                className="pr-7 font-mono text-sm h-9 bg-slate-50/50 border-slate-200 focus-visible:ring-1 focus-visible:ring-primary dark:bg-background dark:border-border"
                disabled={isReadOnly}
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">%</span>
            </div>

            {/* Input de margen en plata (manual, independiente del %) */}
            <div className="relative w-full sm:w-48">
              <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">$</span>
              <Input
                id="margin-amount-input"
                type="number"
                step="100000"
                min="0"
                value={marginAmountCop || ""}
                onChange={(e) => handleMarginAmountChange(Number(e.target.value) || 0)}
                placeholder="0"
                className="pl-7 font-mono text-sm h-9 bg-slate-50/50 border-slate-200 focus-visible:ring-1 focus-visible:ring-primary dark:bg-background dark:border-border"
                disabled={isReadOnly}
              />
            </div>

            {/* Chips tipo pill minimalistas en tono slate suave */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Predefinidos:</span>
              {[25, 30, 35, 40].map((preset) => {
                const isActive = marginPercent === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleMarginPercentChange(preset)}
                    disabled={isReadOnly}
                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs dark:bg-primary dark:text-primary-foreground font-semibold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/70 dark:bg-secondary/60 dark:text-slate-300 dark:hover:bg-secondary"
                    }`}
                  >
                    {preset}%
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            El % y el valor en pesos son campos informativos independientes — no se recalculan entre sí ni afectan el valor final de la propuesta.
          </p>
        </div>

        {/* 3. DESGLOSE FINANCIERO INLINE EN UNA TABLA / LISTA LIMPIA DE RESUMEN */}
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 dark:border-border dark:bg-secondary/15 space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground pb-1 border-b border-slate-200/60 dark:border-border">
            Desglose Financiero de la Propuesta
          </div>

          <div className="divide-y divide-slate-200/60 dark:divide-border text-xs">
            {/* 1. Valor Final de la Propuesta (manual) */}
            <div className="flex items-center justify-between pt-1 pb-2">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-900 dark:text-slate-100 block">
                  Valor Final de la Propuesta
                </span>
                <span className="text-[11px] text-slate-500 dark:text-muted-foreground block">
                  Valor oficial para presentación al cliente (COP)
                </span>
              </div>
              <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 shrink-0">
                {formatCop(totalOfferedCop)}
              </span>
            </div>

            {/* 2. Margen de Contribución (% + $, ambos manuales) */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 dark:text-slate-400">Margen de Contribución</span>
                <span className="text-[11px] text-slate-400">({marginPercent}%)</span>
              </div>
              <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">
                {formatCop(marginAmountCop)}
              </span>
            </div>

            {/* 3. Referencia Pro-Cultura (1.5%) - Solo visible si es Capacitación, informativa */}
            {isCapacitacion && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400">Referencia Pro-Cultura (1.5%)</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 font-normal"
                  >
                    Capacitación
                  </Badge>
                </div>
                <span className="font-mono font-medium text-amber-700 dark:text-amber-300">
                  {formatCop(proCulturaTaxAmount)}
                </span>
              </div>
            )}
          </div>

          {isCapacitacion && (
            <p className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1">
              <ShieldCheck className="h-3 w-3 shrink-0 mt-0.5" />
              Referencia Pro-Cultura (1.5%): {formatCop(proCulturaTaxAmount)} — ya debe estar contemplado en tu valor final. No se suma ni se resta automáticamente.
            </p>
          )}
        </div>

        {/* NOTA DE ALCANCE / NEGOCIACIÓN (colapsable) */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
          {!showNoteField ? (
            <button
              type="button"
              onClick={() => setShowNoteField(true)}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors text-xs inline-flex items-center gap-1"
            >
              <MessageSquare className="h-3 w-3" /> + Agregar nota de alcance
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowNoteField(false)}
              className="text-slate-400 hover:text-slate-600 text-xs inline-flex items-center gap-1"
            >
              <ChevronUp className="h-3 w-3" /> Ocultar nota
            </button>
          )}
        </div>

        {/* Custom note field when expanded */}
        {showNoteField && (
          <div className="space-y-1 text-xs">
            <Label
              htmlFor="negotiation-note-input"
              className="text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Nota de alcance comercial o justificación de costo:
            </Label>
            <Textarea
              id="negotiation-note-input"
              rows={2}
              value={negotiationNotes}
              onChange={(e) => {
                setNegotiationNotes(e.target.value);
                triggerSave(
                  totalOfferedCop,
                  marginPercent,
                  marginAmountCop,
                  requiresExternalAdvisor,
                  externalAdvisorDetails,
                  e.target.value
                );
              }}
              placeholder="Ej: Se incluye ajuste de alcance en 2 módulos presenciales acordado con el cliente..."
              className="text-xs resize-none bg-white dark:bg-background border-slate-200 dark:border-border"
              disabled={isReadOnly}
            />
          </div>
        )}
      </div>
    </div>
  );
}
