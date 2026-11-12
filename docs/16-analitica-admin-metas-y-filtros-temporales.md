# Analítica Administrativa, Metas y Filtros Temporales Dinámicos

## 1. Visión General
Este documento especifica la integración del frontend con el motor de analítica administrativa de solicitudes comerciales (`AdminDashboard`, `AdminKamsView`, `AdminNodosView`, `AdminSolicitudesView`, `AdminEmpresasView`).

---

## 2. Tarjetas Macro y Métricas Estandarizadas

En `AdminDashboard.tsx`, las tarjetas macro se estructuran de la siguiente manera:
1. **Pipeline Activo:** Conteo y suma en COP de propuestas en curso formuladas en el periodo.
2. **Entregadas al Cliente:** Conteo y valor de cotizaciones entregadas en el periodo (`deliveryRatePercentage` visible como tasa de entrega).
3. **Cerradas Ganadas:** Conteo y valor vendido de propuestas cerradas con éxito en el periodo.
4. **Conversión y Win Rate:** 
   - Porcentaje en volumen: `macroKpis.winRatePercentage` ($\text{Ganadas} / (\text{Ganadas} + \text{Rechazadas})$).
   - Porcentaje financiero: `macroKpis.financialWinRatePercentage` ($\text{Vendido COP} / \text{Entregado COP}$).
5. **Meta Anual de la Universidad:** Cumplimiento porcentual del presupuesto anual institucional (`targetAchievementPct`).

---

## 3. Filtros Temporales Dinámicos ([src/lib/date-periods.ts](file:///c:/Universidad/Noveno%20Semestre/Proyecto%20Integrador/commercial-requests-web/src/lib/date-periods.ts))

Para evitar que los usuarios seleccionen periodos vacíos o inconsistentes:
1. **Años Disponibles:** El dropdown de años lee la lista `timeframe.availableYears` proporcionada por el backend basada en datos reales en la base de datos (más el año en curso).
2. **Deshabilitación de Trimestres y Meses Futuros (`isPeriodInFuture`):**
   - Para el año en curso, se deshabilitan trimestres y meses que aún no han ocurrido.
3. **Deshabilitación de Periodos Previos al Historial (`isPeriodBeforeHistory`):**
   - Se toma `timeframe.minAvailableDate` para deshabilitar trimestres o meses anteriores a la fecha de la primera solicitud registrada.
4. **Manejo de Zona Horaria UTC:**
   - Todas las comparaciones de año y mes de cadenas ISO utilizan `getUTCFullYear()` y `getUTCMonth()` para evitar que diferencias de zona horaria (ej. UTC-5 en Colombia) desplacen las fechas al mes anterior.

---

## 4. Desacople de Módulo Monetario ([src/lib/currency.ts](file:///c:/Universidad/Noveno%20Semestre/Proyecto%20Integrador/commercial-requests-web/src/lib/currency.ts))

- Se trasladaron las funciones de formateo y cálculo de escalas gráficas (`formatCop`, `formatCompactCop`, `getNiceScale`) a `src/lib/currency.ts`.
- Todos los componentes analíticos (`MonthlySalesBarChart`, `YoySalesCurveChart`, `CompanyDirectoryRankingTable`, `AcademicNodeRankingTable`, `AdminAuditTable`, `AdminDashboard`, etc.) importan directamente desde `@/lib/currency`.
- El archivo `mock-data.ts` re-exporta estas funciones para compatibilidad regresiva, y su array `MOCK_REQUESTS` fue podado en más de 1.100 líneas, conservando únicamente las fixtures requeridas para pruebas unitarias.
