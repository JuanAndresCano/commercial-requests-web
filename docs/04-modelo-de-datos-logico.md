# Modelo de datos lógico (del prototipo)

> ⚠️ **Esto no es un esquema de producción.** Es la estructura de datos *implícita* en el prototipo (`src/lib/mock-data.ts` + `src/context/AuthContext.tsx`), que vive en memoria/`localStorage` sin backend real. Se documenta para **no perder reglas de negocio ya validadas** (cálculos, campos obligatorios vs. opcionales, relaciones) cuando se diseñe el modelo de datos definitivo en el entorno de desarrollo real.

## Entidad principal: `RequestItem` (la "solicitud comercial")

```ts
interface RequestItem {
  id: string;                    // formato "REQ-2026-NNNN", autogenerado secuencialmente
  title: string;                 // título comercial de la propuesta
  applicant: string;             // nombre del solicitante/contacto en la empresa cliente
  type: RequestType;              // "Capacitación" | "Consultoría" | "Mentoría" | "Investigación" | "Proyectos Especiales (Eventos)" | "Otro"
  createdAt: string;             // ISO date
  deadline?: string;             // ISO date, opcional
  status: RequestStatus;         // "nueva" | "en-experto" | "en-costeo" | "entregada"
  urgency: Urgency;               // "alta" | "media" | "baja"
  company: string;               // nombre de la empresa cliente (texto libre, no FK estricta)
  node: string;                  // nodo temático (texto libre desde la lista NODES, o "Por definir")
  productLeader: string;         // nombre del Líder de Producto responsable
  kam: string;                   // nombre del KAM responsable
  professor?: string;            // nombre del docente/experto asignado
  professorType?: "planta" | "externo";
  externalProfessorData?: ExternalProfessorData;  // solo si professorType === "externo"
  totalCostCop?: number;         // espejo de costing.totalOfferedCop, mantenido en sync
  costing?: ProposalCosting;
  clientKamDocuments?: ProposalDocument[];
  internalCostingDocuments?: ProposalDocument[];
}
```

**Notas de diseño importantes:**
- `company`, `node`, `productLeader`, `kam`, `professor` son **strings libres**, no referencias a IDs de otras entidades — en el prototipo no hay una tabla real de "usuarios" o "empresas" con relación referencial, son listas fijas (`KAMS`, `PRODUCT_LEADERS`, `MOCK_COMPANIES`, `NODES`) usadas como opciones de formulario. En un modelo de producción esto debería normalizarse (FKs reales a tablas de usuarios/empresas).
- `id` se genera como `REQ-2026-${requests.length + 145}` — es un contador local ingenuo, **no apto para producción** (colisiones, no es secuencial real, año hardcodeado).

## `ProposalCosting` (costeo financiero — subdocumento de `RequestItem`)

```ts
interface ProposalCosting {
  requiresExternalAdvisor: boolean;
  externalAdvisorDetails?: string;
  baseCostCop: number;             // Costo Base Directo, ingresado manualmente
  expectedMarginPercent: number;   // ej. 30 (= 30%)
  proCulturaTaxPercent: number;    // 1.5 si type === "Capacitación", si no 0
  proCulturaTaxAmount: number;     // baseCostCop * 0.015 (redondeado), si aplica
  suggestedTotalCop: number;       // baseCostCop + margen + estampilla (redondeado)
  totalOfferedCop: number;         // valor final mostrado al cliente — editable, default = suggestedTotalCop
  negotiationNotes?: string;
}
```

**Fórmula de cálculo** (función `calculateCosting` en `mock-data.ts`, replicada también dentro de `ProposalCostingModule.tsx`):

```
esCapacitación      = type === "Capacitación"
proCulturaTaxPercent = esCapacitación ? 1.5 : 0
montoMargen          = baseCostCop * (expectedMarginPercent / 100)
proCulturaTaxAmount  = esCapacitación ? round(baseCostCop * 0.015) : 0
suggestedTotalCop    = round(baseCostCop + montoMargen + proCulturaTaxAmount)
totalOfferedCop      = customOffered ?? suggestedTotalCop   // el usuario puede sobreescribir
```

## `ExternalProfessorData` (ficha del consultor externo)

```ts
interface ExternalProfessorData {
  nombre: string;                 // obligatorio
  identificacion?: string;        // cédula/pasaporte/NIT
  empresaConsultora?: string;     // firma o institución
  correo?: string;
  telefono?: string;
  perfil?: string;                // descripción de especialidad/experiencia
}
```

## `ProposalDocument` (documento adjunto)

```ts
interface ProposalDocument {
  id: string;
  name: string;
  size: string;                   // texto formateado, ej. "2.4 MB" (no bytes numéricos)
  date: string;                   // texto formateado dd/mm/aaaa
  type: "pdf" | "doc" | "excel" | "sheet" | "archive";
  category: "client_kam" | "internal_costing";
  uploadedBy?: string;
  tag?: string;                   // ej. "Matriz de Costeo", "Cronograma Detallado", "Contrato"
}
```

Nota: en el prototipo, subir un archivo probablemente no persiste el binario real (revisar `ProposalDocumentsSection.tsx` si se retoma esa pieza) — es una simulación de metadata.

## `CompanyRecord` (directorio de empresas con convenio, usado para autocompletar)

```ts
interface CompanyRecord {
  nit: string;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  ciiuPrincipal: string;           // código CIIU (clasificación de actividad económica, Colombia)
  ciiuDescripcion?: string;
  web?: string;
  tipoEmpresa?: string;            // "Pública" | "Privada" | "Mixta" | "Sin ánimo de lucro"
}
```

Poblado con 9 empresas reales de referencia (Icesi, Bancolombia, Carvajal, Manuelita, Colombina, Tecnoquímicas, Grupo Nutresa, Grupo Éxito, Gases de Occidente).

## `User` (sesión activa — sin autenticación real)

```ts
type UserRole = "kam" | "lider-nodo" | "lider-producto" | "profesor";

interface User {
  role: UserRole;
  roleLabel: string;    // etiqueta legible, ej. "Líder de Producto"
  name: string;
  email: string;
  node?: string;        // solo para lider-producto y lider-nodo
}
```

## Listas/enumeraciones de referencia (todas en `mock-data.ts`)

| Constante | Contenido |
|---|---|
| `REQUEST_TYPES` | Los 6 tipos de servicio (ver `01-negocio-y-dominio.md`) |
| `NODES` | Los 5 nodos temáticos |
| `KAMS` | 4 KAMs: Andrea Martínez, Carlos Riveros, Diana Salcedo, Felipe Ortiz |
| `PRODUCT_LEADERS` | 6 líderes de producto |
| `PROFESSORS` | Lista corta de referencia (la lista real usada en el modal de asignación es `ICESI_FACULTY`, definida aparte en `AdvisorAssignmentModal.tsx` con 6 profesores + departamento + correo) |
| `NODE_DEFAULT_LEADERS` | Mapeo Nodo → Líder de Producto sugerido |
| `STATUS_META` | Metadata visual (label, clases de color Tailwind) por cada `RequestStatus` |
| `URGENCY_META` | Metadata visual por cada `Urgency` |

## Funciones utilitarias relevantes

- `formatCop(amount)` — formatea a moneda colombiana (`Intl.NumberFormat("es-CO", { currency: "COP" })`), sin decimales.
- `formatCompactCop(amount)` — versión compacta para KPIs grandes, ej. `"$ 18.4M COP"`.
- `getRelativeTime(id)` — **hardcodeado por ID de solicitud específico** (no es un cálculo real de tiempo transcurrido), usado solo en `KamCommandCenter`. No replicar este patrón — en producción debe ser un cálculo real sobre `createdAt`.

## Persistencia actual (solo prototipo)

`AuthContext.tsx` guarda todo en `localStorage` bajo dos llaves: `icesi_auth_user_v3` (usuario/rol activo) e `icesi_requests_data_v3` (arreglo completo de solicitudes). Al cargar, hace un merge entre lo guardado y `MOCK_REQUESTS` (para no perder solicitudes semilla nuevas si se actualiza el código). **Este mecanismo desaparece por completo al migrar a un backend real** — se documenta solo para entender que hoy no hay noción de sesión multiusuario ni concurrencia.
