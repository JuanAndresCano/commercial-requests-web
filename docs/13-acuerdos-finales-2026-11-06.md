# Acuerdos finales de ajustes comerciales

Aprobados por Tomás el **6 de noviembre de 2026**, después de revisar el resumen de la reunión con Diana del 28 de octubre. Estas reglas prevalecen sobre los textos históricos que contradigan el alcance descrito aquí.

## Tablero y seguimiento comercial

El KAM conserva cuatro etapas operativas: **Entregada al líder**, **En Proceso**, **Lista para Entregar** y **Entregada al cliente** (en la interfaz la última se rotula **«Entregada»**). El Líder conserva su tablero propio con el paso intermedio **Enviada al KAM**. No se agregan columnas para estados comerciales.

Solo el KAM dueño gestiona una etiqueta comercial vigente por propuesta entregada:

- **Aprobación sin contrato**.
- **Aprobada con contrato / Orden de servicio**.
- **Facturada**.
- **Rechazada**.

Cambiar una etiqueta reemplaza la anterior y deja una traza de quién, cuándo, antes y después. Guardar de nuevo el mismo valor no duplica historial. Una propuesta puede quedar **Sin etiqueta**. El Líder no gestiona este seguimiento. Una etiqueta Rechazada es un resultado comercial: no sustituye el estado operativo de entrega ni ejecuta por sí misma una devolución a costeo.

Los filtros permiten consultar cada etiqueta y Sin etiqueta, combinados con búsqueda, empresa, líder y tipo. Si hay filtros se distingue el conjunto visible del total bruto de toda la cartera.

## Importe bruto y visible

El **total entregado** mide volumen nominal presentado, no ingresos, ventas ni dinero vivo. Si se presentan dos propuestas de cinco millones y una se etiqueta Rechazada, el total bruto sigue siendo diez millones. Facturada también permanece incluida.

Se cuenta una vez cada propuesta actualmente entregada, usando el último precio efectivamente remitido al cliente y conservado en el historial; nunca un recosteo privado del Líder. Las iteraciones no se suman. Si la propuesta vuelve temporalmente a costeo, pertenece a la etapa actual hasta que se presente otra vez. El subtotal visible corresponde exactamente a las propuestas que cumplen los filtros, sin redondeos por conversión a números de punto flotante.

## Sustentación y ajustes

La alerta de devolución dice **Sustentación y ajustes**. Las entradas del historial dicen **Sustentación y ajuste 1**, **Sustentación y ajuste 2**, etc. Se mantienen importes, fechas, motivos y observaciones; el nombre no crea eventos de aprobación. Solo el KAM puede confirmar la entrega al cliente y el Líder debe reconfirmar su envío tras cada ajuste pertinente.

## Creación de una solicitud

Los datos estructurales son obligatorios:

1. Razón social de la empresa.
2. Título de la propuesta con al menos cinco caracteres útiles.
3. Tipo de servicio válido.
4. Líder de Producto activo, elegido explícitamente.
5. Al menos un teléfono o correo válido de la empresa o del contacto principal.

El KAM se obtiene de la sesión y el nodo continúa siendo opcional. Se conservan los tipos válidos existentes; los ejemplos de Capacitación, Consultoría y Eventos no eliminan las demás categorías.

Los datos secundarios de empresa/contacto pueden quedar **Pendientes**: NIT, dirección, web, CIIU, descripción, naturaleza jurídica y el canal que no se tenga. Pendiente se trata como ausencia: no se guarda como un identificador fiscal, un teléfono ni un email real. Los datos aportados deben cumplir su formato (teléfono de 10 dígitos con `+57` opcional, CIIU de exactamente 4 dígitos, NIT de 10 dígitos que el formulario completa o comprueba con su dígito de verificación; ver `04-modelo-de-datos-logico.md`). Es suficiente un canal real: no se exige disponer de ambos.

El contacto puede completarse en el segundo paso aunque falte en el primero. Al terminar ese bloque y al enviar se comprueba la unión de datos de empresa y persona. La prioridad y la formación previa conservan sus reglas actuales, porque el acuerdo de flexibilidad se refiere a los datos de la contraparte.

## Edición del cliente y datos compartidos

El KAM dueño puede completar **empresa/contacto** mientras la propuesta esté en Nueva, En Proceso o En Costeo, incluso si ya tiene docente, y durante ajustes. La edición tiene un permiso separado: no desbloquea contenido técnico, precio, docente, nodo ni Líder fuera de sus ventanas anteriores. Con la propuesta entregada, esos cambios permanecen cerrados hasta que se devuelva con observaciones.

La empresa es un maestro común: corregir razón social, NIT, dirección, web o CIIU actualiza su ficha institucional. El contacto pertenece a la solicitud: editarlo no modifica el interlocutor de otras propuestas. Si un registro de contacto era compartido, se crea una copia para la solicitud editada.

No puede quitarse el último canal válido ni enviarse al cliente una propuesta sin contactabilidad. Los permisos y estas restricciones se validan en el servidor, además del formulario.

## Verificación y alcance

Se verifican creación, permisos, edición con docente, aislamiento del contacto, actualización del maestro, etiquetas e historial, filtros, importes exactos y ciclos de devolución. La aceptación técnica no sustituye la revisión humana con Tomás y los usuarios. Esta entrega no modifica producción, el dashboard admin, la tarifa Pro-Cultura ni el trabajo externo de los docentes.
