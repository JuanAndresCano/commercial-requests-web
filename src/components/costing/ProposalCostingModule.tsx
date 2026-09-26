import { useState, useEffect } from "react";
import { ShieldCheck, MessageSquare, ChevronUp, GraduationCap, Calculator } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatCop, RequestItem, ProposalCosting, calculateCosting } from "@/lib/mock-data";

interface ProposalCostingModuleProps {
  request: RequestItem;
  onUpdateCosting: (newCosting: ProposalCosting) => void;
  isReadOnly?: boolean;
}

export function ProposalCostingModule({ request, onUpdateCosting, isReadOnly = false }: ProposalCostingModuleProps) {
  const reqType = request.type;
  const isCapacitacion = reqType === "Capacitación";

  // Valores iniciales: si el Líder ya guardó un costeo real se usa ese; si
  // no, arranca en blanco (0) para que el Líder escriba el valor real — no
  // se sugiere un monto que pueda confundirse con un valor ya definido.
  const initialCosting = request.costing ?? calculateCosting(request.type, 0, 30);

  // El campo que antes era "Costo Base Directo" ahora captura directamente
  // el Valor Final de la Propuesta — ya no hay un cálculo hacia adelante de
  // base → total (docs/04).
  const [totalOfferedCop, setTotalOfferedCop] = useState<number>(initialCosting.totalOfferedCop);
  const [marginPercent, setMarginPercent] = useState<number>(initialCosting.expectedMarginPercent ?? 30);
  // Margen en plata: input manual e independiente, ya no derivado de
  // baseCostCop * marginPercent.
  const [marginAmountCop, setMarginAmountCop] = useState<number>(initialCosting.marginAmountCop ?? 0);
  const [negotiationNotes, setNegotiationNotes] = useState<string>(initialCosting.negotiationNotes ?? "");
  // Gate de envío al KAM (docs/04) — se preserva tal cual al
  // guardar cambios que no afectan el valor final ni el margen, y se
  // invalida (vuelve a false) si el Líder vuelve a tocar esos campos.
  const [readyForKam, setReadyForKam] = useState<boolean>(initialCosting.readyForKam ?? false);
  const [costingSentAt, setCostingSentAt] = useState<string | undefined>(initialCosting.costingSentAt);

  // Collapsible section for the scope/negotiation note
  const [showNoteField, setShowNoteField] = useState<boolean>(
    Boolean(initialCosting.negotiationNotes && initialCosting.negotiationNotes.trim().length > 0),
  );

  // Sync state when request prop changes
  useEffect(() => {
    if (request.costing) {
      setTotalOfferedCop(request.costing.totalOfferedCop);
      setMarginPercent(request.costing.expectedMarginPercent);
      setMarginAmountCop(request.costing.marginAmountCop ?? 0);
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
  // (docs/04).
  const proCulturaTaxAmount = isCapacitacion ? Math.round(totalOfferedCop * 0.015) : 0;

  const triggerSave = (
    newTotalOffered: number,
    newMarginPercent: number,
    newMarginAmountCop: number,
    newNotes: string,
    // Requisito 2: editar el valor final o el margen invalida el "Enviado
    // al KAM" previo — el Líder debe volver a confirmarlo explícitamente.
    invalidateReadyForKam: boolean = false,
  ) => {
    const updatedTaxAmount = isCapacitacion ? Math.round(newTotalOffered * 0.015) : 0;
    const nextReadyForKam = invalidateReadyForKam ? false : readyForKam;
    const nextCostingSentAt = invalidateReadyForKam ? undefined : costingSentAt;
    if (invalidateReadyForKam && readyForKam) {
      setReadyForKam(false);
      setCostingSentAt(undefined);
    }

    const updatedCosting: ProposalCosting = {
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
    triggerSave(val, marginPercent, marginAmountCop, negotiationNotes, true);
  };

  const handleMarginPercentChange = (rawVal: number) => {
    const val = Math.min(100, Math.max(0, rawVal));
    setMarginPercent(val);
    triggerSave(totalOfferedCop, val, marginAmountCop, negotiationNotes, true);
  };

  const handleMarginAmountChange = (rawVal: number) => {
    const val = Math.max(0, rawVal);
    setMarginAmountCop(val);
    triggerSave(totalOfferedCop, marginPercent, val, negotiationNotes, true);
  };

  // Indicador de solo lectura del asesor del servicio (docs/07, gap #11):
  // ya no es un switch independiente — se deriva directamente del
  // docente/asesor realmente asignado en "Equipo Asignado", para que nunca
  // pueda contradecir esa asignación.
  const isExternalAdvisor = request.professorType === "externo";
  const advisorDisplayName = isExternalAdvisor
    ? request.externalProfessorData?.nombre || request.professor || "Asesor externo sin nombre registrado"
    : request.professorType === "planta"
      ? request.professor || "Docente de planta sin nombre registrado"
      : "Sin docente o asesor asignado todavía";
  const advisorSubtitle = isExternalAdvisor ? request.externalProfessorData?.empresaConsultora : undefined;
  // Referencia informativa (docs/04): nunca sobreescribe el margen manual,
  // solo ayuda a detectar de un vistazo si el % y el valor en $ "cuadran".
  const marginReferenceAmount = Math.round((totalOfferedCop * marginPercent) / 100);

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

          {/* Indicador de solo lectura del asesor del servicio (5 cols) —
              derivado del docente/asesor realmente asignado, ya no un switch
              independiente que se podía contradecir con esa asignación
              (docs/07, gap #11). */}
          <div className="md:col-span-5 space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
              Asesor del Servicio
            </Label>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50/40 p-2.5 dark:border-border dark:bg-secondary/20">
              <div className="min-w-0 flex items-start gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {advisorDisplayName}
                    </span>
                    {request.professorType && (
                      <Badge
                        variant="outline"
                        className={
                          isExternalAdvisor
                            ? "text-[10px] px-1.5 py-0 h-4 border-[#e9683b]/30 bg-[#e9683b]/10 text-[#e9683b] font-semibold shrink-0"
                            : "text-[10px] px-1.5 py-0 h-4 border-[#5454e9]/30 bg-[#5454e9]/10 text-[#5454e9] dark:text-[#865cf0] font-semibold shrink-0"
                        }
                      >
                        {isExternalAdvisor ? "Externo" : "Planta"}
                      </Badge>
                    )}
                  </div>
                  {advisorSubtitle && (
                    <span className="text-[11px] text-slate-500 dark:text-muted-foreground block truncate">
                      {advisorSubtitle}
                    </span>
                  )}
                </div>
              </div>
              {/* Ya no es editable desde acá (hallazgo 2026-09-25): este módulo solo
                  se muestra en "en-costeo"/"entregada", es decir, siempre después
                  de que el proceso pasó por "En proceso por experto" — cambiar el
                  docente en ese punto sin dejar rastro fue el bug encontrado. El
                  historial completo vive en la tarjeta "Docente / Asesor". */}
              <span
                className="text-muted-foreground text-[11px] inline-flex items-center gap-0.5 shrink-0 italic"
                title='No editable desde el costeo: la solicitud ya pasó por "En proceso por experto"'
              >
                No editable
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Derivado del docente/asesor asignado en "Equipo Asignado" — ya no es un campo independiente del costeo.
            </p>
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
            <div className="w-full sm:w-48 space-y-1">
              <div className="relative">
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
              {/* Referencia calculada, no editable y no guardada (docs/04):
                  el margen manual y el valor final siguen siendo campos
                  independientes — esto es solo para detectar de un vistazo
                  cuando "no cuadran". */}
              <div className="flex items-center gap-1.5 rounded-md bg-slate-50 dark:bg-white/5 px-2 py-1">
                <Calculator className="h-3 w-3 shrink-0 text-slate-400" />
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  {marginPercent}% de {formatCop(totalOfferedCop)} ={" "}
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                    {formatCop(marginReferenceAmount)}
                  </span>
                </p>
              </div>
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
            El % y el valor en pesos son campos informativos independientes — no se recalculan entre sí ni afectan el
            valor final de la propuesta.
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
              Referencia Pro-Cultura (1.5%): {formatCop(proCulturaTaxAmount)} — ya debe estar contemplado en tu valor
              final. No se suma ni se resta automáticamente.
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
            <Label htmlFor="negotiation-note-input" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Nota de alcance comercial o justificación de costo:
            </Label>
            <Textarea
              id="negotiation-note-input"
              rows={2}
              value={negotiationNotes}
              onChange={(e) => {
                setNegotiationNotes(e.target.value);
                triggerSave(totalOfferedCop, marginPercent, marginAmountCop, e.target.value);
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
