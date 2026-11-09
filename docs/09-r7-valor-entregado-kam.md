# R7 — Valor total presentado al cliente en el tablero del KAM

> **Reglas finales (2026-11-06):** ver [`13-acuerdos-finales-2026-11-06.md`](13-acuerdos-finales-2026-11-06.md). La etapa se llama **«Entregada»** en la interfaz (no «Presentación de propuesta»); una propuesta etiquetada **Rechazada** o **Facturada** sigue contando en el total bruto; con filtros activos la tarjeta muestra «Filtradas: N de M» y un aviso «Total visible». Donde este texto difiera, manda `13`.

Origen: reunión con Lina del 22 de octubre de 2026, minuto 7:28, resumida por
Tomás el 4 de noviembre. El KAM necesita ver cuánto tiene «en juego»: una
propuesta de Bancolombia por $5.000.000 y otra de Sura por $5.000.000 deben sumar
**$10.000.000 COP**. Es valor ofertado presentado al cliente, no valor comprado,
ingreso ni margen.

## Revisión del trabajo de Juan David

Los commits `9004df1` y `db1c9e3` de la rama
`origin/feat/admin-analytics-dashboard` ya muestran una suma en la tarjeta y la
llaman **«total entregado»**. No están integrados en `develop`. Se reutilizaron
esa intención y ese texto; el dashboard de administrador sigue siendo trabajo
independiente. No se contactó a Juan David ni se creó una HU duplicada en un
sistema externo: la comparación se hizo contra su código remoto descargado.

## Comportamiento

- La tarjeta de la etapa **Entregada** (antes rotulada «Presentación de propuesta») muestra el total exacto de las
  propuestas del KAM actualmente presentadas al cliente. Conserva el subtítulo
  «total entregado» del trabajo anterior para identificar la cifra de R7.
- La cantidad y el valor provienen de `GET /requests/dashboard/metrics`:
  `entregadas` y `deliveredValueCop`. No se suman las filas visibles del tablero.
  Buscar una empresa o cambiar de vista no altera el total de la cartera (los filtros de etiqueta y de ajustes sí cambian el encabezado a «Filtradas: N de M · $ Y», y los demás filtros muestran aparte «Total visible»; ver `03`, A.9).
- El valor incluye el último precio efectivamente presentado de cada propuesta,
  una sola vez. Los recosteos todavía privados no cambian la cifra ya presentada.
  Las propuestas devueltas temporalmente a costeo salen del total hasta que se presenten otra vez. Una etiqueta comercial **Rechazada** o **Facturada** no las saca: el total es volumen bruto presentado, no ingreso (5 millones + 5 millones rechazados = 10 millones).
- El backend filtra por el KAM autenticado y excluye solicitudes canceladas.
  Las propuestas antiguas sin ronda enviada usan solo el costeo actual
  confirmado por el líder; sin valor público aportan cero.
- La cifra llega como decimal y se formatea sin convertirla a `number`, para
  conservar centavos y totales grandes. Se muestra también el cero real.
- Mientras carga se indica «Calculando total…». Un error de red o un total
  ausente/malformado se muestra como error con **Reintentar total**; no se
  reemplaza por cero ni por una suma parcial de datos locales.
- Al cerrar o cambiar de sesión se eliminan las consultas y los resultados
  anteriores de React Query, incluidas las peticiones en vuelo. El login oculta
  las pantallas privadas antes de cambiar de cuenta. Así otro KAM que entre en
  la misma pestaña no ve valores ni propuestas de la cuenta anterior mientras
  llegan sus propios datos.

## Criterios verificados

Las pruebas del tablero cubren el agregado aun con lista vacía y búsqueda,
valores cero, centavos y más allá del entero seguro de JavaScript, carga,
errores, reintento y respuestas malformadas. Las pruebas del backend verifican
el ejemplo $5M + $5M, separación entre vendedores, precios no publicados,
históricos sin doble conteo y una cartera de 125 propuestas.

La regresión de sesión usa el mismo QueryClient con dos KAM: cierra la cuenta A
y entra a B, o reemplaza A directamente por B. Resuelve respuestas antiguas de A
después de iniciar B y comprueba que ni el dinero ni el listado anterior se
vuelven a mostrar.

También se conserva la etiqueta contextual **Sustentación y ajustes** en la tabla
KAM cuando la propuesta está en costeo y tiene observaciones del cliente,
incluido el caso en que ya fue reenviada al KAM. La etiqueta se limpia al volver
a presentarse al cliente (etapa Entregada); no crea otra etapa técnica.
