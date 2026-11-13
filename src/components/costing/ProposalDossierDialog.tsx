import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Download, FileText, FileSpreadsheet, FileType } from "@/components/icons";
import type { RequestItem, ProposalDocument } from "@/lib/mock-data";
import { toast } from "sonner";

interface ProposalDossierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestItem;
  onDownloadDocument?: (doc: ProposalDocument) => void;
}

export function ProposalDossierDialog({ isOpen, onClose, request, onDownloadDocument }: ProposalDossierDialogProps) {
  const [activeTab, setActiveTab] = useState<"ficha" | "adjuntos">("ficha");

  const documents = request.clientKamDocuments ?? [];
  const hasDocuments = documents.length > 0;

  const todayStr = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const getDocIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4 text-rose-500 shrink-0" />;
      case "excel":
        return <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      default:
        return <FileType className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />;
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("proposal-dossier-printable");
    if (!printContent) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Ficha Técnica para Docente - ${request.code || request.title}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 14mm 14mm 14mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 9.5pt;
              line-height: 1.45;
            }
            .header-banner {
              border-bottom: 2.5px solid #1e3a8a;
              padding-bottom: 10px;
              margin-bottom: 14px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .inst-title {
              font-size: 13pt;
              font-weight: 800;
              color: #1e3a8a;
              text-transform: uppercase;
              letter-spacing: -0.3px;
              margin: 0 0 2px 0;
            }
            .inst-sub {
              font-size: 8.5pt;
              font-weight: 700;
              color: #475569;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 0.2px;
            }
            .code-badge {
              text-align: right;
            }
            .code-val {
              font-size: 12pt;
              font-weight: 800;
              color: #0f172a;
            }
            .date-val {
              font-size: 8pt;
              color: #64748b;
              margin-top: 2px;
            }
            .section-card {
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 9px 12px;
              margin-bottom: 10px;
              page-break-inside: avoid;
              background-color: #f8fafc;
            }
            .section-title {
              font-size: 9.5pt;
              font-weight: 700;
              color: #1e3a8a;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 3px;
              margin: 0 0 6px 0;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 6px 14px;
            }
            .grid-3 {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 6px 12px;
            }
            .field-group {
              margin-bottom: 3px;
            }
            .field-label {
              font-size: 7.2pt;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 1px;
            }
            .field-value {
              font-size: 9pt;
              font-weight: 500;
              color: #0f172a;
            }
            .prose-block {
              font-size: 8.8pt;
              color: #1e293b;
              white-space: pre-line;
              margin-top: 1px;
            }
            .footer-note {
              margin-top: 16px;
              border-top: 1px solid #e2e8f0;
              padding-top: 6px;
              font-size: 7.5pt;
              color: #94a3b8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    if (process.env.NODE_ENV !== "test") {
      try {
        iframe.contentWindow?.focus();
      } catch {
        // Ignore in environments without window.focus
      }
    }

    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
      setTimeout(() => {
        iframe.remove();
      }, 1500);
    }, 300);
  };

  const handleDownloadAll = () => {
    if (!hasDocuments) {
      toast.info("No hay archivos adjuntos en esta propuesta");
      return;
    }
    if (!onDownloadDocument) {
      toast.info("Descarga no disponible en este momento");
      return;
    }
    documents.forEach((doc, idx) => {
      setTimeout(() => {
        onDownloadDocument(doc);
      }, idx * 400);
    });
    toast.success(`Iniciando descarga de ${documents.length} archivo(s)...`);
  };

  const hasDiagnostic = Boolean(request.necesidad || request.competencias || request.resultados || request.exito);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* HEADER MODAL */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg font-bold text-foreground">Ficha Técnica para Docente</DialogTitle>
              <Badge variant="outline" className="font-mono text-xs font-semibold bg-muted">
                {request.code || "REQ"}
              </Badge>
              {request.officialNumber && (
                <Badge variant="secondary" className="font-mono text-xs font-semibold">
                  {request.officialNumber}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              Resumen pedagógico estructurado y documentos de soporte para el profesor asignado
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 px-3 text-xs font-semibold bg-icesi-blue hover:bg-icesi-blue/90 text-white shadow-xs inline-flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </Button>
            {hasDocuments && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAll}
                className="h-8 px-3 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Descargar Adjuntos ({documents.length})</span>
              </Button>
            )}
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ficha" | "adjuntos")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/60 p-1">
              <TabsTrigger value="ficha" className="text-xs font-semibold flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>Ficha Técnica Imprimible</span>
              </TabsTrigger>
              <TabsTrigger value="adjuntos" className="text-xs font-semibold flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" />
                <span>Archivos de Soporte ({documents.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: FICHA TÉCNICA */}
            <TabsContent value="ficha" className="mt-0 focus-visible:outline-none">
              <div
                id="proposal-dossier-printable"
                className="rounded-lg border border-border bg-card p-6 shadow-xs text-foreground space-y-3.5"
              >
                {/* ENCABEZADO INSTITUCIONAL */}
                <div className="header-banner flex flex-col sm:flex-row justify-between items-start border-b-2 border-icesi-blue pb-3 mb-3 gap-2">
                  <div>
                    <h1 className="inst-title text-base sm:text-lg font-extrabold text-icesi-blue uppercase tracking-tight">
                      Universidad Icesi · Consultoría y Educación Continua
                    </h1>
                    <p className="inst-sub text-xs font-bold text-muted-foreground uppercase">
                      Ficha Técnica de Asignación Docente
                    </p>
                  </div>
                  <div className="code-badge text-left sm:text-right">
                    <div className="code-val text-sm font-bold text-foreground">
                      {request.code || `ID: ${request.id.slice(0, 8)}`}
                    </div>
                    {request.officialNumber && (
                      <div className="text-xs font-medium text-muted-foreground">Oficial: {request.officialNumber}</div>
                    )}
                    <div className="date-val text-[11px] text-muted-foreground">Fecha: {todayStr}</div>
                  </div>
                </div>

                {/* BLOQUE 1: INFORMACIÓN DEL CLIENTE Y CONTACTO */}
                <div className="section-card border border-border/80 rounded-md p-3.5 bg-muted/20">
                  <h2 className="section-title text-xs font-bold text-icesi-blue uppercase tracking-wide border-b border-border/60 pb-1 mb-2.5">
                    1. Contexto Empresarial (Cliente)
                  </h2>
                  <div className="grid-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="field-group">
                      <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                        Empresa / Razón Social
                      </div>
                      <div className="field-value font-medium text-foreground">
                        {request.company} {request.companyNit ? `(NIT: ${request.companyNit})` : ""}
                      </div>
                    </div>

                    {(request.companyCiiuPrincipalDesc || request.companyCiiuPrincipal) && (
                      <div className="field-group">
                        <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                          Sector / Actividad Económica
                        </div>
                        <div className="field-value font-medium text-foreground">
                          {request.companyCiiuPrincipalDesc || request.companyCiiuPrincipal}
                        </div>
                      </div>
                    )}

                    <div className="field-group">
                      <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                        Contacto Principal de la Empresa
                      </div>
                      <div className="field-value font-medium text-foreground">
                        {request.applicant || "Contacto por confirmar"}
                        {request.contactCargo ? ` — ${request.contactCargo}` : ""}
                      </div>
                    </div>

                    {(request.contactCorreo || request.companyCorreo || request.contactTelefono) && (
                      <div className="field-group">
                        <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                          Canal de Contacto
                        </div>
                        <div className="field-value font-medium text-foreground">
                          {[
                            request.contactCorreo || request.companyCorreo,
                            request.contactTelefono ? `Tel: ${request.contactTelefono}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOQUE 2: EQUIPO Y ASIGNACIÓN ACADÉMICA */}
                <div className="section-card border border-border/80 rounded-md p-3.5 bg-muted/20">
                  <h2 className="section-title text-xs font-bold text-icesi-blue uppercase tracking-wide border-b border-border/60 pb-1 mb-2.5">
                    2. Equipo y Ficha de Asignación Académica
                  </h2>
                  <div className="grid-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="field-group">
                      <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                        Profesor Asignado
                      </div>
                      <div className="field-value font-bold text-foreground">{request.professor || "Por asignar"}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {request.professorType === "planta" ? "Docente de Planta" : "Docente / Asesor Externo"}
                      </div>
                    </div>
                    <div className="field-group">
                      <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                        Nodo Académico Responsable
                      </div>
                      <div className="field-value font-medium text-foreground">
                        {request.node || "Asignación directa / Sin nodo asignado"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">Líder de Nodo: {request.productLeader}</div>
                    </div>
                    <div className="field-group">
                      <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                        Gestor Comercial (KAM)
                      </div>
                      <div className="field-value font-medium text-foreground">{request.kam}</div>
                      {(request.center || request.costCenter) && (
                        <div className="text-[11px] text-muted-foreground">
                          Centro:{" "}
                          {[request.center, request.costCenter ? `(${request.costCenter})` : null]
                            .filter(Boolean)
                            .join(" ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* BLOQUE 3: ESPECIFICACIÓN ACADÉMICA DEL PROGRAMA */}
                <div className="section-card border border-border/80 rounded-md p-3.5 bg-muted/20">
                  <h2 className="section-title text-xs font-bold text-icesi-blue uppercase tracking-wide border-b border-border/60 pb-1 mb-2.5">
                    3. Especificación Pedagógica del Programa
                  </h2>
                  <div className="space-y-2.5 text-xs">
                    <div className="field-group">
                      <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                        Título de la Propuesta / Capacitación
                      </div>
                      <div className="field-value font-bold text-sm text-foreground">{request.title}</div>
                    </div>

                    <div className="grid-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="field-group">
                        <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                          Tipo de Requerimiento
                        </div>
                        <div className="field-value font-medium text-foreground">
                          {request.type === "Otro" && request.tipoOtro ? `Otro — ${request.tipoOtro}` : request.type}
                        </div>
                      </div>
                      <div className="field-group">
                        <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                          Modalidad
                        </div>
                        <div className="field-value font-medium text-foreground">
                          {request.modalidad || "Por concertar con el cliente"}
                        </div>
                      </div>
                      <div className="field-group">
                        <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                          Intensidad Horaria Estimada
                        </div>
                        <div className="field-value font-medium text-foreground">
                          {request.horas ? `${request.horas} horas estimadas` : "A convenir con el docente"}
                        </div>
                      </div>
                    </div>

                    {(request.participantes || request.areaParticipantes) && (
                      <div className="grid-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {request.participantes && (
                          <div className="field-group">
                            <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                              Cupo / Participantes Proyectados
                            </div>
                            <div className="field-value font-medium text-foreground">
                              {request.participantes} personas
                            </div>
                          </div>
                        )}
                        {request.areaParticipantes && (
                          <div className="field-group">
                            <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                              Área / Perfil de los Participantes
                            </div>
                            <div className="field-value font-medium text-foreground">{request.areaParticipantes}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOQUE 4: DIAGNÓSTICO, RETO Y OBJETIVOS */}
                <div className="section-card border border-border/80 rounded-md p-3.5 bg-muted/20">
                  <h2 className="section-title text-xs font-bold text-icesi-blue uppercase tracking-wide border-b border-border/60 pb-1 mb-2.5">
                    4. Reto Empresarial, Objetivos y Competencias
                  </h2>
                  <div className="space-y-2.5 text-xs">
                    {request.necesidad && (
                      <div className="field-group">
                        <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                          Necesidad / Reto a Resolver
                        </div>
                        <div className="prose-block text-foreground whitespace-pre-wrap">{request.necesidad}</div>
                      </div>
                    )}
                    {request.competencias && (
                      <div className="field-group">
                        <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                          Competencias a Desarrollar
                        </div>
                        <div className="prose-block text-foreground whitespace-pre-wrap">{request.competencias}</div>
                      </div>
                    )}
                    {request.resultados && (
                      <div className="field-group">
                        <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                          Resultados y Entregables Esperados
                        </div>
                        <div className="prose-block text-foreground whitespace-pre-wrap">{request.resultados}</div>
                      </div>
                    )}
                    {request.exito && (
                      <div className="field-group">
                        <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                          Criterios de Éxito de la Empresa
                        </div>
                        <div className="prose-block text-foreground whitespace-pre-wrap">{request.exito}</div>
                      </div>
                    )}
                    {!hasDiagnostic && (
                      <div className="text-muted-foreground italic text-xs">
                        Información de diagnóstico y objetivos pedagógicos en concertación con el cliente.
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOQUE 5: LOGÍSTICA Y ANTECEDENTES */}
                <div className="section-card border border-border/80 rounded-md p-3.5 bg-muted/20">
                  <h2 className="section-title text-xs font-bold text-icesi-blue uppercase tracking-wide border-b border-border/60 pb-1 mb-2.5">
                    5. Requerimientos Logísticos y Antecedentes
                  </h2>
                  <div className="grid-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="field-group">
                      <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                        Requerimiento de Catering / Alimentación
                      </div>
                      <div className="field-value font-medium text-foreground">
                        {request.alimentacion && request.alimentacion.toLowerCase() !== "no"
                          ? request.alimentacion
                          : "No requiere servicio de alimentación"}
                      </div>
                    </div>
                    <div className="field-group">
                      <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                        Formación Previa en la Empresa
                      </div>
                      <div className="field-value font-medium text-foreground">
                        {request.formacionPrevia === "Sí"
                          ? `Sí${request.descFormacion ? ` — ${request.descFormacion}` : ""}${request.empresaPrevia ? ` (Proveedor: ${request.empresaPrevia})` : ""}`
                          : "Sin registro de capacitaciones previas"}
                      </div>
                    </div>
                    {request.observaciones && (
                      <div className="field-group sm:col-span-2 pt-1">
                        <div className="field-label text-[10px] font-bold uppercase text-muted-foreground">
                          Observaciones Adicionales
                        </div>
                        <div className="prose-block text-foreground whitespace-pre-wrap">{request.observaciones}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOQUE 6: ARCHIVOS DE SOPORTE VINCULADOS */}
                {hasDocuments && (
                  <div className="section-card border border-border/80 rounded-md p-3.5 bg-muted/20">
                    <h2 className="section-title text-xs font-bold text-icesi-blue uppercase tracking-wide border-b border-border/60 pb-1 mb-2.5">
                      6. Documentos de Soporte Vinculados ({documents.length})
                    </h2>
                    <ul className="divide-y divide-border/60 text-xs">
                      {documents.map((doc) => (
                        <li key={doc.id} className="py-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            {getDocIcon(doc.type)}
                            <span className="font-medium text-foreground truncate">{doc.name}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0 uppercase">{doc.type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* PIE INSTITUCIONAL */}
                <div className="footer-note pt-3 border-t border-border/60 text-center text-[10px] text-muted-foreground">
                  Documento académico emitido por el Sistema de Solicitudes Comerciales de la Universidad Icesi para la
                  preparación pedagógica del docente. Confidencial y de uso exclusivo interno.
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: ARCHIVOS DE SOPORTE PARA DESCARGA */}
            <TabsContent value="adjuntos" className="mt-0 focus-visible:outline-none">
              <div className="rounded-lg border border-border bg-card p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Documentos Adjuntos de la Propuesta</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Archivos de especificaciones técnicas, términos de referencia y anexos para el profesor
                    </p>
                  </div>
                  {hasDocuments && (
                    <Button
                      size="sm"
                      onClick={handleDownloadAll}
                      className="h-8 px-3 text-xs font-semibold inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Descargar Todo ({documents.length})</span>
                    </Button>
                  )}
                </div>

                {!hasDocuments ? (
                  <div className="py-12 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">No hay archivos adjuntos en esta propuesta</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Si el cliente o el KAM proporcionan términos de referencia adicionales, se mostrarán aquí para su
                      descarga directa.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 divide-y divide-border">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 hover:bg-muted/30 px-2 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-md bg-muted/60 shrink-0">{getDocIcon(doc.type)}</div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{doc.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {doc.type.toUpperCase()} {doc.size ? `· ${doc.size}` : ""}{" "}
                              {doc.date ? `· ${doc.date}` : ""}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownloadDocument && onDownloadDocument(doc)}
                          className="h-8 px-3 text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 self-end sm:self-auto"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Descargar</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
