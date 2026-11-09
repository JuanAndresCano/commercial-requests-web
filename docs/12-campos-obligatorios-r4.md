# R4 — Campos obligatorios al enviar una solicitud

> **Vigente desde 2026-11-06.** Este documento recogía la primera interpretación (4 de noviembre) y estaba desactualizado: pedía la naturaleza jurídica como obligatoria y el contacto como opcional. Mandan [`13-acuerdos-finales-2026-11-06.md`](13-acuerdos-finales-2026-11-06.md) y `requisitos/2026-10-28/SPEC_ACORDADA.md` (raíz del espacio de trabajo). Lo que sigue ya refleja esas reglas y el código de `src/views/NewRequest.tsx`.

La indicación de la reunión pide impedir propuestas vacías sin volver rígido el formulario. Son **obligatorios**:

- Razón social de la empresa.
- **Al menos un teléfono o correo válido** de la empresa o del contacto principal. Un canal basta; «Pendiente» o espacios nunca cuentan.
- Título de la propuesta, de al menos 5 caracteres útiles.
- Tipo de requerimiento válido (con su descripción si se elige «Otro»).
- Líder de Producto activo, elegido expresamente.
- Respuesta a formación previa: «Sí», «No» o «No sé».
- Urgencia.

El KAM sale de la sesión. Estos datos se validan también en `POST /api/v1/proposals`: no basta con evitar el formulario. Los textos obligatorios compuestos solo por espacios se rechazan.

**Pueden quedar «Pendiente»** (ausencia, nunca un valor falso): NIT, dirección, web, CIIU, descripción de la empresa, **naturaleza jurídica** y el canal de contacto que no se tenga. El nodo, el diagnóstico y el detalle de formación previa siguen siendo opcionales. Si se aporta un teléfono, correo, NIT o CIIU real, debe cumplir su formato (teléfono de 10 dígitos con `+57` opcional; CIIU de exactamente 4 dígitos; NIT de 9 dígitos —el asistente calcula el dígito de verificación— o de 10 con el dígito correcto; el backend solo exige 10 dígitos). Detalle en `04-modelo-de-datos-logico.md`.

El contacto puede completarse en el segundo paso aunque falte en el primero. El indicador de pasos comprueba todos los pasos anteriores al avanzar: si se pulsa «Paso 5» con campos sin resolver, el asistente abre el primer paso pendiente y muestra el error concreto (los errores de campo aparecen al pulsar «Continuar», no al salir del campo; ver `07`). El guardado automático del borrador local sigue disponible sin completar todos los campos.

No se implementaron cuestionarios diferentes por servicio/nodo ni historia de cohortes: la reunión los dejó para una etapa futura.

Validación (histórica, 4 de noviembre): prueba de regresión del salto de pasos observada fallando antes del cambio; las pruebas del asistente y las HTTP de los campos pasan.
