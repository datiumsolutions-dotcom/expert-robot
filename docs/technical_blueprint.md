**LOYALTY SAAS**

Technical Implementation Blueprint

*Optimizado para generadores de software · MVP v1.0 · Marzo 2026*

**MÓDULOS DE IMPLEMENTACIÓN**

  --------------------------------------------------------------------------
  **ID**   **Módulo**                   **Prioridad**   **Dependencias**
  -------- ---------------------------- --------------- --------------------
  M01      Database Schema & Migrations P0 --- Crítico  Ninguna

  M02      Sales Import Pipeline        P0 --- Crítico  M01

  M03      Points Engine                P0 --- Crítico  M01, M02

  M04      Authentication               P0 --- Crítico  M01

  M05      Admin REST API               P1 --- Alta     M01--M04

  M06      Customer Web Portal          P1 --- Alta     M03, M04

  M07      Security & Audit             P1 --- Alta     M04, M05
  --------------------------------------------------------------------------

**Índice**

**Restricciones Globales del Sistema**

Estas reglas aplican a TODOS los módulos sin excepción. El generador
debe aplicarlas automáticamente en cada pieza de código producida.

**Stack Tecnológico Obligatorio**

  -------------------------------------------------------------------------
  **Capa**          **Tecnología**    **Versión      **Notas**
                                      mínima**       
  ----------------- ----------------- -------------- ----------------------
  Base de datos     PostgreSQL        14+            UUID nativo, JSONB,
                                                     TIMESTAMPTZ

  Backend           Node.js + Express Node 20 /      Stateless, REST JSON
                    o FastAPI         Python 3.11    

  Frontend          Next.js (React)   14+            SSR para /club, SPA
                                                     para admin

  Auth tokens       JWT (RS256)       ---            Payload: org_id, role,
                                                     sub, exp

  File storage      S3 o compatible   ---            Para CSV uploads

  Queue / Jobs      BullMQ + Redis    BullMQ 5+      Import pipeline async
  -------------------------------------------------------------------------

**Reglas Invariables**

-   TODOS los IDs son UUID v4. Nunca integers auto-increment.

-   TODOS los timestamps son TIMESTAMPTZ. Timezone del negocio en
    organizations.settings.timezone.

-   TODOS los endpoints de negocio incluyen organization_id en el JWT y
    lo validan contra el recurso solicitado.

-   NINGÚN endpoint mezcla datos de distintas organizaciones (salvo
    /superadmin/\*).

-   TODA operación crítica genera una fila en audit_log antes de
    retornar 200.

-   NUNCA retornar password_hash, auth_token ni datos PII en logs.

-   TODAS las queries de negocio incluyen WHERE organization_id =
    \$orgId como primer filtro.

-   El import pipeline es IDEMPOTENTE: procesar el mismo CSV N veces
    produce el mismo estado final.

> **M01 Database Schema & Migrations**
>
> *Fuente de verdad estructural --- implementar primero*

**Objetivo del módulo**

Definir y migrar el schema completo de PostgreSQL. Este módulo no tiene
lógica de negocio; solo estructura. Todos los demás módulos dependen de
él.

**Tablas requeridas**

Implementar en este orden exacto (respetar dependencias de FK):

1.  organizations

2.  admin_users

3.  loyalty_customers

4.  loyalty_rewards

5.  loyalty_orders

6.  reward_redemptions

7.  loyalty_transactions

8.  audit_log

**Schema SQL completo**

> \-- 1. organizations
>
> CREATE TABLE organizations (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> name VARCHAR(255) NOT NULL,
>
> slug VARCHAR(100) UNIQUE NOT NULL,
>
> plan VARCHAR(50) NOT NULL DEFAULT \'free\',
>
> settings JSONB NOT NULL DEFAULT \'{}\',
>
> is_active BOOLEAN NOT NULL DEFAULT true,
>
> created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
>
> updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
>
> );
>
> \-- settings JSONB structure (reference):
>
> \-- { \"timezone\": \"America/Argentina/BuenosAires\",
>
> \-- \"amount_per_point\": 10000,
>
> \-- \"country_code\": \"54\",
>
> \-- \"area_code\": \"223\" }
>
> \-- 2. admin_users
>
> CREATE TABLE admin_users (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE
> CASCADE,
>
> email VARCHAR(255) NOT NULL,
>
> password_hash VARCHAR(255) NOT NULL,
>
> role VARCHAR(30) NOT NULL DEFAULT \'staff\',
>
> \-- role: \'owner\' \| \'manager\' \| \'staff\'
>
> is_active BOOLEAN NOT NULL DEFAULT true,
>
> last_login_at TIMESTAMPTZ,
>
> created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
>
> updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
>
> UNIQUE (organization_id, email)
>
> );
>
> \-- 3. loyalty_customers
>
> CREATE TABLE loyalty_customers (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> organization_id UUID NOT NULL REFERENCES organizations(id),
>
> external_customer_id VARCHAR(100),
>
> phone VARCHAR(30), \-- E.164 normalized
>
> email VARCHAR(255), \-- lowercase normalized
>
> full_name VARCHAR(255),
>
> points_balance INTEGER NOT NULL DEFAULT 0,
>
> total_points_earned INTEGER NOT NULL DEFAULT 0,
>
> total_points_redeemed INTEGER NOT NULL DEFAULT 0,
>
> is_active BOOLEAN NOT NULL DEFAULT true,
>
> last_activity_at TIMESTAMPTZ,
>
> created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
>
> updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
>
> UNIQUE (organization_id, phone),
>
> UNIQUE (organization_id, email),
>
> UNIQUE (organization_id, external_customer_id),
>
> CHECK (phone IS NOT NULL OR email IS NOT NULL)
>
> );
>
> \-- 4. loyalty_rewards
>
> CREATE TABLE loyalty_rewards (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> organization_id UUID NOT NULL REFERENCES organizations(id),
>
> name VARCHAR(255) NOT NULL,
>
> description TEXT,
>
> points_cost INTEGER NOT NULL CHECK (points_cost \> 0),
>
> is_active BOOLEAN NOT NULL DEFAULT true,
>
> stock INTEGER, \-- NULL = unlimited
>
> image_url TEXT,
>
> valid_from TIMESTAMPTZ,
>
> valid_until TIMESTAMPTZ,
>
> created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
>
> updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
>
> );
>
> \-- 5. loyalty_orders (ventas importadas del POS)
>
> CREATE TABLE loyalty_orders (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> organization_id UUID NOT NULL REFERENCES organizations(id),
>
> external_sale_id VARCHAR(100) NOT NULL,
>
> loyalty_customer_id UUID REFERENCES loyalty_customers(id),
>
> sale_date TIMESTAMPTZ NOT NULL,
>
> total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount \>= 0),
>
> sale_type VARCHAR(50), \-- \'delivery\'\|\'takeaway\'\|\'local\'
>
> payment_method VARCHAR(100),
>
> status VARCHAR(30) NOT NULL DEFAULT \'active\',
>
> \-- status: \'active\' \| \'cancelled\' \| \'reversed\'
>
> points_assigned INTEGER NOT NULL DEFAULT 0,
>
> points_processed_at TIMESTAMPTZ,
>
> raw_data JSONB NOT NULL DEFAULT \'{}\',
>
> match_method VARCHAR(30),
>
> \-- match_method: \'customer_id\'\|\'phone\'\|\'email\'\|\'unmatched\'
>
> created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
>
> updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
>
> UNIQUE (organization_id, external_sale_id)
>
> );
>
> \-- 6. reward_redemptions
>
> CREATE TABLE reward_redemptions (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> organization_id UUID NOT NULL REFERENCES organizations(id),
>
> loyalty_customer_id UUID NOT NULL REFERENCES loyalty_customers(id),
>
> loyalty_reward_id UUID NOT NULL REFERENCES loyalty_rewards(id),
>
> status VARCHAR(30) NOT NULL DEFAULT \'pending\',
>
> \-- status: \'pending\' \| \'fulfilled\' \| \'cancelled\' \|
> \'expired\'
>
> points_cost INTEGER NOT NULL,
>
> requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
>
> fulfilled_at TIMESTAMPTZ,
>
> fulfilled_by UUID REFERENCES admin_users(id),
>
> notes TEXT,
>
> created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
>
> updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
>
> );
>
> \-- 7. loyalty_transactions (append-only ledger)
>
> CREATE TABLE loyalty_transactions (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> organization_id UUID NOT NULL REFERENCES organizations(id),
>
> loyalty_customer_id UUID NOT NULL REFERENCES loyalty_customers(id),
>
> loyalty_order_id UUID REFERENCES loyalty_orders(id),
>
> reward_redemption_id UUID REFERENCES reward_redemptions(id),
>
> type VARCHAR(30) NOT NULL,
>
> \-- type: \'earn\' \| \'redeem\' \| \'adjust\' \| \'reversal\'
>
> points INTEGER NOT NULL, \-- positive or negative
>
> balance_before INTEGER NOT NULL,
>
> balance_after INTEGER NOT NULL,
>
> description TEXT,
>
> created_by VARCHAR(100) NOT NULL, \-- \'system\' \| admin user id
>
> created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
>
> \-- NO updated_at --- this table is append-only, never UPDATE
>
> CHECK (balance_after = balance_before + points)
>
> );
>
> \-- 8. audit_log (append-only, never UPDATE or DELETE)
>
> CREATE TABLE audit_log (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> organization_id UUID,
>
> actor_type VARCHAR(30) NOT NULL, \--
> \'admin_user\'\|\'customer\'\|\'system\'
>
> actor_id VARCHAR(100),
>
> action VARCHAR(100) NOT NULL,
>
> resource_type VARCHAR(100),
>
> resource_id VARCHAR(100),
>
> payload JSONB NOT NULL DEFAULT \'{}\',
>
> ip_address INET,
>
> created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
>
> );
>
> \-- ── ÍNDICES ──────────────────────────────────────────────────
>
> CREATE INDEX idx_lc_org_phone ON loyalty_customers (organization_id,
> phone);
>
> CREATE INDEX idx_lc_org_email ON loyalty_customers (organization_id,
> email);
>
> CREATE INDEX idx_lc_org_extid ON loyalty_customers (organization_id,
> external_customer_id);
>
> CREATE INDEX idx_lo_org_extid ON loyalty_orders (organization_id,
> external_sale_id);
>
> CREATE INDEX idx_lo_customer ON loyalty_orders (loyalty_customer_id);
>
> CREATE INDEX idx_lo_status ON loyalty_orders (organization_id,
> status);
>
> CREATE INDEX idx_lt_customer ON loyalty_transactions
> (loyalty_customer_id, created_at DESC);
>
> CREATE INDEX idx_rr_org_status ON reward_redemptions (organization_id,
> status);
>
> CREATE INDEX idx_al_org_action ON audit_log (organization_id, action,
> created_at DESC);
>
> **Regla del generador:** Las tablas loyalty_transactions y audit_log
> son APPEND-ONLY. El generador NUNCA debe producir queries UPDATE o
> DELETE sobre estas tablas. Cualquier corrección se hace mediante
> nuevas filas (reversal, adjust).
>
> **M02 Sales Import Pipeline**
>
> *Ingestión idempotente de ventas desde CSV del POS*

**Objetivo del módulo**

Procesar archivos CSV exportados del POS, normalizar datos, ejecutar el
algoritmo de matching y preparar las ventas para el motor de puntos. El
pipeline es completamente idempotente.

**Flujo de ejecución (orden obligatorio)**

9.  VALIDATE --- verificar columnas requeridas y tipos de datos.

10. NORMALIZE --- limpiar y estandarizar todos los campos.

11. UPSERT ORDERS --- insertar ventas con ON CONFLICT DO NOTHING.

12. MATCH CUSTOMERS --- vincular ventas con loyalty_customers.

13. ASSIGN POINTS --- delegar al M03 para ventas nuevas y vinculadas.

14. HANDLE CANCELLATIONS --- detectar y revertir puntos de ventas
    anuladas.

15. REPORT --- retornar resumen de la importación.

**Columnas CSV requeridas y su mapeo**

  --------------------------------------------------------------------------------
  **Columna CSV     **Campo interno**      **Tipo**        **Transformación**
  (POS)**                                                  
  ----------------- ---------------------- --------------- -----------------------
  Id                external_sale_id       VARCHAR(100)    Trim, cast to string

  Fecha             sale_date              TIMESTAMPTZ     Parse con timezone de
                                                           org

  Total             total_amount           NUMERIC(12,2)   Replace coma→punto,
                                                           parse float

  Id. Cliente       external_customer_id   VARCHAR(100)    Trim, nullable

  Teléfono del      phone_raw              → phone E.164   Ver normalización M02.4
  Cliente                                                  

  Email del Cliente email_raw              → email         Trim + lowercase
                                           lowercase       

  Estado            status                 VARCHAR(30)     Map: ver tabla de
                                                           estados

  Tipo de Venta     sale_type              VARCHAR(50)     Map: ver tabla de tipos

  Medio de Pago     payment_method         VARCHAR(100)    Trim, nullable
  --------------------------------------------------------------------------------

**Mapeo de estados del POS → sistema**

  -----------------------------------------------------------------------
  **Valor CSV (Estado)**      **status interno**
  --------------------------- -------------------------------------------
  Cerrada, Completada, Pagada active

  Anulada, Cancelada, Void    cancelled

  Cualquier otro valor        active (default seguro)
  -----------------------------------------------------------------------

**Normalización de teléfonos (Argentina)**

Función pura normalize_phone(raw, country_code, area_code). Aplicar en
este orden:

16. Eliminar todo carácter no numérico: espacios, guiones, paréntesis,
    puntos.

17. Si el resultado tiene 10 dígitos y empieza con \'15\': reemplazar
    \'15\' por area_code de la org.

18. Si el resultado tiene 8 dígitos: anteponer area_code de la org.

19. Si no empieza con country_code (\'54\' para AR): anteponer \'+54\'.

20. Si ya empieza con \'54\' o \'+54\': agregar \'+\' si falta.

21. Resultado final en formato E.164: +54XXXXXXXXXX (12 dígitos total
    para AR).

> \-- Ejemplos de normalización para org con area_code=\'223\',
> country_code=\'54\':
>
> \--
>
> \-- \'(223) 456-7890\' → +542234567890
>
> \-- \'011 15-3456-7890\' → +541134567890
>
> \-- \'15 456 7890\' → +542234567890 (asume area_code org)
>
> \-- \'+54 223 456 7890\' → +542234567890
>
> \-- \'54 223 456 7890\' → +542234567890
>
> \-- \'456-7890\' → +542234567890 (8 dígitos → agrega area_code)
>
> \--
>
> \-- Si el resultado no tiene entre 10 y 15 dígitos: retornar NULL
> (inválido)

**Algoritmo de matching cliente ↔ venta (cascada)**

Ejecutar en orden. Detenerse en el primer match exitoso.

> FUNCTION match_customer(org_id, ext_cust_id, phone_raw, email_raw):
>
> \-- Paso 1: Por external_customer_id
>
> IF ext_cust_id IS NOT NULL:
>
> customer = SELECT \* FROM loyalty_customers
>
> WHERE organization_id = org_id
>
> AND external_customer_id = ext_cust_id
>
> IF found: RETURN (customer.id, \'customer_id\')
>
> \-- Paso 2: Por teléfono normalizado
>
> phone_norm = normalize_phone(phone_raw, org.country_code,
> org.area_code)
>
> IF phone_norm IS NOT NULL:
>
> customer = SELECT \* FROM loyalty_customers
>
> WHERE organization_id = org_id
>
> AND phone = phone_norm
>
> IF found: RETURN (customer.id, \'phone\')
>
> \-- Paso 3: Por email normalizado
>
> email_norm = LOWER(TRIM(email_raw))
>
> IF email_norm IS NOT NULL AND email_norm LIKE \'%@%\':
>
> customer = SELECT \* FROM loyalty_customers
>
> WHERE organization_id = org_id
>
> AND email = email_norm
>
> IF found: RETURN (customer.id, \'email\')
>
> \-- Sin match
>
> RETURN (NULL, \'unmatched\')

**Upsert idempotente de ventas**

> INSERT INTO loyalty_orders (
>
> organization_id, external_sale_id, loyalty_customer_id,
>
> sale_date, total_amount, sale_type, payment_method,
>
> status, raw_data, match_method
>
> ) VALUES (
>
> \$org_id, \$ext_id, \$customer_id,
>
> \$sale_date, \$total, \$type, \$payment,
>
> \$status, \$raw_json, \$match_method
>
> )
>
> ON CONFLICT (organization_id, external_sale_id)
>
> DO UPDATE SET
>
> status = EXCLUDED.status,
>
> updated_at = NOW()
>
> \-- NOTA: NO actualizar loyalty_customer_id ni points_assigned si ya
> fue procesado
>
> \-- Agregar WHERE loyalty_orders.points_processed_at IS NULL al DO
> UPDATE
>
> \-- para proteger ventas ya acreditadas.

**Output del pipeline**

> RETURN {
>
> total_rows: integer, \-- filas en el CSV
>
> inserted: integer, \-- ventas nuevas
>
> skipped_duplicate: integer, \-- ya existían
>
> matched: integer, \-- vinculadas a cliente
>
> unmatched: integer, \-- sin cliente
>
> points_assigned: integer, \-- puntos nuevos acreditados
>
> cancelled_reversed:integer, \-- reversals generados
>
> errors: \[\] \-- filas con error de formato
>
> }
>
> **M03 Points Engine**
>
> *Cálculo, acreditación y reversión de puntos*

**Objetivo del módulo**

Toda la lógica de puntos vive aquí. Este módulo es llamado por M02
(import) y por M05 (admin API). Nunca modifica puntos sin pasar por
estas funciones.

**Función: assign_points_for_order**

Precondiciones que deben cumplirse antes de ejecutar:

-   order.status = \'active\'

-   order.loyalty_customer_id IS NOT NULL

-   order.points_processed_at IS NULL (no fue procesada antes)

-   order.total_amount \> 0

> FUNCTION assign_points_for_order(order_id):
>
> \-- 1. Lock the order row for update (prevent race conditions)
>
> order = SELECT \... FROM loyalty_orders WHERE id = order_id FOR UPDATE
>
> \-- 2. Re-check preconditions inside transaction
>
> IF order.points_processed_at IS NOT NULL: RETURN (already processed)
>
> IF order.loyalty_customer_id IS NULL: RETURN (no customer)
>
> IF order.status != \'active\': RETURN (not active)
>
> \-- 3. Get org config
>
> org = SELECT settings FROM organizations WHERE id =
> order.organization_id
>
> amount_per_point = org.settings-\>\>\'amount_per_point\' \-- default
> 10000
>
> \-- 4. Calculate points
>
> points = FLOOR(order.total_amount / amount_per_point) \-- integer
>
> IF points = 0: RETURN (below threshold, mark as processed with 0)
>
> \-- 5. Lock customer row
>
> customer = SELECT \... FROM loyalty_customers WHERE id =
> order.loyalty_customer_id FOR UPDATE
>
> \-- 6. Create transaction (ledger entry)
>
> INSERT INTO loyalty_transactions (
>
> organization_id, loyalty_customer_id, loyalty_order_id,
>
> type, points, balance_before, balance_after,
>
> description, created_by
>
> ) VALUES (
>
> \$org_id, \$customer_id, \$order_id,
>
> \'earn\', \$points, \$customer.points_balance,
>
> \$customer.points_balance + \$points,
>
> \'Compra del \' \|\| order.sale_date::date, \'system\'
>
> )
>
> \-- 7. Update customer balance
>
> UPDATE loyalty_customers SET
>
> points_balance = points_balance + \$points,
>
> total_points_earned = total_points_earned + \$points,
>
> last_activity_at = NOW(),
>
> updated_at = NOW()
>
> WHERE id = \$customer_id
>
> \-- 8. Mark order as processed
>
> UPDATE loyalty_orders SET
>
> points_assigned = \$points,
>
> points_processed_at = NOW(),
>
> updated_at = NOW()
>
> WHERE id = \$order_id
>
> COMMIT
>
> RETURN { points_assigned: \$points }

**Función: reverse_points_for_order**

Llamada cuando una venta activa y ya procesada cambia a status
\'cancelled\'.

> FUNCTION reverse_points_for_order(order_id):
>
> order = SELECT \... FROM loyalty_orders WHERE id = order_id FOR UPDATE
>
> \-- Only reverse if: was active, had points, was processed
>
> IF order.status != \'active\': RETURN (not reversible)
>
> IF order.points_processed_at IS NULL: RETURN (was never processed)
>
> IF order.points_assigned = 0: RETURN (had zero points)
>
> customer = SELECT \... FROM loyalty_customers
>
> WHERE id = order.loyalty_customer_id FOR UPDATE
>
> points_to_reverse = order.points_assigned \-- positive value
>
> INSERT INTO loyalty_transactions (
>
> organization_id, loyalty_customer_id, loyalty_order_id,
>
> type, points, balance_before, balance_after, description, created_by
>
> ) VALUES (
>
> \$org_id, \$customer_id, \$order_id,
>
> \'reversal\', -\$points_to_reverse,
>
> \$customer.points_balance,
>
> \$customer.points_balance - \$points_to_reverse,
>
> \'Anulación de venta \' \|\| order.external_sale_id, \'system\'
>
> )
>
> UPDATE loyalty_customers SET
>
> points_balance = points_balance - \$points_to_reverse,
>
> total_points_redeemed = total_points_redeemed, \-- no change
>
> updated_at = NOW()
>
> WHERE id = \$customer_id
>
> UPDATE loyalty_orders SET
>
> status = \'reversed\',
>
> updated_at = NOW()
>
> WHERE id = \$order_id
>
> COMMIT

**Función: redeem_points**

Llamada cuando un admin confirma un canje (fulfil). NO se descuentan
puntos al solicitar --- solo al confirmar.

> FUNCTION redeem_points(redemption_id, fulfilled_by_admin_id):
>
> redemption = SELECT \... FROM reward_redemptions WHERE id =
> redemption_id FOR UPDATE
>
> IF redemption.status != \'pending\': RETURN error(\'not_pending\')
>
> customer = SELECT \... FROM loyalty_customers
>
> WHERE id = redemption.loyalty_customer_id FOR UPDATE
>
> \-- Re-verify balance at fulfil time
>
> IF customer.points_balance \< redemption.points_cost:
>
> RETURN error(\'insufficient_points\')
>
> INSERT INTO loyalty_transactions (
>
> organization_id, loyalty_customer_id, reward_redemption_id,
>
> type, points, balance_before, balance_after, description, created_by
>
> ) VALUES (\...\'redeem\', -redemption.points_cost, \...)
>
> UPDATE loyalty_customers SET
>
> points_balance = points_balance - redemption.points_cost,
>
> total_points_redeemed = total_points_redeemed +
> redemption.points_cost,
>
> updated_at = NOW()
>
> WHERE id = redemption.loyalty_customer_id
>
> UPDATE reward_redemptions SET
>
> status = \'fulfilled\',
>
> fulfilled_at = NOW(),
>
> fulfilled_by = \$fulfilled_by_admin_id,
>
> updated_at = NOW()
>
> WHERE id = \$redemption_id
>
> COMMIT
>
> **Regla crítica:** Las tres funciones de este módulo DEBEN ejecutarse
> dentro de una transacción de base de datos con SELECT \... FOR UPDATE
> en las filas de customer y order. Sin esto, las condiciones de carrera
> pueden producir saldos incorrectos.
>
> **M04 Authentication**
>
> *JWT, OTP y control de sesiones*

**Dos flujos de autenticación independientes**

  --------------------------------------------------------------------------
  **Flujo**      **Actor**           **Método**              **Token TTL**
  -------------- ------------------- ----------------------- ---------------
  Admin Auth     admin_users         Email + Password        8 horas
                                     (bcrypt, cost≥12)       

  Customer Auth  loyalty_customers   Teléfono + OTP (6       30 días
                                     dígitos)                
  --------------------------------------------------------------------------

**JWT Payload --- Admin**

> {
>
> \"sub\": \"\<admin_user_id\>\",
>
> \"org\": \"\<organization_id\>\",
>
> \"role\": \"owner\" \| \"manager\" \| \"staff\",
>
> \"type\": \"admin\",
>
> \"iat\": \<unix_timestamp\>,
>
> \"exp\": \<unix_timestamp + 8h\>
>
> }

**JWT Payload --- Customer**

> {
>
> \"sub\": \"\<loyalty_customer_id\>\",
>
> \"org\": \"\<organization_id\>\",
>
> \"type\": \"customer\",
>
> \"iat\": \<unix_timestamp\>,
>
> \"exp\": \<unix_timestamp + 30d\>
>
> }

**OTP Flow --- Customer**

22. POST /api/v1/auth/request-otp { phone, org_slug }

23. Backend normaliza el teléfono (M02 normalize_phone).

24. Busca loyalty_customer por (org_id, phone). Si no existe: crea
    registro nuevo.

25. Genera código OTP: 6 dígitos, TTL 10 minutos, máximo 5 intentos por
    teléfono/hora (rate limit).

26. Guarda OTP hasheado en Redis con key otp:{org_id}:{phone_e164}.

27. Envía código por SMS/email (en MVP: solo email si disponible).

28. POST /api/v1/auth/verify-otp { phone, org_slug, code }

29. Valida código contra Redis. Si válido: eliminar de Redis, retornar
    JWT.

**Middleware de autorización**

Implementar como middleware encadenado en este orden:

> 1\. authenticate(req): verificar JWT, extraer payload, rechazar si
> expirado
>
> 2\. setOrgContext(req): establecer req.orgId = jwt.org
>
> 3\. requireAdminRole(roles): verificar jwt.type=\'admin\' y jwt.role
> in roles
>
> \- owner → acceso total
>
> \- manager → todo excepto: config.update, admin_users.\*
>
> \- staff → solo: redemptions.read, redemptions.fulfil
>
> 4\. requireCustomer(req): verificar jwt.type=\'customer\'
>
> Uso en rutas:
>
> router.get(\'/admin/customers\', authenticate,
> requireAdminRole(\[\'owner\',\'manager\'\]), \...)
>
> router.get(\'/me/points\', authenticate, requireCustomer, \...)
>
> **M05 Admin REST API**
>
> *Endpoints completos para el panel del restaurante*

**Convenciones globales de la API**

-   Base path: /api/v1

-   Todas las responses: Content-Type: application/json

-   Paginación: GET /resource?page=1&limit=20 → { data: \[\], total,
    page, limit }

-   Errores: { error: { code: string, message: string, details?: any } }

-   Filtros: query params, ej:
    ?status=pending&from=2026-01-01&to=2026-03-31

**Endpoints de autenticación admin**

  -------------------------------------------------------------------------------
  **Método**   **Ruta**                **Auth**   **Descripción**
  ------------ ----------------------- ---------- -------------------------------
  POST         /admin/auth/login       ---        Login con email + password.
                                                  Returns JWT.

  POST         /admin/auth/logout      Admin      Invalida sesión (blacklist
                                                  token en Redis).

  GET          /admin/auth/me          Admin      Perfil del admin autenticado.
  -------------------------------------------------------------------------------

**Endpoints de clientes**

  -------------------------------------------------------------------------------------------
  **Método**   **Ruta**                             **Roles**    **Descripción**
  ------------ ------------------------------------ ------------ ----------------------------
  GET          /admin/customers                     owner,       Lista paginada. Filtros:
                                                    manager      ?search=, ?active=

  GET          /admin/customers/:id                 owner,       Detalle + últimas 20
                                                    manager      transacciones.

  POST         /admin/customers/:id/adjust-points   owner        Ajuste manual. Body: {
                                                                 points, reason }.
  -------------------------------------------------------------------------------------------

**Endpoints de importación de ventas**

  ------------------------------------------------------------------------------
  **Método**   **Ruta**                **Roles**    **Descripción**
  ------------ ----------------------- ------------ ----------------------------
  POST         /admin/imports          owner,       Sube CSV.
                                       manager      multipart/form-data. Retorna
                                                    job_id.

  GET          /admin/imports/:jobId   owner,       Estado del job de
                                       manager      importación.

  GET          /admin/imports          owner,       Historial de importaciones.
                                       manager      

  GET          /admin/orders           owner,       Ventas importadas
                                       manager      paginadas + filtros.
  ------------------------------------------------------------------------------

**Endpoints de recompensas**

  ------------------------------------------------------------------------------
  **Método**   **Ruta**                **Roles**    **Descripción**
  ------------ ----------------------- ------------ ----------------------------
  GET          /admin/rewards          all admin    Lista todas las recompensas
                                                    del tenant.

  POST         /admin/rewards          owner,       Crear recompensa.
                                       manager      

  PUT          /admin/rewards/:id      owner,       Editar recompensa existente.
                                       manager      

  DELETE       /admin/rewards/:id      owner        Soft delete (is_active =
                                                    false).
  ------------------------------------------------------------------------------

**Endpoints de canjes**

  --------------------------------------------------------------------------------------
  **Método**   **Ruta**                        **Roles**    **Descripción**
  ------------ ------------------------------- ------------ ----------------------------
  GET          /admin/redemptions              all admin    Lista canjes. Default
                                                            filter: status=pending.

  POST         /admin/redemptions/:id/fulfil   all admin    Confirmar entrega. Llama
                                                            M03.redeem_points.

  POST         /admin/redemptions/:id/cancel   owner,       Cancelar canje pendiente.
                                               manager      
  --------------------------------------------------------------------------------------

**Endpoints de dashboard y configuración**

  ------------------------------------------------------------------------------
  **Método**   **Ruta**                **Roles**    **Descripción**
  ------------ ----------------------- ------------ ----------------------------
  GET          /admin/dashboard        all admin    Métricas: clientes activos,
                                                    puntos, canjes mes.

  GET          /admin/audit-log        owner        Log paginado. Filtros:
                                                    ?action=, ?from=, ?to=

  GET          /admin/config           all admin    Configuración actual del
                                                    tenant.

  PUT          /admin/config           owner        Actualizar regla de puntos y
                                                    configuración.
  ------------------------------------------------------------------------------

**Response shapes clave**

> \-- GET /admin/customers/:id
>
> {
>
> id, full_name, phone, email,
>
> points_balance, total_points_earned, total_points_redeemed,
>
> last_activity_at, created_at,
>
> recent_transactions: \[
>
> { id, type, points, balance_after, description, created_at }
>
> \]
>
> }
>
> \-- GET /admin/dashboard
>
> {
>
> active_customers: integer,
>
> points_in_circulation: integer,
>
> redemptions_this_month: { pending, fulfilled },
>
> top_rewards: \[{ name, redeemed_count }\],
>
> last_import: { created_at, inserted, matched }
>
> }
>
> **M06 Customer Web Portal**
>
> *Portal /club --- interfaz del cliente final*

**Objetivo del módulo**

Web app mobile-first accesible en /{org_slug}/club. No requiere app
móvil. Implementar con SSR para máxima compatibilidad.

**Rutas del portal**

  --------------------------------------------------------------------------------
  **Ruta**                 **Componente**    **Auth**   **Descripción**
  ------------------------ ----------------- ---------- --------------------------
  /{slug}/club             LandingPage       ---        Presentación del
                                                        programa + input de
                                                        teléfono

  /{slug}/club/verify      OTPVerify         ---        Input del código OTP
                                                        recibido

  /{slug}/club/dashboard   Dashboard         Customer   Saldo, progreso, últimas
                                                        transacciones

  /{slug}/club/rewards     RewardsCatalog    Customer   Catálogo de recompensas +
                                                        botón canjear

  /{slug}/club/history     PointsHistory     Customer   Historial completo
                                                        paginado
  --------------------------------------------------------------------------------

**Endpoints de la Customer API**

  ---------------------------------------------------------------------------------
  **Método**   **Ruta**                     **Descripción**
  ------------ ---------------------------- ---------------------------------------
  POST         /api/v1/auth/request-otp     Iniciar auth. Body: { phone, org_slug }

  POST         /api/v1/auth/verify-otp      Verificar OTP. Returns JWT customer.

  GET          /api/v1/me                   Perfil del cliente autenticado.

  GET          /api/v1/me/points            { balance, total_earned, total_redeemed
                                            }

  GET          /api/v1/me/transactions      Historial paginado. ?page=1&limit=10

  GET          /api/v1/rewards              Catálogo activo del tenant.

  POST         /api/v1/rewards/:id/redeem   Solicitar canje. Crea redemption
                                            pending.

  GET          /api/v1/me/redemptions       Historial de canjes del cliente.
  ---------------------------------------------------------------------------------

**Especificación de pantallas clave**

**Dashboard (/club/dashboard)**

-   Mostrar points_balance con tipografía grande (hero number).

-   Progress bar: puntos hacia el próximo reward (el de menor costo \>
    balance actual).

-   Lista de últimas 5 transacciones con tipo (earn / redeem), puntos y
    fecha.

-   Botón CTA → /club/rewards

**Catálogo de Recompensas (/club/rewards)**

-   Cards por reward: imagen (si existe), nombre, descripción, costo en
    puntos.

-   Visual diferenciado: card en verde/activo si balance \>=
    points_cost; gris/bloqueado si no alcanza.

-   Al hacer clic en \'Canjear\': confirmar con modal \'¿Confirmar canje
    de X puntos por \[nombre\]?\'

-   POST /api/v1/rewards/:id/redeem → mostrar toast \'Canje solicitado.
    Retirá tu recompensa en caja.\'

**Multi-tenancy en el frontend**

El slug de la organización se resuelve desde la URL y se pasa como
header en todas las API calls:

> // Todas las requests del portal incluyen:
>
> headers: {
>
> \'X-Organization-Slug\': \'{slug}\', // El backend resuelve org_id
> desde el slug
>
> \'Authorization\': \'Bearer {jwt}\' // Solo en rutas autenticadas
>
> }
>
> **M07 Security & Audit**
>
> *Controles de seguridad y trazabilidad de operaciones*

**Controles de seguridad obligatorios**

  -----------------------------------------------------------------------------
  **Control**            **Implementación**         **Aplica a**
  ---------------------- -------------------------- ---------------------------
  Rate limiting OTP      5 intentos/hora por        POST /auth/request-otp
                         phone+org. Redis counter   
                         con TTL 1h.                

  Rate limiting login    10 intentos/hora por       POST /admin/auth/login
                         email+org. Bloqueo con     
                         backoff.                   

  HTTPS only             Forzar HTTPS. HSTS header. Todos los endpoints
                         Sin fallback HTTP.         

  CORS                   Whitelist: solo dominios   API backend
                         propios del SaaS.          

  Security headers       HSTS, X-Frame-Options,     Todas las responses
                         CSP, X-Content-Type        

  Password hashing       bcrypt con cost factor \>= admin_users.password_hash
                         12.                        

  Token blacklist        JWT inválidos post-logout  Admin logout
                         en Redis con TTL = exp.    

  SQL injection          ÚNICAMENTE prepared        Toda la capa DB
                         statements / ORM           
                         parametrizado.             

  Org isolation check    Middleware valida org_id   Todos los endpoints
                         del JWT vs org_id del      
                         recurso.                   
  -----------------------------------------------------------------------------

**Eventos que deben auditarse**

  ---------------------------------------------------------------------------------------------
  **action (audit_log)** **Trigger**                          **payload mínimo**
  ---------------------- ------------------------------------ ---------------------------------
  points.earn            assign_points_for_order              { order_id, points,
                                                              balance_before, balance_after }

  points.reversal        reverse_points_for_order             { order_id, points_reversed,
                                                              balance_after }

  points.manual_adjust   POST                                 { delta, reason, balance_before,
                         /admin/customers/:id/adjust-points   balance_after }

  redemption.request     POST /rewards/:id/redeem             { reward_id, points_cost }

  redemption.fulfil      POST /redemptions/:id/fulfil         { redemption_id, fulfilled_by }

  redemption.cancel      POST /redemptions/:id/cancel         { redemption_id, reason }

  import.completed       End of M02 pipeline                  { job_id, inserted, matched,
                                                              points_assigned }

  admin.login            POST /admin/auth/login (success)     { email (hashed), ip }

  config.update          PUT /admin/config                    { before: {\...}, after: {\...} }

  reward.create          POST /admin/rewards                  { reward_id, name, points_cost }
  ---------------------------------------------------------------------------------------------

**Función write_audit_log**

> FUNCTION write_audit_log({
>
> org_id, actor_type, actor_id,
>
> action, resource_type, resource_id,
>
> payload, ip_address
>
> }):
>
> \-- SIEMPRE ejecutar ANTES de retornar 200 en el endpoint
>
> \-- Usar la misma transacción de DB cuando sea posible
>
> \-- Si falla el audit log → rollback de la operación principal
>
> \-- (el audit log es parte del contrato, no opcional)
>
> INSERT INTO audit_log (organization_id, actor_type, actor_id,
>
> action, resource_type, resource_id, payload, ip_address)
>
> VALUES (\$org_id, \$actor_type, \$actor_id,
>
> \$action, \$resource_type, \$resource_id, \$payload::jsonb, \$ip)
>
> **Invariante de auditoría:** Si una operación modifica puntos (earn,
> redeem, reversal, adjust) y NO genera una fila en audit_log dentro de
> la misma transacción, la operación debe hacer rollback completo. No
> existe modificación de puntos sin trazabilidad.

**Orden de Implementación Recomendado**

El generador debe implementar los módulos en este orden para minimizar
bloqueos entre dependencias:

  -------------------------------------------------------------------------
  **Fase**    **Módulos**   **Entregable verificable**
  ----------- ------------- -----------------------------------------------
  Fase 1 ---  M01           Migrations corren sin error. Índices creados.
  Base                      Schema validado.

  Fase 2 ---  M02 + M03     Importar CSV de prueba → puntos acreditados
  Core                      correctamente. Deduplicación confirmada.

  Fase 3 ---  M04           Admin puede loguearse. Cliente puede verificar
  Auth                      OTP. JWTs válidos.

  Fase 4 ---  M05           Todos los endpoints admin retornan datos
  API                       correctos con auth.

  Fase 5 ---  M06           Portal /club funciona en mobile. Canje
  UI                        solicitable end-to-end.

  Fase 6 ---  M07           Audit log completo. Rate limits activos.
  Hardening                 Headers de seguridad.
  -------------------------------------------------------------------------

**Casos de prueba críticos (test suite mínima)**

-   Importar el mismo CSV dos veces → mismo saldo final (idempotencia).

-   Venta con total \$9.999 → 0 puntos asignados.

-   Venta con total \$10.000 → 1 punto asignado.

-   Anular venta ya acreditada → reversal exacto de puntos.

-   Anular venta no acreditada → sin reversal.

-   Canjear con puntos insuficientes al momento del fulfil → error 422.

-   Importar venta sin teléfono ni email → match_method = \'unmatched\',
    sin puntos.

-   Admin con rol \'staff\' intenta PUT /admin/config → 403 Forbidden.

-   Request con JWT de org A intentando acceder a customer de org B →
    403.

-   Teléfono \'(223) 456-7890\' normalizado para AR → \'+542234567890\'.

*Loyalty SaaS · Technical Blueprint v1.0 · Marzo 2026*
