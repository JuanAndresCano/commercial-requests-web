# Autenticación SSO Institucional, Sesiones y Flujo de Onboarding

## 1. Visión General
El cliente web (`commercial-requests-web`) está integrado con el backend mediante cookies HTTP seguras (`icesi_auth`) emitidas tras la autenticación institucional con Microsoft Entra ID o el inicio rápido para desarrollo (`dev-login`).

---

## 2. Flujo de Navegación y Páginas Involucradas

1. **`/login` ([LoginView.tsx](file:///c:/Universidad/Noveno%20Semestre/Proyecto%20Integrador/commercial-requests-web/src/views/LoginView.tsx)):**
   - Ofrece el botón "Iniciar Sesión con Microsoft Icesi", que redirige a `GET /api/v1/auth/microsoft`.
   - Permite acceso de desarrollo mediante selector de usuario o ingreso de correo.
   - Captura y muestra mensajes de error amigables en español cuando el query string incluye `?error=...` (ej. errores de permisos institucionales o cookies caducadas).
2. **`/onboarding/pending` ([PendingApprovalView.tsx](file:///c:/Universidad/Noveno%20Semestre/Proyecto%20Integrador/commercial-requests-web/src/views/PendingApprovalView.tsx)):**
   - Si un usuario se autentica exitosamente pero no tiene un rol comercial o administrativo asignado por el Administrador (`isPendingRole === true`), es dirigido automáticamente a esta vista.
   - La pantalla explica el proceso y realiza polling cada 10 segundos invocando `GET /api/v1/auth/me`.
   - En el instante en que el Administrador le asigna un rol en el panel de usuarios, el backend renueva la cookie y la siguiente llamada a `GET /auth/me` detecta el cambio de rol, redirigiendo de inmediato al usuario a `/dashboard`.
3. **`/dashboard` ([Dashboard.tsx](file:///c:/Universidad/Noveno%20Semestre/Proyecto%20Integrador/commercial-requests-web/src/views/Dashboard.tsx)):**
   - Redirige según el rol operativo del usuario:
     - `ADMIN` $\to$ `/admin/resumen` o `/admin/dashboard`
     - `KAM` $\to$ Vista Kanban y centro de comando comercial
     - `PRODUCT_LEADER` $\to$ Bandeja de costeo y asignación de docentes

---

## 3. Manejo de Estado en `AuthContext`
- Se erradicó el modo dual basado en `localStorage`. La única fuente de verdad es la sesión devuelta por `GET /api/v1/auth/me`.
- El token JWT se almacena exclusivamente en cookies `httpOnly`, protegiendo la sesión contra ataques XSS.
- Al cerrar sesión (`logout`), se ejecuta `POST /api/v1/auth/logout`, lo que limpia las cookies del navegador e invalida la versión del token en el backend.
