import { useState, useEffect } from "react";
import {
  DollarSign,
  Percent,
  Calculator,
  RotateCcw,
  ShieldCheck,
  UserPlus,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

  // Initial cost values from request or defaults
  const initialCosting = request.costing ?? calculateCosting(
    request.type,
    14_000_000,
    30,
    request.totalCostCop
  );

  const [baseCostCop, setBaseCostCop] = useState<number>(initialCosting.baseCostCop || 14_000_000);
  const [marginPercent, setMarginPercent] = useState<number>(initialCosting.expectedMarginPercent ?? 30);
  const [requiresExternalAdvisor, setRequiresExternalAdvisor] = useState<boolean>(
    initialCosting.requiresExternalAdvisor ?? (request.professorType === "externo")
  );
  const [externalAdvisorDetails, setExternalAdvisorDetails] = useState<string>(
    initialCosting.externalAdvisorDetails ?? ""
  );
  const [totalOfferedCop, setTotalOfferedCop] = useState<number>(
    initialCosting.totalOfferedCop || request.totalCostCop || 18_410_000
  );
  const [negotiationNotes, setNegotiationNotes] = useState<string>(
    initialCosting.negotiationNotes ?? ""
  );

  // Collapsible sections for custom adjustment and note
  const [showNegotiationAdjustment, setShowNegotiationAdjustment] = useState<boolean>(
    Boolean(
      initialCosting.totalOfferedCop &&
      initialCosting.suggestedTotalCop &&
      initialCosting.totalOfferedCop !== initialCosting.suggestedTotalCop
    )
  );
  const [showNoteField, setShowNoteField] = useState<boolean>(
    Boolean(initialCosting.negotiationNotes && initialCosting.negotiationNotes.trim().length > 0)
  );

  // Sync state when request prop changes
  useEffect(() => {
    if (request.costing) {
      setBaseCostCop(request.costing.baseCostCop);
      setMarginPercent(request.costing.expectedMarginPercent);
      setRequiresExternalAdvisor(request.costing.requiresExternalAdvisor);
      setExternalAdvisorDetails(request.costing.externalAdvisorDetails ?? "");
      setTotalOfferedCop(request.costing.totalOfferedCop);
      setNegotiationNotes(request.costing.negotiationNotes ?? "");
      if (request.costing.negotiationNotes?.trim()) {
        setShowNoteField(true);
      }
      if (request.costing.suggestedTotalCop && request.costing.totalOfferedCop !== request.costing.suggestedTotalCop) {
        setShowNegotiationAdjustment(true);
      }
    }
  }, [request.costing]);

  // Financial calculations
  const marginAmount = Math.round(baseCostCop * (marginPercent / 100));
  const subtotalWithMargin = baseCostCop + marginAmount;

  // Conditional Pro-Cultura Tax (1.5% only for Capacitación)
  const proCulturaTaxAmount = isCapacitacion ? Math.round(baseCostCop * 0.015) : 0;
  const calculatedTotalCop = Math.round(baseCostCop + marginAmount + proCulturaTaxAmount);

  const triggerSave = (
    newBase: number,
    newMargin: number,
    newOffered: number,
    newExternal: boolean,
    newExtDetails: string,
    newNotes: string
  ) => {
    const updatedTaxAmount = isCapacitacion ? Math.round(newBase * 0.015) : 0;
    const updatedSuggested = Math.round(newBase + (newBase * (newMargin / 100)) + updatedTaxAmount);

    const updatedCosting: ProposalCosting = {
      requiresExternalAdvisor: newExternal,
      externalAdvisorDetails: newExtDetails,
      baseCostCop: newBase,
      expectedMarginPercent: newMargin,
      proCulturaTaxPercent: isCapacitacion ? 1.5 : 0,
      proCulturaTaxAmount: updatedTaxAmount,
      suggestedTotalCop: updatedSuggested,
      totalOfferedCop: newOffered,
      negotiationNotes: newNotes,
    };

    onUpdateCosting(updatedCosting);
  };

  const handleBaseCostChange = (val: number) => {
    setBaseCostCop(val);
    const newTax = isCapacitacion ? Math.round(val * 0.015) : 0;
    const newSuggested = Math.round(val + (val * (marginPercent / 100)) + newTax);
    const newOffered = totalOfferedCop === calculatedTotalCop ? newSuggested : totalOfferedCop;
    setTotalOfferedCop(newOffered);
    triggerSave(val, marginPercent, newOffered, requiresExternalAdvisor, externalAdvisorDetails, negotiationNotes);
  };

  const handleMarginChange = (val: number) => {
    setMarginPercent(val);
    const newTax = isCapacitacion ? Math.round(baseCostCop * 0.015) : 0;
    const newSuggested = Math.round(baseCostCop + (baseCostCop * (val / 100)) + newTax);
    const newOffered = totalOfferedCop === calculatedTotalCop ? newSuggested : totalOfferedCop;
    setTotalOfferedCop(newOffered);
    triggerSave(baseCostCop, val, newOffered, requiresExternalAdvisor, externalAdvisorDetails, negotiationNotes);
  };

  const handleOfferedChange = (val: number) => {
    setTotalOfferedCop(val);
    triggerSave(baseCostCop, marginPercent, val, requiresExternalAdvisor, externalAdvisorDetails, negotiationNotes);
  };

  const handleRequiresExternalChange = (checked: boolean) => {
    setRequiresExternalAdvisor(checked);
    triggerSave(baseCostCop, marginPercent, totalOfferedCop, checked, externalAdvisorDetails, negotiationNotes);
    if (checked && request.professorType !== "externo") {
      toast.info("Requiere asesor externo seleccionado. Puedes registrar sus datos en un clic.", {
        action: {
          label: "Registrar Asesor",
          onClick: onOpenAdvisorModal,
        },
      });
    }
  };

  const handleSyncOfferedWithCalculated = () => {
    setTotalOfferedCop(calculatedTotalCop);
    triggerSave(baseCostCop, marginPercent, calculatedTotalCop, requiresExternalAdvisor, externalAdvisorDetails, negotiationNotes);
    toast.success("Valor Total sincronizado con el cálculo estándar");
  };

  const differenceWithCalculated = totalOfferedCop - calculatedTotalCop;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-border dark:bg-card">
      {/* SECTION TITLE & BADGE */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-border">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Costeo Financiero
          </h2>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
            Estructuración directa de costos y márgenes de la propuesta comercial
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
        {/* 1. FILA SUPERIOR: COSTO BASE DIRECTO + SWITCH ELEGANTE ASESOR EXTERNO */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Costo Base Directo (7 cols) */}
          <div className="md:col-span-7 space-y-1.5">
            <Label
              htmlFor="base-cost-input"
              className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-muted-foreground"
            >
              Costo Base Directo (COP)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">$</span>
              <Input
                id="base-cost-input"
                type="number"
                step="500000"
                min="0"
                value={baseCostCop || ""}
                onChange={(e) => handleBaseCostChange(Number(e.target.value) || 0)}
                placeholder="0"
                className="pl-7 font-mono text-sm h-9 bg-slate-50/50 border-slate-200 focus-visible:ring-1 focus-visible:ring-primary dark:bg-background dark:border-border"
                disabled={isReadOnly}
              />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Equivale a {formatCop(baseCostCop)} COP
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
                      baseCostCop,
                      marginPercent,
                      totalOfferedCop,
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

        {/* 2. FILA MEDIA: MARGEN DE CONTRIBUCIÓN CON INPUT PORCENTUAL Y CHIPS PILL EN TONO SLATE SUAVE */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-border">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="margin-percent-input"
              className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-muted-foreground"
            >
              Margen de Contribución
            </Label>
            <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
              +{formatCop(marginAmount)} COP
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Input porcentual */}
            <div className="relative w-full sm:w-36">
              <Input
                id="margin-percent-input"
                type="number"
                step="1"
                min="0"
                max="100"
                value={marginPercent || ""}
                onChange={(e) => handleMarginChange(Number(e.target.value) || 0)}
                className="pr-7 font-mono text-sm h-9 bg-slate-50/50 border-slate-200 focus-visible:ring-1 focus-visible:ring-primary dark:bg-background dark:border-border"
                disabled={isReadOnly}
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">%</span>
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
                    onClick={() => handleMarginChange(preset)}
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
        </div>

        {/* 3. DESGLOSE FINANCIERO INLINE EN UNA TABLA / LISTA LIMPIA DE RESUMEN */}
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 dark:border-border dark:bg-secondary/15 space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground pb-1 border-b border-slate-200/60 dark:border-border">
            Desglose Financiero de la Propuesta
          </div>

          <div className="divide-y divide-slate-200/60 dark:divide-border text-xs">
            {/* 1. Costo Base Directo */}
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 dark:text-slate-400">Costo Base Directo</span>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {formatCop(baseCostCop)}
              </span>
            </div>

            {/* 2. Margen de Contribución */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 dark:text-slate-400">Margen de Contribución</span>
                <span className="text-[11px] text-slate-400">({marginPercent}%)</span>
              </div>
              <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">
                +{formatCop(marginAmount)}
              </span>
            </div>

            {/* 3. Subtotal */}
            <div className="flex items-center justify-between py-2 font-medium">
              <span className="text-slate-700 dark:text-slate-300">Subtotal con Margen</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">
                {formatCop(subtotalWithMargin)}
              </span>
            </div>

            {/* 4. Estampilla Pro-Cultura (1.5%) - Solo visible si es Capacitación con badge sutil */}
            {isCapacitacion && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400">Estampilla Pro-Cultura (1.5%)</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 font-normal"
                  >
                    Capacitación
                  </Badge>
                </div>
                <span className="font-mono font-medium text-amber-700 dark:text-amber-300">
                  +{formatCop(proCulturaTaxAmount)}
                </span>
              </div>
            )}

            {/* 5. Total Final Ofertado (destacado con tipografía clara y limpia, sin bordes pesados) */}
            <div className="flex items-center justify-between pt-3 pb-1">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-900 dark:text-slate-100 block">
                  Total Final Ofertado
                </span>
                <span className="text-[11px] text-slate-500 dark:text-muted-foreground block">
                  Valor oficial para presentación al cliente (COP)
                </span>
              </div>

              <div className="text-right">
                <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 block">
                  {formatCop(totalOfferedCop)}
                </span>
                {differenceWithCalculated !== 0 ? (
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    Ajuste: {differenceWithCalculated > 0 ? "+" : ""}{formatCop(differenceWithCalculated)}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Cálculo estándar
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AJUSTES OPCIONALES DE NEGOCIACIÓN Y NOTA (Limpios y colapsables) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {!showNegotiationAdjustment ? (
              <button
                type="button"
                onClick={() => setShowNegotiationAdjustment(true)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors text-xs inline-flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" /> Personalizar valor ofertado
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowNegotiationAdjustment(false)}
                className="text-slate-400 hover:text-slate-600 text-xs inline-flex items-center gap-1"
              >
                <ChevronUp className="h-3 w-3" /> Ocultar personalización
              </button>
            )}

            <span>·</span>

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

          {totalOfferedCop !== calculatedTotalCop && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSyncOfferedWithCalculated}
              className="h-7 px-2 text-xs text-primary hover:text-primary/80 font-medium"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Sincronizar a {formatCop(calculatedTotalCop)}
            </Button>
          )}
        </div>

        {/* Custom total offered field when expanded */}
        {showNegotiationAdjustment && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3 text-xs space-y-1.5 dark:border-border dark:bg-secondary/20">
            <Label
              htmlFor="custom-offered-input"
              className="text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Valor ofertado acordado (ajuste manual):
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">$</span>
              <Input
                id="custom-offered-input"
                type="number"
                step="100000"
                min="0"
                value={totalOfferedCop || ""}
                onChange={(e) => handleOfferedChange(Number(e.target.value) || 0)}
                className="pl-7 font-mono text-sm h-8 bg-white dark:bg-background border-slate-200 dark:border-border"
                disabled={isReadOnly}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Permite modificar el valor total en caso de descuentos comerciales acordados con el cliente.
            </p>
          </div>
        )}

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
                  baseCostCop,
                  marginPercent,
                  totalOfferedCop,
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
