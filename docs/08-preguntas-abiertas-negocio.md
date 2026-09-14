# Preguntas abiertas para validar con Líder de Producto

Este documento acumula preguntas de negocio/UX que van surgiendo mientras se
construye el prototipo, y que **no puede responder el equipo de diseño/desarrollo
por su cuenta** — necesitan una decisión de producto o de la Líder de Producto.

No es documentación técnica del sistema (eso vive en `01-07`); es una bitácora
de trabajo que se va llenando y respondiendo con el tiempo.

**Cómo usarlo:** cada pregunta tiene contexto (qué hace hoy el prototipo y por
qué surgió la duda) y, cuando aplica, opciones ya evaluadas. Al responderla,
se actualiza el campo **Estado** con la fecha y la decisión tomada.

---

## 1. ¿El KAM debe ver solo sus propias solicitudes, o también las del equipo?

**Estado:** 🔴 Abierta

**Contexto:** Hoy la pantalla única "Solicitudes" del KAM tiene un toggle
**"Mis Solicitudes / Todas"**, por defecto en "Mis Solicitudes". Como los KAMs
son vendedores (cada uno gestiona su propia cartera de clientes/empresas), cabe
preguntarse si tiene sentido que un KAM pueda ver el pipeline comercial de sus
compañeros.

**Opciones evaluadas:**
- **(a)** Restringir por completo: el KAM solo puede ver sus propias solicitudes,
  se elimina la opción "Todas".
- **(b)** Dejarlo como está hoy (toggle con default en "Mis", pero con acceso a
  "Todas" si lo necesita).
- **(c)** Mantener visibilidad total pero justificada por un caso de uso concreto
  (ej. cubrir a un compañero ausente, ver carga de trabajo del equipo).

**Por qué importa:** si la respuesta es (a), hay que quitar el toggle y filtrar
los datos también a nivel de acceso, no solo de UI. Si es (b) o (c), se queda
como está y solo se documenta la razón de negocio.

---

## 2. ¿Qué información mínima necesita ver el KAM en el detalle de una propuesta?

**Estado:** 🔴 Abierta

**Contexto:** Hoy el detalle de una solicitud (`/solicitudes/:id`) le muestra al
KAM, entre otras cosas:

- Valor Total Ofertado (COP)
- Costo Base Directo
- Margen de Contribución (%)
- Estampilla Pro-Cultura (1.5%, solo si el tipo es "Capacitación")
- Nota de alcance comercial agregada por el Líder
- Documento de Propuesta Comercial final (PDF)
- Especificaciones del servicio (dedicación, modalidad, participantes, tipo,
  fecha de entrega esperada)
- Equipo asignado (Nodo Temático, Líder de Producto, KAM responsable, Docente/Asesor)

**Pregunta para la Líder de Producto:** de esa lista, ¿cuál es el mínimo
necesario para que el KAM haga su trabajo (vender y cerrar), y qué le sobra o
incluso le puede generar confusión/fricción?

**Por qué importa:** define qué se queda, qué se oculta y qué eventualmente se
resume de otra forma (ver pregunta 3, que ya tiene una respuesta parcial).

---

## 3. Margen de contribución y sus derivados: ¿el KAM no debería verlos?

**Estado:** 🟡 Parcialmente respondida — falta confirmar alcance exacto

**Contexto:** La Líder de Producto comentó que el KAM **no debería ver el
margen de contribución** ni sus valores derivados (costo base directo,
estampilla pro-cultura), ya que el costeo es responsabilidad exclusiva del
Líder de Producto — no tendría sentido comercial que el KAM viera esa
desagregación interna.

Sin embargo, **hoy el prototipo sí se lo muestra explícitamente** al KAM en el
detalle de la solicitud, en un bloque de 3 tarjetas: "Costo Base Directo",
"Margen de Contribución (30%)" y "Estampilla Pro-Cultura (1.5%)" — justo debajo
del "Valor Total Ofertado".

**Dirección que ya tenemos clara:** ocultar esos 3 valores para el rol KAM y
dejar visible únicamente el **Valor Total Ofertado** (que es lo que de verdad
necesita para cotizar al cliente).

**Lo que falta confirmar con la Líder:**
- ¿Se oculta el bloque completo (los 3 valores) o hay alguno que sí quiera
  dejar visible?
- ¿Aplica en todos los estados de la solicitud, incluyendo cuando todavía está
  "en costeo" y el valor final aún no está definido? ¿O ahí no debería verse
  nada de la sección económica todavía?
- ¿La nota de alcance comercial ("Nota de alcance comercial agregada por el
  Líder") se mantiene visible para el KAM, o también es información interna?

---

## 4. El estado "En proceso por experto": ¿el "experto" es el rol Profesor/Asesor?

**Estado:** 🔴 Abierta

**Contexto:** El pipeline de una solicitud tiene 4 estados: Nueva → **En proceso
por experto** → En proceso de costeo → Entregada. Revisando el tablero del
Líder de Producto, ese segundo estado corresponde exactamente a la fase donde
se asigna un **Docente/Asesor** (`req.professor`) que "formula la temática,
cronograma y propuesta técnica" antes de que el Líder de Producto arme el
costeo — es decir, el "experto" del nombre del estado sí parece ser el rol
**Profesor**.

Hoy, en la práctica, el Profesor **no participa en la aplicación**: es el
Líder de Producto quien, desde su tablero, hace clic en "Pasar a Experto" y
luego en "Pasar a Costeo" — asumiendo que coordinó con el docente por fuera de
la app (llamada, correo, etc.) y avanza el estado manualmente en su nombre.

**Pregunta para la Líder de Producto:**
- ¿Es correcto que, por ahora, el Profesor no necesita cuenta ni acceso propio,
  y el Líder de Producto simplemente refleja manualmente en la app lo que el
  docente le confirma por fuera? ¿O en algún momento cercano el Profesor sí
  debería tener su propio login para, por ejemplo, subir directamente su
  propuesta técnica?
- Si la respuesta es "por ahora no", ¿el nombre del estado ("En proceso por
  experto") sigue siendo el más claro para el Líder de Producto, o conviene
  algo que no insinúe que hay otro rol activo en el sistema (ej. "En diseño
  técnico")?

**Por qué importa:** el alcance actual del proyecto es explícitamente KAM +
Líder de Producto. Si el Profesor eventualmente necesita entrar a la app, es
un tercer rol a diseñar — mejor saberlo ahora que a mitad de la fase de
Líder de Producto.

---

## 5. ¿El Líder de Producto puede editar las Especificaciones del Servicio una vez tenga la info real?

**Estado:** 🟢 Resuelta — la Líder confirmó que sí, ya implementado

**Contexto:** La tarjeta "Especificaciones del Servicio" (dedicación estimada,
modalidad, participantes, tipo de servicio, entrega esperada) se llena con lo
que el KAM diligencia en el wizard de creación — son estimados iniciales del
KAM, no datos confirmados con el cliente.

**Respuesta de la Líder:** sí, necesita poder corregir esos campos cuando el
KAM diligenció el formulario de forma incorrecta.

**Implementado:** ahora hay un botón "Editar" en esa tarjeta, visible solo
para el Líder de Producto, que permite corregir los 5 campos (sobrescribe el
valor del KAM directamente — no se guarda un historial de "antes/después" por
ahora, ya que no se pidió esa trazabilidad).

---

## 6. Reasignar a otro Líder: ¿solo mientras la solicitud sigue "Nueva"?

**Estado:** 🟡 Implementado bajo este supuesto — falta que la Líder lo confirme

**Contexto:** Antes, cualquier solicitud se podía reasignar a otro Líder de
Producto sin importar en qué estado estuviera — lo cual no tenía mucho sentido:
si un Líder ya avanzó el trabajo (asignó docente, costeó, etc.), reasignarla
después le quita a otro compañero un trabajo que no le correspondía y descarta
el avance ya hecho.

**Cambio ya implementado:** el botón "Reasignar" (en el tablero y en el
detalle) ahora solo aparece mientras la solicitud está en estado **Nueva** —
es decir, apenas llega, antes de que cualquier Líder haya empezado a
trabajarla. Una vez pasa a "En proceso por experto" o más adelante, ya no se
puede reasignar desde la interfaz.

**Para confirmar con la Líder:** ¿es correcto este límite, o hay un caso real
donde necesite reasignar una solicitud que ya está más avanzada en el proceso
(ej. se fue de vacaciones, cambió de nodo)? Si existe ese caso, habría que
pensar en un flujo distinto (quizás con aprobación) en vez de simplemente
ocultar el botón.

---

## 7. El costeo debe empezar vacío — el KAM nunca debe fijar un precio

**Estado:** 🟡 Implementado — falta que la Líder confirme que el flujo resultante es el correcto

**Contexto:** Se encontró un bug de fondo: **toda solicitud nueva recibía
automáticamente un costeo completo** (costo base $14.000.000 + margen 30%)
desde el instante en que el KAM la creaba — antes de que el Líder de Producto
tocara nada. Esto generaba la sensación de que "la propuesta ya viene con
precio desde el KAM", cuando se supone que **poner el precio es exactamente
el trabajo del Líder de Producto durante el costeo**.

**Cambio ya implementado:**
- Una solicitud recién creada por el KAM ya no trae ningún costeo ni precio.
- El KAM ve "Costeo en proceso" en la propuesta económica hasta que el Líder
  guarde un valor real.
- El formulario de costeo del Líder ahora arranca en blanco (no sugiere
  $14.000.000 como si fuera un punto de partida real).
- Se limpiaron los 3 registros de ejemplo en estado "Nueva" que tenían un
  precio ya puesto, para que el prototipo sea consistente con esta regla.

**Para confirmar con la Líder:** ¿el costeo se hace todo de una vez en la
fase "En proceso de costeo", o hay valores parciales que se van definiendo
antes (ej. desde que se asigna el docente)? Eso afectaría en qué momento
exacto debería aparecer el primer número, aunque el principio de fondo
("el KAM no fija precio") ya queda resuelto de cualquier forma.

---

## Confirmado e implementado en este ciclo

_(Feedback de la Líder de Producto que ya se validó contra el código y quedó
resuelto — se deja constancia para que sepa que se escuchó, sin necesidad de
una pregunta abierta.)_

- **Vista por defecto "Mis Solicitudes":** el tablero del Líder de Producto ya
  arranca filtrado a sus propias solicitudes (toggle a "Todas" si lo necesita).
- **Reasignar a otro Líder de Producto:** ya existe — botón de reasignación en
  cada tarjeta del tablero y en el detalle de la solicitud, con motivo y nota
  para el nuevo líder.
- **Un solo tablero, con los 4 estados correctos:** el tablero unificado ya
  usa exactamente Nueva / En proceso por experto / En proceso de costeo /
  Entregada (no "Borrador" ni "Lista para entregar", que eran de una versión
  anterior). Se corrigió una inconsistencia menor donde los títulos de las
  columnas decían "En Experto"/"En Costeo" en vez del nombre completo.
- **Valor real de lo entregado:** la tarjeta "Entregadas" del tablero ahora
  muestra, además del conteo, la suma del valor ofertado de esas propuestas.
- **Navegación consolidada a 1 solo tablero:** se quitaron "Inicio" y "Asignar
  docentes" del menú del Líder de Producto (llevaban al tablero genérico
  viejo, duplicado). Queda un único ítem "Solicitudes" con un filtro rápido
  "Sin docente" integrado en el mismo tablero, para no perder ese acceso directo.
- **Vista Kanban + Tabla:** el tablero del Líder de Producto ahora tiene el
  mismo toggle que el del KAM — Kanban (agrupado por estado) y Tabla (todo el
  listado, más rápido de escanear), sobre el mismo dataset filtrado.
- **Se eliminó la pantalla "Resumen"** (`/solicitudes/:id/resumen`): mostraba
  siempre los mismos datos de ejemplo sin importar la solicitud real (nombre
  de contacto, empresa, horas, todo fijo en el código). Ahora solo existen 2
  pantallas por solicitud: el tablero y el detalle — que ya muestra la
  información real.
- **"Mis Solicitudes" ya no es un toggle, es lo único que existe:** se quitó
  la opción "Todas" del tablero del Líder de Producto — solo ve sus propias
  solicitudes, sin excepción.
- **Saludo personalizado:** el tablero del Líder de Producto ahora saluda
  "Hola, [Nombre]" igual que el del KAM (antes decía "Tablero de Solicitudes
  · Líder de Producto").
- **Se quitaron las etiquetas "Azul Icesi / Naranja Icesi / Morado Icesi /
  Verde Icesi"** de las tarjetas KPI — eran nombres de color de desarrollo
  que no debían quedar visibles al usuario.
- **Se eliminó el selector "Vista: Líder de Producto | KAM"** del detalle de
  la solicitud — no era un preview visual: literalmente cambiaba el rol de la
  sesión activa al hacer clic. Quedó fuera de lugar en la pantalla de detalle.
- **Docente obligatorio para avanzar a "En proceso por experto":** el botón
  "Pasar a Experto" ahora está deshabilitado si la solicitud no tiene un
  docente asignado.

## Preguntas nuevas (sin desarrollar todavía)

_(Espacio para anotar rápido mientras surgen, antes de redactarlas con contexto completo.)_

-
