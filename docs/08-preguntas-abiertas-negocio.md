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

**Estado:** 🟢 Resuelta (2026-09-15) — implementado

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

**Respuesta de la Líder:** opción (a) — "El KAM debe de ver solo las
solicitudes de él." Confirma que cada KAM es dueño exclusivo de su propia
cartera, sin necesidad de ver el pipeline de sus compañeros.

**Implementado:** se eliminó por completo el toggle "Mis Solicitudes / Todas"
del tablero del KAM (`KamCommandCenter.tsx`) — ahora solo existe una vista,
filtrada siempre a `req.kam === user.name`. En el modelo de datos real esto
debe ser una regla de autorización a nivel de acceso, no solo de UI.

---

## 2. ¿Qué información mínima necesita ver el KAM en el detalle de una propuesta?

**Estado:** 🟢 Resuelta (2026-09-15)

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

**Respuesta de la Líder:** "En una propuesta normalmente solo ven el precio,
los colocamos así: $5.000.000 más el 1% del impuesto de procultura." Sobre el
equipo asignado: "En los documentos a veces colocamos las HV de los
profesores, pero no es necesario que conozcan el equipo desde antes. Muchas
veces un profesor nos ayuda con una propuesta, pero al momento de ejecutarlo
lo hace otro profe." Es decir:
- El KAM/cliente solo necesita el **valor total** + el cargo de procultura
  como línea aparte — confirma la dirección de la pregunta 3.
- El bloque "Equipo Asignado" (Nodo, Líder, KAM, Docente) **no es indispensable**
  para el KAM — el profesor mostrado puede no ser quien finalmente ejecute.
  No se ocultó todavía (no se pidió quitarlo, solo se aclaró que no es
  necesario) — queda como posible simplificación futura, no urgente.

⚠️ Dianis mencionó "el 1% de procultura", pero el prototipo calcula 1.5% —
ver la nota de tarifa en `04-modelo-de-datos-logico.md` y la pregunta 12
(sigue abierta) antes de cambiar el porcentaje en el código.

---

## 3. Margen de contribución y sus derivados: ¿el KAM no debería verlos?

**Estado:** 🟡 Implementado en lo esencial — quedan 2 detalles sin resolver
(la Líder no entendió la reformulación de la pregunta; hay que repreguntar
con ejemplos concretos en vez de referencias abstractas a "todos los estados")

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

**Respondido y ya implementado:** confirmado por partida doble — en la
pregunta 2 la Líder describió que al KAM/cliente solo se le muestra el precio
total + procultura. Se ocultaron del detalle del KAM las tarjetas "Costo Base
Directo" y "Margen de Contribución"; solo queda visible el Valor Total
Ofertado y, si el tipo es "Capacitación", la Estampilla Pro-Cultura.

**Sigue sin resolver (se le mostró la pregunta pero respondió "no entiendo
esto"):**
- ¿Debe ocultarse también mientras la solicitud está "en costeo" sin valor
  aún definido (hoy el KAM simplemente ve "Costeo en proceso" en ese caso,
  así que en la práctica ya no hay nada que ocultar ahí)?
- ¿La nota de alcance comercial (`negotiationNotes`) se mantiene visible para
  el KAM? Hoy sigue visible — no se tocó porque no hubo confirmación. Repreguntar
  mostrándole la pantalla real en vez de describirla por texto.

---

## 4. El estado "En proceso por experto": ¿el "experto" es el rol Profesor/Asesor?

**Estado:** 🟢 Resuelta (2026-09-15) — sin cambios de código necesarios

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

**Respuesta de la Líder:** "Son muchos profesores, y no creo que ingresen al
sistema a ver la solicitud que tienen pendiente. Por el momento, creo que nos
toca enviar a nosotros la solicitud por correo." Confirma que, por ahora, el
Profesor no necesita cuenta ni acceso propio; el Líder de Producto sigue
coordinando por fuera de la app (además de por teléfono/WhatsApp, ahora
también por correo) y reflejando el avance manualmente. No se pronunció sobre
si el nombre del estado debería cambiar — se deja igual mientras no se pida
lo contrario.

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

**Reconfirmado (2026-09-15):** "Nosotros los líderes hacemos correcciones en
la versión final. Es decir, el cliente pudo pedir algo de 50 horas, pero
nosotros les ofrecemos de 60 horas. Por eso es que pedimos que nos dejen
hacer modificaciones." Sin cambios adicionales — el comportamiento actual es
el correcto.

---

## 6. Reasignar a otro Líder: ¿solo mientras la solicitud sigue "Nueva"?

**Estado:** 🟡 Sin criterio claro — se mantiene la restricción actual hasta
que aparezca un caso concreto

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

**Respuesta de la Líder:** "Quizás todo puede pasar en la vida" — no dio un
caso concreto ni confirmó el límite explícitamente. No es un "sí" ni un "no"
claro. **Decisión:** se mantiene la restricción actual (reasignar solo en
"Nueva") porque no hay un caso de negocio específico que la contradiga — no
relajar esta regla sin uno. Si en el uso real aparece una situación concreta
(vacaciones, cambio de nodo con solicitud ya avanzada), retomar esta pregunta
con ese caso puntual en mano.

---

## 7. El costeo debe empezar vacío — el KAM nunca debe fijar un precio

**Estado:** 🟢 Resuelta (2026-09-15) — implementado y confirmado

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

**Respuesta de la Líder:** "Todo se hace en el momento del costeo" — confirma
que no hay valores parciales antes de esa fase. No se requieren cambios
adicionales al flujo actual.

---

## 8. ¿Qué más, además de "Especificaciones del Servicio", debería poder editar el Líder?

**Estado:** 🟢 Resuelta (2026-09-15) — implementado

**Contexto:** Ya se implementó (pregunta 5) que el Líder puede editar dedicación,
modalidad, participantes, tipo y fecha de entrega. Pero ahora el detalle también
muestra una sección nueva "Información completa de la solicitud" con todo lo
demás que diligenció el KAM: datos de la empresa (NIT, dirección, CIIU...),
datos del contacto, diagnóstico del requerimiento (necesidad, competencias,
resultados esperados), formación previa. **Todo eso hoy es de solo lectura.**

**Pregunta para la Líder:** si el KAM se equivoca en alguno de esos campos
(ej. el NIT, el correo del contacto), ¿quién lo corrige — el Líder, o debe
volver al KAM? Y en general: **¿el KAM puede editar su propia solicitud**
después de enviarla, mientras nadie la haya empezado a trabajar (estado
"Nueva")? Hoy no puede — una vez la envía, ni el KAM ni nadie más puede
tocar esos campos salvo el Líder en los 5 que ya mencionamos.

**Por qué importa:** esto define permisos de escritura por campo y por rol en
el modelo de datos real — no es lo mismo "todo el mundo puede editar todo
siempre" que "cada campo tiene un dueño y una ventana de tiempo para corregirlo".

**Respuesta de la Líder:** sobre quién corrige los datos de la empresa: "Esa
información de la empresa, si, solo la edite el KAM." Y sobre si el KAM puede
editar su propia solicitud mientras nadie la haya empezado a trabajar: "Sí es
viable."

**Implementado:** el KAM ahora puede editar toda la sección "Información
completa de la solicitud" (empresa, contacto, diagnóstico, formación previa,
observaciones) desde un botón "Editar", pero **solo mientras la solicitud
está en estado "Nueva" y es suya** (`req.kam === user.name`). El Líder de
Producto sigue sin poder tocar esos campos — solo edita "Especificaciones del
Servicio" (pregunta 5). Queda pendiente para una iteración futura: editar los
contactos adicionales (`additionalContacts`) y los CIIU secundarios, que hoy
quedan de solo lectura incluso en modo edición.

---

## 9. ¿Se puede corregir el precio después de marcar "Entregada"?

**Estado:** 🟢 Resuelta (2026-09-15) — es intencional, sin cambios de código

**Contexto:** Se revisó el código y **hoy nada impide seguir editando el
costeo (costo base, margen, valor ofertado) después de que la propuesta ya
se marcó como "Entregada"** — es decir, después de que (se asume) ya se le
cotizó algo al cliente.

**Pregunta para la Líder:** ¿debería bloquearse el costeo una vez entregada
(para no perder de vista qué fue exactamente lo que se le ofreció al
cliente), o es intencional poder corregirlo después (ej. si hubo un error y
se le debe reenviar una cotización corregida)?

**Por qué importa:** si se bloquea, el modelo de datos real necesita un
concepto de "versión final" del costeo protegida contra ediciones; si no se
bloquea, en algún momento se necesitará un historial de cambios para saber
qué se le mandó realmente al cliente en cada momento.

**Respuesta de la Líder:** "Está bien que no quede bloqueada. Después de
entregada podemos cambiar muchas veces el precio de una propuesta." Confirma
que es intencional — no se implementa ningún bloqueo. Si en el futuro se
necesita saber qué se le cotizó exactamente al cliente en cada momento, habrá
que agregar un historial de versiones del costeo — no es urgente hoy.

---

## 10. ¿El costeo necesita aprobación de alguien más antes de entregarse?

**Estado:** 🟢 Resuelta (2026-09-15) — sin cambios necesarios

**Contexto:** Hoy el mismo Líder de Producto que arma el precio es quien lo
aprueba y lo marca como "Entregada" — no hay ningún segundo visto bueno
(ej. de un jefe de nodo, dirección comercial, etc.) en el flujo.

**Pregunta para la Líder:** ¿así es como funciona en la realidad (autonomía
total del Líder sobre el precio), o falta un paso de aprobación antes de que
algo se considere oficialmente "Entregada"?

**Por qué importa:** si falta una aprobación, es un actor adicional y un
estado adicional ("Pendiente de aprobación") que el modelo de datos real
necesita contemplar desde el diseño, no agregar después.

**Respuesta de la Líder:** "Normalmente tenemos autonomía, cuando tenemos
duda le escribo al profe por WhatsApp. Así que dejarlo en el poder del
líder." Confirma autonomía total del Líder de Producto — no se modela ningún
estado de aprobación adicional.

---

## 11. Honorarios del asesor externo: ¿dónde entran en el costeo?

**Estado:** 🟢 Resuelta (2026-09-15) — no se necesita cambio en el modelo de datos

**Contexto:** Cuando se asigna un docente externo, hoy solo se guarda su
nombre y la empresa consultora (texto libre) — **no hay ningún campo
numérico para cuánto se le paga**. El "Costo Base Directo" del costeo es un
único número que el Líder digita a mano.

**Pregunta para la Líder:** ¿los honorarios del asesor externo se incluyen
manualmente dentro de ese "Costo Base Directo", o deberían ser un campo
separado y explícito en el costeo (para poder diferenciar costo interno vs.
pago a terceros)?

**Por qué importa:** afecta directamente la estructura de la tabla de
costeo en el modelo de datos real — un solo número vs. un desglose.

**Respuesta de la Líder:** "Ese valor va dentro del documento de costeo. No
creo necesario que lo coloquemos en la plataforma." Confirma que no se
necesita un campo estructurado para honorarios del asesor externo — se queda
documentado externamente (adjunto), no en `ProposalCosting`.

---

## 12. Estampilla Pro-Cultura y otros posibles cargos

**Estado:** 🔴 Abierta

**Contexto:** Hoy el costeo solo contempla un cargo adicional: la Estampilla
Pro-Cultura (1.5%), y únicamente para el tipo "Capacitación". Ningún otro
tipo de servicio (Consultoría, Mentoría, Investigación, Proyectos Especiales)
tiene cargos adicionales en el modelo actual.

**Pregunta para la Líder:** ¿esto es exactamente correcto, o en una
cotización real faltan otros cargos (IVA, retención en la fuente, otras
estampillas) que el prototipo no está contemplando?

**Por qué importa:** este es uno de los puntos más sensibles de cara al
modelo de datos financiero real — mejor confirmarlo ahora que después de
construido.

**Estado (2026-09-15):** sigue sin responder — se quedó fuera en la última
ronda de preguntas. Además, al responder la pregunta 2 la Líder mencionó de
pasada "el 1% de procultura" (no 1.5%, que es lo que usa el prototipo hoy).
**Repreguntar explícitamente:** (a) ¿la tarifa correcta de la estampilla es
1% o 1.5%?, y (b) ¿faltan otros cargos (IVA, retención en la fuente, otras
estampillas) en una cotización real? No cambiar la tarifa en el código hasta
tener una respuesta clara — ver nota en `04-modelo-de-datos-logico.md`.

---

## 13. ¿Qué pasa si el cliente rechaza la propuesta o pide cambios?

**Estado:** 🟢 Resuelta (2026-09-15) — implementado

**Contexto:** El pipeline actual es de una sola vía: Nueva → En proceso por
experto → En proceso de costeo → Entregada. No existe un estado de
"Rechazada", ni una forma de devolver una solicitud a una fase anterior una
vez avanzó.

**Pregunta para la Líder:** en la práctica, ¿nunca pasa que el cliente pida
ajustes después de recibir la propuesta? Si pasa, ¿ese caso se maneja
reabriendo la misma solicitud, o se crea una nueva?

**Por qué importa:** si es un caso real y frecuente, el modelo de datos
necesita soportarlo desde el inicio (estados adicionales, o una relación
entre la solicitud original y su renegociación).

**Respuesta de la Líder:** "Deberíamos de plantear que después de que le
llegue al KAM, ellos puedan volver a enviarla con observaciones la
solicitud." Confirma que sí es un caso real: el KAM debe poder devolver la
propuesta con las observaciones del cliente.

**Implementado:** se agregó el botón "Devolver con observaciones" para el KAM
cuando la solicitud está "Entregada" — al usarlo, la solicitud vuelve a "En
proceso de costeo" y la nota queda visible (para KAM y Líder) en un banner
en el detalle hasta que se vuelva a marcar "Entregada" (momento en que se
limpia). No se creó un estado "Rechazada" separado — se reutiliza el mismo
pipeline lineal (`nueva` → `en-experto` → `en-costeo` → `entregada`), ahora
con la posibilidad de retroceder de `entregada` a `en-costeo`. Si en la
práctica esto pasa muy seguido o se necesita conservar historial de cuántas
veces se devolvió una propuesta, valdría la pena revisar un modelo con
versiones/historial más adelante.

---

## 14. ¿Se puede cancelar o anular una solicitud?

**Estado:** 🟢 Resuelta (2026-09-15) — implementado

**Contexto:** Hoy no existe ninguna opción de "cancelar" o "eliminar" una
solicitud en ningún rol. Si un KAM se equivoca al crear una (ej. empresa
duplicada, datos incorrectos), la solicitud queda ahí para siempre.

**Pregunta para la Líder:** ¿se necesita esa opción, y si sí, quién debería
poder usarla — el KAM que la creó, el Líder, ambos?

**Respuesta de la Líder:** "Sería bueno dejar una opción de eliminar." No
especificó quién debería poder usarla — se asumió que es el KAM creador,
consistente con la respuesta de la pregunta 8 (el KAM es dueño de su
solicitud mientras esté "Nueva").

**Implementado:** botón "Cancelar solicitud" en el detalle, visible solo para
el KAM que la creó y solo mientras el estado es "Nueva" (antes de que el
Líder empiece a trabajarla). Al confirmar, la solicitud se **elimina por
completo** — no se modeló un estado "Cancelada" con histórico, porque no se
pidió conservar ese registro. Si el negocio real necesita auditoría de
solicitudes canceladas, esto debe revisarse antes de construir el backend
(borrado lógico vs. físico — ver nota en `04-modelo-de-datos-logico.md`).
Falta confirmar con la Líder si el Líder de Producto también debería poder
cancelar en algún caso — no se implementó porque no se preguntó explícitamente.

---

## 15. El rol Líder de Nodo: ¿cuál es su función real?

**Estado:** 🟡 Parcialmente respondida — función confirmada, nombre del rol por aclarar

**Contexto:** El prototipo ya tiene un rol "Líder de Nodo" con su propio
tablero, aunque el alcance actual del proyecto es explícitamente KAM + Líder
de Producto. No se ha tocado ni se va a tocar ese rol todavía, pero vale la
pena entender qué hace en la realidad.

**Pregunta para la Líder:** ¿el Líder de Nodo supervisa a varios Líderes de
Producto dentro de su nodo temático? ¿Tiene alguna función más allá de
"ver todo lo que pasa en su nodo"?

**Por qué importa:** no se va a construir nada de esto ahora, pero ayuda a
que el modelo de datos real ya deje espacio para esa jerarquía (nodo → varios
Líderes de Producto → sus solicitudes) en vez de tener que rediseñarlo después.

**Respuesta de la Líder:** "El Director de Nodo supervisa las propuestas que
están bajo su nodo." Confirma la función (supervisión de las propuestas de su
nodo), consistente con lo que ya asumía el prototipo.

⚠️ **Discrepancia de nombre sin resolver:** Dianis se refirió al rol como
**"Director de Nodo"**, no "Líder de Nodo" (que es como está nombrado hoy en
`UserRole` y en toda la documentación). Falta confirmar si es el mismo rol
con un nombre distinto (y entonces renombrarlo en código/docs) o si son dos
roles distintos con funciones diferentes. No renombrar nada todavía sin esa
aclaración — repreguntar explícitamente: "¿'Líder de Nodo' y 'Director de
Nodo' son el mismo cargo?"

---

## Confirmado e implementado en este ciclo

_(Feedback de la Líder de Producto que ya se validó contra el código y quedó
resuelto — se deja constancia para que sepa que se escuchó, sin necesidad de
una pregunta abierta.)_

- **Vista por defecto "Mis Solicitudes":** el tablero del Líder de Producto ya
  arranca filtrado a sus propias solicitudes (ver más abajo: el toggle a
  "Todas" se eliminó por completo, no solo el default).
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
- **Confirmación antes de avanzar de estado:** los botones de avance
  (incluyendo "Marcar Entregada"/"Enviar a cliente") ya no actúan al primer
  clic — abren un diálogo de confirmación. Se encontró que el botón del KAM
  "Enviar a cliente" ni siquiera revisaba el estado: se podía marcar como
  entregada una solicitud recién creada, sin costeo ni trabajo previo. Ahora
  solo aparece cuando la solicitud está "En proceso de costeo".
- **Toda la información que diligencia el KAM ahora es visible:** se agregó
  una sección "Información completa de la solicitud" (colapsable) en el
  detalle, con la empresa completa (NIT, dirección, CIIU, etc.), el contacto
  completo y contactos adicionales, el diagnóstico del requerimiento
  (necesidad, competencias, resultados esperados...), formación previa y
  observaciones — antes esos ~24 campos se perdían después de enviar la
  solicitud. También se corrigió que los archivos que el KAM adjunta en el
  wizard ahora sí llegan a la solicitud (antes desaparecían).

### Ronda del 2026-09-15 (preguntas 1 a 15, respondidas por Dianis)

- **KAM ve solo sus propias solicitudes** (pregunta 1): se eliminó el toggle
  "Mis Solicitudes / Todas" del tablero del KAM.
- **Costo Base y Margen de Contribución ocultos para el KAM** (preguntas 2 y
  3): el detalle del KAM ya solo muestra Valor Total Ofertado y, si aplica,
  Estampilla Pro-Cultura.
- **El KAM puede editar la información de su propia solicitud** (empresa,
  contacto, diagnóstico, formación previa, observaciones) **mientras esté en
  "Nueva"** (preguntas 4 y 8).
- **El KAM puede cancelar su propia solicitud mientras esté en "Nueva"**
  (pregunta 14).
- **El KAM puede devolver una propuesta "Entregada" a costeo con
  observaciones del cliente** (pregunta 13).
- Confirmado sin cambios de código: el costeo se define todo de una vez en
  "En proceso de costeo" (pregunta 7); no se bloquea el precio tras
  "Entregada" (pregunta 9); no hay aprobación adicional, autonomía total del
  Líder (pregunta 10); los honorarios del asesor externo no necesitan campo
  en la plataforma (pregunta 11); el Profesor no tendrá cuenta propia por
  ahora (pregunta 4).

## Pendientes para la próxima ronda con la Líder de Producto

_(No fueron respondidas o quedaron con una respuesta ambigua/incompleta en la
ronda del 2026-09-15 — repreguntar con ejemplos concretos, no descripciones
abstractas.)_

- **Pregunta 3 (detalle):** ¿la restricción de ocultar el desglose económico
  al KAM aplica también en "en costeo" sin valor aún definido? ¿La nota de
  alcance comercial (`negotiationNotes`) se mantiene visible para el KAM o
  también se oculta? (Respondió "no entiendo esto" a la primera reformulación.)
- **Pregunta 6:** ¿hay algún caso real donde se necesite reasignar una
  solicitud ya avanzada (no solo "Nueva")? Respuesta no concluyente
  ("quizás todo puede pasar en la vida").
- **Pregunta 12:** ¿la tarifa de la Estampilla Pro-Cultura es 1% o 1.5%? ¿Faltan
  otros cargos (IVA, retención en la fuente, otras estampillas) en una
  cotización real? No se preguntó en esta ronda.
- **Pregunta 15:** ¿"Líder de Nodo" y "Director de Nodo" son el mismo cargo?
- Si se necesita alguna vez, ¿el Líder de Producto también debería poder
  cancelar una solicitud (no solo el KAM)?

## Preguntas nuevas (sin desarrollar todavía)

_(Espacio para anotar rápido mientras surgen, antes de redactarlas con contexto completo.)_

-
