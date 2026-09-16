# Guion de prueba — 10 minutos

Hola Dianis 👋 Este es el prototipo completo. Sigue estos pasos en orden, en tu propio ritmo — no necesitas preparar nada, ya viene cargado con 24 solicitudes de ejemplo en distintos estados. Al final solo necesitamos tu aval para empezar a construir la versión real.

**Si algo se ve raro:** clic en tu foto (arriba a la izquierda) → **"Restablecer datos de ejemplo"** — deja todo como al principio.

⚠️ No pruebes los roles **"Líder de Nodo"** ni **"Profesor"** todavía — no están construidos en este prototipo y la pantalla se rompe.

---

## Parte 1 · Como KAM (vendedora)

En la pantalla de entrada, clic en la tarjeta **"KAM"** (bajo "Cuentas de prueba") → **Ingresar**.

- [ ] Pasa el cursor por el menú de la izquierda — se expande mostrando los nombres.
- [ ] Mira el tablero: 4 números arriba (Nueva / En Proceso / Lista para Entregar / Entregada) y la tabla de tus solicitudes debajo.
- [ ] Clic en **"Nueva Solicitud"** → llena Empresa y avanza sin llenar el título → debe avisarte que falta.
- [ ] Completa el resto rápido y **envía** → aparece en tu tablero como "Nueva".
- [ ] Ábrela → clic **"Editar información"** → cambia algo (ej. el teléfono) → **Guardar**.
- [ ] En esa misma solicitud → clic **"Cancelar solicitud"** → confirma → desaparece de tu lista.
- [ ] Cambia a vista **Kanban** (ícono junto al buscador) → clic en la tarjeta "Lista para Entregar" → esa columna se agranda.
- [ ] Abre una solicitud que ya esté "Lista para Entregar" → mira la propuesta: solo ves el **valor total**, no el costo interno del Líder.
- [ ] Clic **"Enviar a cliente"** → confirma → pasa a "Entregada".
- [ ] En esa misma solicitud entregada → clic **"Devolver con observaciones"** → escribe algo como *"el cliente pidió bajar las horas"* → confirma → vuelve a "En Costeo" con tu nota visible en amarillo.

## Parte 2 · Como Líder de Producto

Arriba a la derecha, cambia el rol a **"Líder de Producto"**.

- [ ] Mira tu Kanban: 4 columnas, cada tarjeta muestra urgencia, valor (si ya tiene), docente, fecha límite y hace cuánto está en esa fase.
- [ ] Busca una tarjeta con la etiqueta ámbar **"Cliente pidió ajustes"** (o la que acabas de devolver en la Parte 1) y ábrela.
- [ ] En una solicitud "Nueva" sin docente → clic **"Asignar"** → elige un profesor de planta → guarda.
- [ ] Clic **"Pasar a Experto"** → aparece una confirmación con el nombre de la empresa → confirma.
- [ ] Clic **"Pasar a Costeo"** → confirma.
- [ ] En el detalle, en "Costeo Financiero": pon un Costo Base, ajusta el Margen, mira el Total calculado en vivo.
- [ ] Intenta escribir un costo base **negativo** → no te deja.
- [ ] Con el Total Ofertado ya en un valor mayor a $0, la tarjeta debe mostrar **"Listo para el KAM"** — como Líder ya no tienes ningún botón para "entregar"; eso lo hace el KAM (vuelve a la Parte 1 si quieres verlo cerrar el ciclo).
- [ ] Intenta **reasignar** una solicitud "Nueva" a otro Líder (ícono de flechas en la tarjeta).
- [ ] Clic en el filtro **"Sin docente"** para ver solo lo pendiente de asignar.

---

## Al final, solo dinos:

1. ¿Esto refleja cómo trabajan hoy en la realidad?
2. ¿Falta algo **crítico** para poder empezar a usarlo de verdad?
3. ¿Damos luz verde para construir la versión con base de datos real?
