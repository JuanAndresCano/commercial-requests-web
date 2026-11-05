# Sustentación de Métricas, Racional Analítico y Criterios de Inclusión/Exclusión
**Plataforma de Gestión de Solicitudes Comerciales y Consultoría — Universidad Icesi**  
**Versión:** 1.0 (Entorno UAT — Next.js 16)  
**Audiencia:** Equipo de Grado, Dirección de Consultoría y Educación Continua, Evaluadores UAT  

---

## 1. Filosofía de Diseño: "Métricas de Acción vs. Métricas de Adorno"

El diseño de visualización de datos de la plataforma se rige por un principio de ingeniería y gestión de operaciones: **cada dato en pantalla debe responder a una decisión concreta de negocio**. Si un indicador no altera el comportamiento, no alerta un riesgo o no respalda una decisión estratégica, se clasifica como *ruido visual* y se excluye deliberadamente.

Para evitar el antipatrón de *overkill* (saturación de gráficos que nadie interpreta), la plataforma divide la analítica en una **Pirámide de Decisión de 3 Capas**:

```
                       PIRÁMIDE DE DECISIÓN POR ROL
                                  
                                    ▲
                                   / \
                                  /   \
                                 /  1  \   CAPA ESTRATÉGICA (ADMINISTRADOR)
                                /       \  Visión macro, capital, metas y cuentas 360°
                               /─────────\
                              /     2     \  CAPA COMERCIAL (KAM)
                             /             \ Gestión diaria de cartera y entregas al cliente
                            /───────────────\
                           /        3        \  CAPA OPERATIVA/ACADÉMICA (LÍDER DE PRODUCTO)
                          /                   \ Asignación docente, costeo y fechas límite
                         /─────────────────────\
```

---

## 2. Módulo de Administrador (Rectoría, Vicerrectoría, Dirección)

El Administrador evalúa dos niveles: el **rendimiento macro de la universidad** y la **profundidad de relación con empresas aliadas**.

### 2.1. Panel Resumen Ejecutivo Macro (`/dashboard`)

| Métrica / Visualización | Qué Muestra | Por qué se Incluyó (Racional de Negocio) | Decisión que Detona |
|---|---|---|---|
| **Selector Año + Trimestre** | Corte temporal dinámico (Todo el año, Q1–Q4). | Icesi opera por cierres fiscales y presupuestales trimestrales. Los KPIs deben reflejar la estacionalidad del sector corporativo. | Comparar cumplimiento contra la meta presupuestal del corte. |
| **Total Entregado ($ COP)** | Facturación real de propuestas en estado `DELIVERED`. | Es la **cifra reina de recaudo**: representa dinero cerrado, formalizado y con propuesta aceptada/facturable. | Celebrar cierres, evaluar flujo de caja entrante y cumplimiento de metas. |
| **Tubería Activa ($ COP)** | Dinero en juego en solicitudes en trámite (`NEW`, `IN_PROGRESS`, `IN_COSTING`). | Mide el **combustible comercial**: cuánto dinero potencial se está cotizando actualmente en el mercado. | Anticipar ingresos futuros y exigir aceleración si la tubería es baja. |
| **Volumen del Portafolio ($ COP)** | Suma exacta de Entregado + Tubería Activa. | Tamaño total de la demanda empresarial captada por Icesi en el periodo evaluado. | Medir la tracción institucional y el tamaño de mercado atendido. |
| **Ciclo Promedio de Cierre** | Días calendario promedio desde la creación de la solicitud hasta su entrega final. | Evalúa la **agilidad institucional**: una universidad suele ser percibida como lenta; medir este ciclo asegura competitividad. | Si sube de 20 días, intervenir procesos de costeo o asignación docente. |
| **Tasa de Conversión (Win Rate)** | % de propuestas entregadas frente al universo total gestionado. | Mide la **efectividad de cierre**: no basta con crear solicitudes; importa cuántas llegan a término exitoso. | Auditar si se están cualificando bien las oportunidades comerciales. |
| **Embudo de Conversión (Funnel)** | Conteo, $ COP y % en las 5 etapas secuenciales (`Nueva` → `Experto` → `Costeo` → `Lista` → `Entregada`). | **Detección instantánea de cuellos de botella.** Visibiliza en qué etapa se "atasca" el dinero de la universidad. | Si hay $600M en *En costeo*, reforzar al equipo financiero para destrabar entregas. |
| **Ranking Comercial de KAMs** | Tabla de ejecutivos con propuestas, tubería y facturación cerrada. | **Gobierno y balance de cargas:** identifica cerradores estrella y asesores que requieren apoyo o redistribución de cuentas. | Equilibrar asignación de empresas grandes y premiar desempeño comercial. |
| **Distribución por Nodos** | % y montos captados por cada centro temático (*IA*, *Innovación*, *Ciberseguridad*, etc.). | **Estrategia académica interdisciplinaria:** revela qué facultades son demandadas y cuáles están desconectadas del sector real. | Diseñar nuevos programas o capacitar al equipo de ventas en nodos rezagados. |

---

### 2.2. Inteligencia de Cuenta y Trayectoria 360° (`/dashboard?tab=empresas`)

| Métrica / Sección | Qué Muestra | Racional de Negocio | Decisión que Detona |
|---|---|---|---|
| **Ficha Corporativa y Contactos** | NIT, sector, tamaño, CIIU, canales web y contrapartes (nombre, cargo, teléfono, email). | Preparación ejecutiva en 1 minuto antes de comités directivos o reuniones con presidentes de compañía. | Identificar a los tomadores de decisión reales en la empresa aliada. |
| **KPIs de Cuenta** | Total entregado, tubería, horas de intervención y participantes capacitados. | Demostrar el **retorno social y académico** de la alianza, más allá del dinero. | Argumentar en negociaciones de convenios marco de largo plazo. |
| **Línea de Tiempo Cronológica** | Cada propuesta histórica ordenada por fecha, código clickeable, estado, equipo y docente asignado. | **Trazabilidad absoluta:** no hay "cajas negras". Se sabe qué profesor dictó qué tema, con qué KAM y bajo qué líder. | Auditar reclamos de clientes o verificar antecedentes de cotización. |
| **Mix de Portafolio por Servicio** | Porcentaje y $ COP por línea (*Capacitación Corporativa* vs. *Consultoría Especializada* vs. *Mentoría*). | Identifica la **madurez de compra del cliente**: si una empresa solo compra capacitación básica, hay oportunidad de ofrecer consultoría. | **Cross-selling y Up-selling:** abrir nuevas líneas de servicio en la cuenta. |
| **Salud y Gestión de la Cuenta** | Ticket promedio por propuesta ($ COP), vigencia temporal (*primer y último contacto*) y chips de KAMs asignados. | Mide el **Customer Lifetime Value (LTV)** y la estabilidad de la relación a lo largo de los años. | Detectar si la cuenta está en riesgo de abandono (último contacto lejano). |
| **Penetración por Nodo Académico** | Participación de los centros de conocimiento de Icesi en las compras de la empresa. | Revela el cross-selling interdisciplinario (ej. Bancolombia no solo compra Finanzas, ahora compra Ciberseguridad e IA). | Coordinar alianzas con decanaturas que aún no tienen presencia en el cliente. |

---

### 2.3. ¿Por qué se EXCLUYERON deliberadamente otras métricas en Admin?

1. **Margen de Contribución por Propuesta en la Vista Macro:**
   - *Por qué se omitió:* El Administrador no debe micro-gestionar si una propuesta específica tuvo 42% o 45% de margen; esa es función del Líder de Producto al costear. En el macro interesa el volumen y el recaudo general.
2. **Nube de 40 Chips de Competencias y Temarios ("Cadena de custodia", "Acuerdos de nivel"):**
   - *Por qué se eliminó:* Era ruido visual extraído mecánicamente de los programas que descontextualizaba la cuenta. Un Director no decide convenios leyendo 40 palabras sueltas; decide viendo si le compran Consultoría o Capacitación (**Mix de Portafolio**) y cuánto factura en promedio (**Ticket Promedio**).
3. **Métricas de Satisfacción (CSAT/NPS) en este Tablero:**
   - *Por qué se omitió:* El alcance de este sistema es el **ciclo comercial y de diseño de propuestas** (hasta la entrega formal de la cotización). La evaluación pos-ejecución del servicio corresponde a encuestas académicas posteriores.

---

## 3. Módulo de KAM (Gestión de Cartera Comercial)

El KAM es el dueño del cliente; su jornada de trabajo se centra en la **velocidad de respuesta y en no dejar enfriar oportunidades**.

| Métrica / Elemento | Qué Muestra | Racional de Negocio | Decisión que Detona |
|---|---|---|---|
| **Aislamiento de Cartera Propia** | El KAM solo ve sus propias propuestas; no ve las de sus pares. | Privacidad comercial, foco personal y prevención de interferencia entre ejecutivos. | Enfocarse 100% en sus metas individuales sin distracciones. |
| **Tarjetas KPI por Etapa** | Conteo de propuestas y valor acumulado en *Nueva*, *En experto*, *Lista para entrega* y *Entregada*. | Conocer el valor en juego en cada fase de su cartera personal. | Saber si su meta del mes depende de 2 propuestas grandes o de 10 pequeñas. |
| **Promesa "Lista para Entrega"** | Cuenta únicamente las propuestas con costeo completado y confirmado por el Líder de Producto. | Evita que el KAM entregue al cliente un borrador incompleto o sin aval financiero del líder académico. | **Acción inmediata:** descargar la propuesta oficial y remitirla formalmente al cliente. |
| **Envejecimiento por Etapa (Aging)** | Etiqueta en tarjeta: *"Hace X días en esta etapa • Y días en total"*. | Monitoreo de SLAs de atención interna. | Presionar al Líder de Producto si una propuesta lleva más de 5 días sin docente. |
| **Número Oficial de Cotización** | Código `CP 2026-XXXX` visible en tarjetas entregadas. | Número formal con el que la empresa aliada registra la orden de compra o el contrato. | Facturación y radicación formal ante el cliente. |

### ¿Por qué se EXCLUYERON deliberadamente otras métricas en KAM?
- **Costos Base y Tarifas de Profesores:** Por política institucional y confidencialidad, el KAM conoce el *Valor Total Ofertado* al cliente y la *Nota de Alcance*, pero **no ve el desglose interno de honorarios docentes ni costos operativos**.
- **Tasa de Conversión Global de la Universidad:** Al KAM le genera distracción saber cómo le va a toda la facultad; necesita saber qué llamadas y propuestas debe gestionar hoy.

---

## 4. Módulo de Líder de Producto / Nodo (Capacidad y Operación Académica)

El Líder de Producto (rol en el que confluyen operativamente las responsabilidades temáticas y de nodo) gestiona la **fábrica académica**: calidad del diseño curricular, asignación de expertos idóneos y viabilidad financiera.

| Métrica / Elemento | Qué Muestra | Racional de Negocio | Decisión que Detona |
|---|---|---|---|
| **5 Etapas Operativas** | *Nueva*, *En experto*, *En costeo*, *Enviada al KAM*, *Entregada*. | Desglosa el trabajo técnico real. La etapa *Enviada al KAM* le permite saber que su labor técnica terminó y la pelota está en la cancha comercial. | Coordinar con el KAM o revisar propuestas pendientes de su lado. |
| **Alertas de Fecha Límite de Entrega** | Color según urgencia: Rojo (Vencida), Naranja (Vence en $\le$ 3 días), Gris (En plazo). | Cumplir el compromiso acordado con el cliente empresarial. | Priorizar costeos urgentes sobre propuestas con margen de tiempo. |
| **Filtro Rápido "Sin Docente"** | Botón de un solo clic que aísla propuestas sin profesor asignado. | El mayor cuello de botella en educación continua es conseguir al experto temático. | Entrar de inmediato a buscar en el directorio o contactar a un consultor externo. |
| **Filtro "Esperando al KAM"** | Aísla solicitudes costeadas que el KAM aún no ha radicado al cliente. | Evita que se culpe al área académica por retrasos que ya son de gestión comercial. | Enviar recordatorio al KAM para que envíe la cotización al cliente. |
| **Aislamiento de Columna (Focus Mode)** | Al hacer clic en un KPI de etapa en Kanban, expande esa columna a pantalla completa. | Cuando un Líder gestiona 30 solicitudes, ver todas las columnas genera fatiga visual. | Trabajar concentrado en la etapa de costeo o asignación. |

---

## 5. Matriz de Auditoría y Trazabilidad (Drill-Down)

Todas las métricas de la plataforma están conectadas con el nivel de detalle transaccional:

```
[Macro KPI / Funnel / Ranking / Timeline]
                  │
                  ▼ (1 clic)
    [/solicitudes/:id - Expediente Completo]
    ├── Hoja de Costeo Financiero
    ├── Ficha del Docente / Experto Asignado
    ├── Documentos y Adjuntos Técnicos
    ├── Bitácora de Negociación y Retornos
    └── Historial de Auditoría de Cambios
```

Ninguna cifra es una estimación estática ni un dato aislado.

---

## 6. Guía Rápida para la Defensa en Sesiones UAT

Al presentar esta solución a evaluadores o directores en las pruebas UAT, utiliza esta estructura de argumentación:

1. **Si preguntan: "¿Por qué el Administrador no ve el margen de cada propuesta en la tabla de inicio?"**
   - *Respuesta:* Porque la pantalla principal es de dirección estratégica, no de costeo micro. El Administrador puede auditar el margen de cualquier propuesta con un solo clic en su código, pero la vista general prioriza el recaudo total y los cuellos de botella.
2. **Si preguntan: "¿Por qué quitamos la lista larga de habilidades y competencias en la empresa?"**
   - *Respuesta:* Porque una lista de 40 palabras descontextualizadas (*"cadena de custodia"*, *"acuerdos de nivel"*) no aporta valor directivo. Lo que define la estrategia con un cliente es el **Mix de Portafolio** (saber si nos compran 80% Capacitación y 20% Consultoría) y el **Ticket Promedio**.
3. **Si preguntan: "¿Cómo sabe el KAM cuándo una propuesta está lista?"**
   - *Respuesta:* La tarjeta KPI "Listas para entrega" y la columna del Kanban solo se activan cuando el Líder de Producto confirma formalmente el costeo, protegiendo a la universidad de enviar cotizaciones preliminares sin validación.
