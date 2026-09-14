# Negocio y dominio

## Contexto institucional

La **Universidad Icesi** (Cali, Colombia) tiene una unidad, la **Dirección de Extensión y Consultoría**, que vende servicios académicos a empresas: capacitaciones corporativas, consultorías especializadas, mentorías ejecutivas, investigación aplicada y proyectos especiales (eventos). Es un modelo B2B — la "universidad como proveedor" para clientes corporativos (Bancolombia, Grupo Éxito, Nutresa, Manuelita, Tecnoquímicas, Gases de Occidente, etc.).

La app **"Solicitudes Comerciales"** es el sistema interno que gestiona el ciclo de vida completo de una oportunidad comercial: desde que un cliente manifiesta una necesidad hasta que la universidad le entrega una propuesta económica formal.

## Tipos de servicio (`RequestType`)

- **Capacitación** — el único tipo sujeto a la Estampilla Pro-Cultura (ver Costeo).
- **Consultoría**
- **Mentoría**
- **Investigación**
- **Proyectos Especiales (Eventos)**
- **Otro** — requiere que el usuario especifique manualmente de qué se trata.

## El pipeline comercial: 4 etapas

Toda solicitud (`RequestItem`) vive en una de estas 4 etapas, siempre en este orden (no hay retrocesos ni saltos en la UI actual):

| Estado interno | Etiqueta visible | Color de marca | Qué significa | Quién actúa |
|---|---|---|---|---|
| `nueva` | Nueva | Azul Icesi `#5454e9` | La solicitud fue registrada pero **no tiene docente/experto asignado** | Líder de Producto debe asignar un docente |
| `en-experto` | En proceso por experto | Naranja `#e9683b` | Hay un docente/consultor asignado, diseñando la propuesta académica | Líder de Producto (coordina) / Profesor (diseña contenido) |
| `en-costeo` | En proceso de costeo | Morado `#865cf0` | Se está estructurando el valor económico de la propuesta | Líder de Producto hace el costeo |
| `entregada` | Entregada | Verde `#4cb979` | La propuesta ya tiene valor aprobado y fue remitida al cliente | KAM confirma el envío al cliente |

**Regla de negocio clave (aunque hoy no está forzada por la UI — ver gaps conocidos):** el valor económico oficial de una solicitud solo debería considerarse válido una vez alcanza `en-costeo` o `entregada`. Antes de eso, la solicitud se muestra como "Pendiente de costeo".

## Nodos temáticos

La universidad organiza su oferta académica en 5 **nodos** (líneas de conocimiento). Cada nodo tiene un **Líder de Producto por defecto**, que se autosugiere cuando el KAM elige el nodo al crear la solicitud:

1. Biotecnología, Bioeconomía y Sostenibilidad → Claudia Maitee Bahamón Osorio
2. Inteligencia Artificial y Tecnologías Digitales → Juan Pablo Corrales Arenas
3. Innovación Educativa, Bienestar Social, Innovación Pública → Diana Carolina Romero Valencia
4. Competitividad Organizacional, Economías Creativas → María Camila Restrepo
5. Salud Global, Calidad de Vida → Sebastián Vélez

El nodo es **opcional** al crear la solicitud ("por definir" es válido), y el Líder de Producto sugerido puede sobreescribirse manualmente.

## Docentes/expertos: planta vs. externo

Cuando el Líder de Producto asigna quién ejecutará la propuesta académica, elige entre dos caminos con implicaciones distintas:

- **Docente de planta**: profesor vinculado a Icesi, se elige de una lista cerrada (facultad interna). No requiere datos de contacto adicionales — ya están en el directorio institucional.
- **Consultor/docente externo**: profesional fuera de la universidad. Requiere capturar una ficha completa: nombre, identificación, firma consultora/institución, correo, teléfono, perfil profesional. Marcar "externo" **activa automáticamente** el interruptor "¿Requiere asesor externo?" en el módulo de costeo, porque un externo normalmente implica honorarios adicionales que afectan el costo base.

## Costeo financiero (la lógica más sensible del dominio)

El costeo se construye así, en este orden:

1. **Costo Base Directo (COP)** — lo que le cuesta a la universidad ejecutar el servicio (honorarios, materiales, logística). Lo ingresa manualmente el Líder de Producto.
2. **Margen de Contribución (%)** — porcentaje de utilidad esperado sobre el costo base. Hay atajos predefinidos (25%, 30%, 35%, 40%) pero es editable libremente.
   - `montoMargen = costoBase × (margen / 100)`
3. **Estampilla Pro-Cultura** — impuesto legal colombiano que aplica **únicamente cuando el tipo de servicio es "Capacitación"**. Es un **1.5% fijo sobre el costo base**, calculado y mostrado automáticamente (no editable). Para cualquier otro tipo de servicio es $0 y no aparece en el desglose.
   - `estampilla = esCapacitación ? costoBase × 0.015 : 0`
4. **Total Sugerido** = `costoBase + montoMargen + estampilla` (redondeado). Este es el valor que el sistema calcula automáticamente.
5. **Valor Total Ofertado** — el valor final que se presenta al cliente. **Por defecto es igual al Total Sugerido**, pero el Líder de Producto puede sobreescribirlo manualmente para reflejar negociaciones comerciales (descuentos por volumen, acuerdos especiales, etc.). Cuando difiere del sugerido, la UI muestra la diferencia (`Ajuste: +/- $X`) y ofrece un botón "Sincronizar" para volver al valor calculado.
6. **Nota de negociación** (opcional, texto libre) — justificación del ajuste manual, ej. *"Acuerdo de descuento del 1.3% por volumen de horas con SURA"*.

Este es el número (`Valor Total Ofertado`) que ve el KAM en modo solo-lectura y el que finalmente se comunica al cliente.

## Documentos de la propuesta

Cada solicitud puede tener dos categorías de archivos adjuntos, con audiencias distintas:

- **`client_kam`** — documentos de cara al cliente (ej. propuesta técnico-comercial en PDF/Word). Los sube típicamente el KAM o el Líder de Producto cuando la propuesta está lista para el cliente.
- **`internal_costing`** — documentos internos de soporte (matrices de costeo en Excel, cronogramas de dedicación, minutas de contrato con externos). Uso interno del equipo de Extensión, no se comparten con el cliente.

## Glosario rápido

| Término | Significado |
|---|---|
| **KAM** | Key Account Manager — gestor comercial dueño de la cuenta del cliente |
| **Líder de Producto** (a veces "LP" en el código) | Responsable técnico/operativo que arma la propuesta y el costeo |
| **Líder de Nodo** | Rol de coordinación/supervisión por nodo temático (menos desarrollado en el prototipo) |
| **Nodo** | Línea temática académica de la universidad |
| **Docente de planta** | Profesor interno de Icesi |
| **Consultor/docente externo** | Experto fuera de la universidad, requiere ficha de contacto |
| **Estampilla Pro-Cultura** | Impuesto del 1.5% sobre el costo base, solo aplica a "Capacitación" |
| **Valor Total Ofertado** | El número final que ve/aprueba el cliente |
| **Reasignación** | Transferir una solicitud de un Líder de Producto a otro (por ejemplo si el tema no corresponde a su nodo) |
