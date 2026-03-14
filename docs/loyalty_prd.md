**LOYALTY SAAS**

para Restaurantes

*Product Requirements Document & Technical Specification*

Proyecto piloto:

**Restaurante Gloria**

Sistema Multi-Tenant / Versión MVP

Marzo 2026

**Índice de Contenidos**

**1. Product Overview**

**1.1 Descripción del Producto**

Loyalty SaaS es una plataforma web multi-tenant de fidelización de
clientes diseñada específicamente para restaurantes. Permite importar
ventas desde el POS, vincular automáticamente transacciones con
clientes, asignar puntos y gestionar un programa de recompensas
accesible desde el navegador, sin necesidad de aplicación móvil.

El sistema opera como Software as a Service (SaaS): un único sistema
central sirve a múltiples restaurantes (tenants), cada uno con sus
propios datos completamente aislados.

**1.2 Problema que Resuelve**

-   Los restaurantes no tienen herramienta simple para fidelizar
    clientes recurrentes.

-   Los sistemas de puntos existentes son caros, complejos o requieren
    apps móviles.

-   Los restaurantes ya tienen datos de ventas en su POS, pero no los
    aprovechan para retención.

-   No existe un sistema que vincule automáticamente ventas históricas
    con clientes sin intervención manual.

**1.3 Para Quién está Diseñado**

  -----------------------------------------------------------------------
  **Usuario**            **Descripción**
  ---------------------- ------------------------------------------------
  Restaurante (Admin)    Dueños o managers que importan ventas,
                         configuran recompensas y monitorean el programa.

  Cliente Final          Consumidores que acumulan puntos y canjean
                         recompensas desde el browser.

  Super Admin (SaaS)     Operador del SaaS que gestiona organizaciones y
                         configuración global del sistema.
  -----------------------------------------------------------------------

> **Piloto:** El primer tenant es el Restaurante Gloria. La arquitectura
> está diseñada para escalar a cientos de restaurantes.

**2. Core Features**

**2.1 Funcionalidades del Cliente Final**

-   Registro con número de teléfono (sin contraseña, via OTP o link
    mágico).

-   Visualización del saldo de puntos en tiempo real.

-   Historial detallado de transacciones (puntos ganados y canjeados).

-   Catálogo de recompensas disponibles con costo en puntos.

-   Solicitud de canje de recompensas desde el navegador.

-   Perfil básico (nombre, teléfono, email).

**2.2 Funcionalidades del Restaurante (Admin)**

-   Panel de administración web protegido por autenticación.

-   Importación de ventas desde CSV exportado del POS.

-   Vista de clientes con saldo de puntos y actividad.

-   Gestión de recompensas (crear, editar, desactivar).

-   Vista de canjes pendientes y aprobados.

-   Log de auditoría de todas las operaciones críticas.

-   Configuración de la regla de puntos (ej: \$10.000 = 1 punto).

-   Dashboard con métricas básicas (clientes activos, puntos en
    circulación, canjes del mes).

**2.3 Funcionalidades del Sistema Interno**

-   Motor de matching de ventas con clientes (por ID, teléfono, email).

-   Normalización de teléfonos antes de comparación.

-   Cálculo automático de puntos por venta.

-   Deduplicación: cada venta externa solo genera puntos una vez.

-   Procesamiento de reversión de puntos ante ventas anuladas.

-   Aislamiento de datos por organization_id en todas las tablas.

-   Pipeline de importación idempotente y auditable.

**3. User Flows**

**3.1 Registro de Cliente**

1.  El cliente accede a /club desde el browser.

2.  Ingresa su número de teléfono.

3.  Recibe un código OTP (SMS o WhatsApp) o link mágico por email.

4.  Verifica su identidad con el código.

5.  Si existe en loyalty_customers (por teléfono normalizado), se
    vincula la sesión.

6.  Si no existe, se crea un registro nuevo con teléfono como
    identificador principal.

7.  El sistema muestra el saldo de puntos actual y las recompensas
    disponibles.

> **Nota:** En MVP, el OTP puede simplificarse a un código de 6 dígitos
> enviado por email si el cliente tiene email registrado.

**3.2 Acreditación Automática de Puntos**

8.  El restaurante exporta ventas desde el POS (CSV o acceso directo a
    DB).

9.  El admin sube el archivo al panel o ejecuta sincronización.

10. El pipeline normaliza y procesa cada venta.

11. Para cada venta, el sistema verifica si ya fue procesada
    (external_sale_id).

12. Si es nueva, intenta vincular con un loyalty_customer (por
    cliente_id, teléfono, email).

13. Si se vincula, calcula puntos = floor(total / puntos_por_peso) y
    crea un loyalty_transaction.

14. El saldo del cliente se actualiza en
    loyalty_customers.points_balance.

15. Si no se vincula, la venta queda como \"sin cliente\" para revisión
    manual.

**3.3 Visualización de Puntos**

16. Cliente autenticado accede a /club/dashboard.

17. El frontend llama a GET /api/v1/me/points.

18. Se muestra saldo actual, recompensas disponibles y las últimas 10
    transacciones.

**3.4 Canje de Recompensas**

19. Cliente selecciona una recompensa disponible desde /club/rewards.

20. El sistema verifica que tenga suficientes puntos.

21. Se crea un reward_redemption con estado \'pending\'.

22. El restaurante ve el canje pendiente en el panel admin.

23. Al entregar la recompensa, el admin marca el canje como
    \'fulfilled\'.

24. Los puntos se descuentan del saldo del cliente (loyalty_transaction
    tipo \'redemption\').

**3.5 Importación de Ventas**

25. Admin accede a la sección Importar Ventas en el panel.

26. Sube un archivo CSV exportado del POS con el formato esperado.

27. El sistema valida columnas requeridas y formato de datos.

28. Se ejecuta el pipeline de matching y asignación de puntos.

29. Se muestra un resumen: N ventas procesadas, N clientes vinculados, N
    puntos asignados, N sin vincular.

**4. System Architecture**

**4.1 Componentes del Sistema**

El sistema se compone de cuatro capas principales:

  -----------------------------------------------------------------------
  **Capa**           **Tecnología sugerida**   **Responsabilidad**
  ------------------ ------------------------- --------------------------
  Frontend           React / Next.js           Web app cliente + panel
                                               admin

  Backend API        Node.js + Express o       REST API, lógica de
                     FastAPI (Python)          negocio, auth

  Base de Datos      PostgreSQL                Persistencia relacional,
                                               multi-tenant

  Jobs / Workers     Cron + Queue (BullMQ o    Importación periódica,
                     similar)                  procesamiento async

  Auth               JWT + OTP / Magic Link    Autenticación clientes y
                                               admins

  Storage            S3 o equivalente          Archivos CSV subidos
  -----------------------------------------------------------------------

**4.2 Diagrama de Alto Nivel**

> POS del Restaurante
>
> ↓ CSV Export / DB Query
>
> Import Pipeline (Job/Worker)
>
> ↓ Matching + Points Engine
>
> PostgreSQL (multi-tenant)
>
> ↑ ↑
>
> Admin Panel Cliente Web (/club)
>
> (React) (React)
>
> ↕ ↕
>
> REST API (Backend)

**4.3 Integraciones Externas**

-   POS del restaurante: integración via exportación CSV (MVP). En v2:
    conector directo a DB o API del POS.

-   SMS/WhatsApp: proveedor OTP (Twilio, MessageBird) para verificación
    de teléfono.

-   Email: servicio transaccional (SendGrid, Resend) para
    notificaciones.

**5. Multi-Tenant Model**

**5.1 Aislamiento por organization_id**

Cada restaurante es una organización (tenant). Todos los datos del
sistema están vinculados a un organization_id, que es una clave foránea
presente en absolutamente todas las tablas de negocio.

Reglas de aislamiento:

-   Todas las queries de negocio incluyen WHERE organization_id =
    :orgId.

-   Los tokens JWT del admin incluyen organization_id en el payload.

-   El backend valida en cada request que el resource pertenece a la
    organización del token.

-   No existe ningún endpoint que pueda retornar datos de múltiples
    organizaciones mezclados (salvo el Super Admin).

**5.2 Modelo de Organizaciones**

-   Una organización tiene un plan (free, starter, pro) que determina
    límites (clientes, importaciones/mes, etc.).

-   Una organización tiene uno o más admin_users.

-   Una organización tiene una loyalty_config con reglas de puntos y
    recompensas.

-   Cada organización puede tener su propio subdominio o path:
    /club/{slug}.

**5.3 Super Admin**

El Super Admin (operador del SaaS) tiene acceso a un panel separado
para:

-   Crear y gestionar organizaciones.

-   Ver métricas globales del sistema.

-   Desactivar tenants en caso de abuso.

-   Configurar límites por plan.

**6. Data Model**

**6.1 Tabla: organizations**

Representa a cada restaurante/tenant en el sistema.

-   id (UUID, PK)

-   name --- nombre del restaurante

-   slug --- identificador URL (ej: \'gloria\')

-   plan --- tier de servicio (free, starter, pro)

-   settings --- JSON con configuración personalizada

-   is_active --- boolean

-   created_at, updated_at

**6.2 Tabla: loyalty_customers**

Clientes del programa de fidelización de cada restaurante.

-   id (UUID, PK)

-   organization_id (FK → organizations)

-   external_customer_id --- ID del cliente en el POS (nullable)

-   phone --- teléfono normalizado (E.164)

-   email --- email normalizado (lowercase)

-   full_name

-   points_balance --- saldo actual de puntos (integer)

-   total_points_earned --- acumulado histórico

-   total_points_redeemed --- total canjeado

-   is_active

-   auth_token --- para sesión del cliente

-   last_activity_at

-   created_at, updated_at

**6.3 Tabla: loyalty_orders**

Ventas importadas desde el POS, vinculadas o no a un cliente.

-   id (UUID, PK)

-   organization_id (FK → organizations)

-   external_sale_id --- ID único de la venta en el POS (para
    deduplicación)

-   loyalty_customer_id (FK → loyalty_customers, nullable)

-   sale_date --- fecha de la venta

-   total_amount --- monto total de la venta

-   sale_type --- delivery, takeaway, local

-   payment_method

-   status --- active, cancelled, reversed

-   points_assigned --- puntos asignados por esta venta

-   points_processed_at --- timestamp de procesamiento

-   raw_data --- JSON con datos originales del CSV (para auditoría)

-   match_method --- cómo se vinculó: customer_id, phone, email,
    unmatched

-   created_at, updated_at

**6.4 Tabla: loyalty_transactions**

Registro inmutable de cada movimiento de puntos.

-   id (UUID, PK)

-   organization_id (FK → organizations)

-   loyalty_customer_id (FK → loyalty_customers)

-   loyalty_order_id (FK → loyalty_orders, nullable)

-   reward_redemption_id (FK → reward_redemptions, nullable)

-   type --- earn, redeem, adjust, reversal

-   points --- cantidad de puntos (positivo o negativo)

-   balance_before --- saldo previo

-   balance_after --- saldo posterior

-   description --- texto descriptivo para el cliente

-   created_by --- user_id o \'system\'

-   created_at

**6.5 Tabla: loyalty_rewards**

Catálogo de recompensas configuradas por el restaurante.

-   id (UUID, PK)

-   organization_id (FK → organizations)

-   name --- nombre de la recompensa (ej: \'Papas gratis\')

-   description

-   points_cost --- puntos necesarios para canjear

-   is_active

-   stock --- null si ilimitado, número si tiene límite

-   image_url (opcional)

-   valid_from, valid_until (optional date range)

-   created_at, updated_at

**6.6 Tabla: reward_redemptions**

Registro de cada canje solicitado y su estado.

-   id (UUID, PK)

-   organization_id (FK → organizations)

-   loyalty_customer_id (FK → loyalty_customers)

-   loyalty_reward_id (FK → loyalty_rewards)

-   status --- pending, fulfilled, cancelled, expired

-   points_cost --- puntos descontados

-   requested_at

-   fulfilled_at (nullable)

-   fulfilled_by --- admin user_id (nullable)

-   notes --- comentario del admin

-   created_at, updated_at

**6.7 Tabla: admin_users**

Usuarios administrativos del restaurante.

-   id (UUID, PK)

-   organization_id (FK → organizations)

-   email

-   password_hash

-   role --- owner, manager, staff

-   is_active

-   last_login_at

-   created_at, updated_at

**6.8 Tabla: audit_log**

Log inmutable de todas las operaciones críticas.

-   id (UUID, PK)

-   organization_id

-   actor_type --- admin_user, customer, system

-   actor_id

-   action --- string descriptor (ej: \'points.earn\',
    \'redemption.fulfil\')

-   resource_type --- tabla afectada

-   resource_id --- ID del registro afectado

-   payload --- JSON con datos relevantes antes/después

-   ip_address

-   created_at

**7. SQL Schema (High Level)**

**7.1 Esquema SQL Básico**

> CREATE TABLE organizations (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> name VARCHAR(255) NOT NULL,
>
> slug VARCHAR(100) UNIQUE NOT NULL,
>
> plan VARCHAR(50) DEFAULT \'free\',
>
> settings JSONB DEFAULT \'{}\',
>
> is_active BOOLEAN DEFAULT true,
>
> created_at TIMESTAMPTZ DEFAULT NOW(),
>
> updated_at TIMESTAMPTZ DEFAULT NOW()
>
> );
>
> CREATE TABLE loyalty_customers (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> organization_id UUID NOT NULL REFERENCES organizations(id),
>
> external_customer_id VARCHAR(100),
>
> phone VARCHAR(30),
>
> email VARCHAR(255),
>
> full_name VARCHAR(255),
>
> points_balance INTEGER NOT NULL DEFAULT 0,
>
> total_points_earned INTEGER NOT NULL DEFAULT 0,
>
> total_points_redeemed INTEGER NOT NULL DEFAULT 0,
>
> is_active BOOLEAN DEFAULT true,
>
> last_activity_at TIMESTAMPTZ,
>
> created_at TIMESTAMPTZ DEFAULT NOW(),
>
> updated_at TIMESTAMPTZ DEFAULT NOW(),
>
> UNIQUE (organization_id, phone),
>
> UNIQUE (organization_id, email)
>
> );
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
> total_amount NUMERIC(12,2) NOT NULL,
>
> sale_type VARCHAR(50),
>
> payment_method VARCHAR(100),
>
> status VARCHAR(30) DEFAULT \'active\',
>
> points_assigned INTEGER DEFAULT 0,
>
> points_processed_at TIMESTAMPTZ,
>
> raw_data JSONB DEFAULT \'{}\',
>
> match_method VARCHAR(30),
>
> created_at TIMESTAMPTZ DEFAULT NOW(),
>
> updated_at TIMESTAMPTZ DEFAULT NOW(),
>
> UNIQUE (organization_id, external_sale_id)
>
> );
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
> points INTEGER NOT NULL,
>
> balance_before INTEGER NOT NULL,
>
> balance_after INTEGER NOT NULL,
>
> description TEXT,
>
> created_by VARCHAR(100),
>
> created_at TIMESTAMPTZ DEFAULT NOW()
>
> );
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
> points_cost INTEGER NOT NULL,
>
> is_active BOOLEAN DEFAULT true,
>
> stock INTEGER,
>
> image_url TEXT,
>
> valid_from TIMESTAMPTZ,
>
> valid_until TIMESTAMPTZ,
>
> created_at TIMESTAMPTZ DEFAULT NOW(),
>
> updated_at TIMESTAMPTZ DEFAULT NOW()
>
> );
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
> status VARCHAR(30) DEFAULT \'pending\',
>
> points_cost INTEGER NOT NULL,
>
> requested_at TIMESTAMPTZ DEFAULT NOW(),
>
> fulfilled_at TIMESTAMPTZ,
>
> fulfilled_by UUID REFERENCES admin_users(id),
>
> notes TEXT,
>
> created_at TIMESTAMPTZ DEFAULT NOW(),
>
> updated_at TIMESTAMPTZ DEFAULT NOW()
>
> );
>
> \-- Índices recomendados
>
> CREATE INDEX ON loyalty_customers (organization_id, phone);
>
> CREATE INDEX ON loyalty_customers (organization_id, email);
>
> CREATE INDEX ON loyalty_orders (organization_id, external_sale_id);
>
> CREATE INDEX ON loyalty_transactions (loyalty_customer_id, created_at
> DESC);
>
> CREATE INDEX ON reward_redemptions (organization_id, status);

**8. Point Assignment Logic**

**8.1 Regla de Cálculo**

La regla de puntos es configurable por organización en la tabla
loyalty_config (parte del settings de la organización):

> points_earned = FLOOR(total_amount / amount_per_point)

Ejemplo con la regla de Gloria:

-   amount_per_point = 10000

-   Venta de \$45.000 → FLOOR(45000 / 10000) = 4 puntos

-   Venta de \$9.999 → FLOOR(9999 / 10000) = 0 puntos (no acredita)

**8.2 Deduplicación (Prevención de Doble Acreditación)**

La deduplicación es garantizada a nivel de base de datos por la
constraint:

> UNIQUE (organization_id, external_sale_id)

El pipeline de importación utiliza INSERT \... ON CONFLICT DO NOTHING
para ventas ya existentes. Si la venta ya existe y points_processed_at
no es null, se omite el procesamiento de puntos por completo.

**8.3 Ventas Anuladas**

30. Si una venta importada llega con status = \'cancelled\' o
    \'anulada\':

31. El sistema verifica si ya generó puntos (points_assigned \> 0 y
    points_processed_at no null).

32. Si generó puntos, se crea una loyalty_transaction de tipo
    \'reversal\' con puntos negativos.

33. Se actualiza el points_balance del cliente.

34. La loyalty_order queda con status = \'reversed\'.

> **Importante:** Una reversal solo ocurre si la venta efectivamente
> había asignado puntos previamente. No se generan transacciones en
> negativo si la venta original no fue procesada.

**9. Fraud Prevention**

**9.1 Doble Acreditación**

-   La constraint UNIQUE (organization_id, external_sale_id) hace
    imposible insertar la misma venta dos veces.

-   El campo points_processed_at actúa como flag idempotente: si está
    seteado, no se vuelve a procesar.

-   Todas las transacciones de puntos son inmutables (no se pueden
    editar, solo crear reversals).

**9.2 Manipulación de Tickets**

-   El campo raw_data en loyalty_orders guarda el JSON original del CSV
    para auditoría.

-   El monto total (total_amount) no puede ser modificado una vez
    procesado.

-   Los ajustes manuales de puntos solo pueden hacerlos admin_users con
    rol \'owner\' o \'manager\', y quedan registrados en audit_log.

**9.3 Ventas Inválidas**

-   Se filtran ventas con total_amount \<= 0.

-   Se filtran ventas con sale_date fuera de un rango razonable (ej: más
    de 1 año de antigüedad o fecha futura).

-   Ventas sin un loyalty_customer vinculado se marcan como
    \'unmatched\' y no generan puntos hasta ser vinculadas manualmente.

**9.4 Protección del Canje**

-   El descuento de puntos solo ocurre cuando el admin confirma el canje
    (fulfilled), no en el momento de la solicitud.

-   El sistema verifica en el momento del fulfilled que el cliente aún
    tiene suficientes puntos.

-   Un redemption en estado \'pending\' no bloquea los puntos (diseño
    simple de MVP).

**10. Sales Import Pipeline**

**10.1 Fuente de Datos**

En el MVP, la fuente de datos es un archivo CSV exportado manualmente
desde el POS del restaurante. El formato esperado corresponde a las
columnas definidas en la sección de datos del POS.

**10.2 Columnas Requeridas del CSV**

  -----------------------------------------------------------------------
  **Columna CSV**         **Campo interno**       **Notas**
  ----------------------- ----------------------- -----------------------
  Id                      external_sale_id        Identificador único de
                                                  la venta

  Fecha                   sale_date               Fecha y hora de la
                                                  venta

  Total                   total_amount            Monto total, acepta
                                                  coma o punto decimal

  Id. Cliente             external_customer_id    Opcional, para matching
                                                  por ID

  Teléfono del Cliente    phone_raw               Teléfono sin normalizar

  Email del Cliente       email_raw               Email sin normalizar

  Estado                  status                  Para detectar
                                                  cancelaciones

  Tipo de Venta           sale_type               delivery, take away,
                                                  local
  -----------------------------------------------------------------------

**10.3 Proceso de Sincronización**

35. Validación de formato: se verifican columnas requeridas y tipos de
    datos.

36. Normalización: teléfonos a E.164, emails a lowercase, montos a
    numeric.

37. Upsert de ventas: INSERT \... ON CONFLICT (organization_id,
    external_sale_id) DO NOTHING.

38. Matching de clientes: algoritmo en cascada (ver sección 11).

39. Cálculo de puntos: solo para ventas nuevas, vinculadas y activas.

40. Creación de loyalty_transactions para cada punto asignado.

41. Actualización de points_balance en loyalty_customers.

42. Generación de reporte de importación.

**11. Client Matching Logic**

**11.1 Algoritmo de Vinculación en Cascada**

El sistema intenta vincular cada venta con un loyalty_customer en este
orden estricto:

43. Paso 1 --- Por external_customer_id: Si la venta tiene Id. Cliente y
    existe un loyalty_customer con ese external_customer_id para la
    misma organización → match directo.

44. Paso 2 --- Por teléfono normalizado: Se normaliza el teléfono de la
    venta a E.164 y se busca en loyalty_customers.phone. Si hay
    coincidencia exacta → match.

45. Paso 3 --- Por email normalizado: Se normaliza el email a lowercase
    y se busca en loyalty_customers.email. Si hay coincidencia exacta →
    match.

46. Sin match: La venta queda con loyalty_customer_id = NULL y
    match_method = \'unmatched\'. No se asignan puntos.

**11.2 Normalización de Teléfonos**

Algoritmo de normalización para Argentina (adaptable por organización):

-   Eliminar espacios, guiones, paréntesis.

-   Si empieza con \'0\': remover el \'0\' inicial.

-   Si empieza con \'15\': remover el \'15\' y agregar código de área de
    la organización.

-   Agregar prefijo de país +54 si no está presente.

-   Formato final: +54XXXXXXXXXX (E.164).

> Ejemplos:
>
> \'011 15-3456-7890\' → \'+5411 3456 7890\' → \'+541134567890\'
>
> \'(223) 456-7890\' → \'+5422 3456 7890\' → \'+542234567890\'

**11.3 Re-procesamiento de Ventas Sin Vincular**

Cuando un cliente se registra en /club, el sistema puede re-procesar las
ventas históricas \'unmatched\' que coincidan con su teléfono o email.
Esto permite acreditar puntos retroactivos de forma controlada. Esta
operación debe ser registrada en audit_log.

**12. API Design**

**12.1 Convenciones**

-   Base URL: /api/v1

-   Autenticación: Bearer token JWT en header Authorization.

-   Formato: JSON en todas las requests y responses.

-   Paginación: parámetros page y limit en endpoints de listas.

-   Errores: formato estándar { error: { code, message, details } }.

**12.2 Endpoints --- Cliente Final**

  -------------------------------------------------------------------------
  **Método**   **Endpoint**           **Descripción**
  ------------ ---------------------- -------------------------------------
  POST         /auth/request-otp      Solicitar OTP por teléfono/email

  POST         /auth/verify-otp       Verificar OTP y obtener JWT

  GET          /me                    Perfil del cliente autenticado

  GET          /me/points             Saldo y resumen de puntos

  GET          /me/transactions       Historial de transacciones paginado

  GET          /rewards               Catálogo de recompensas activas

  POST         /rewards/{id}/redeem   Solicitar canje de recompensa

  GET          /me/redemptions        Historial de canjes del cliente
  -------------------------------------------------------------------------

**12.3 Endpoints --- Admin**

  ----------------------------------------------------------------------------------
  **Método**   **Endpoint**                     **Descripción**
  ------------ -------------------------------- ------------------------------------
  POST         /admin/auth/login                Login admin con email/password

  GET          /admin/customers                 Lista de loyalty_customers paginada

  GET          /admin/customers/{id}            Detalle de un cliente y sus puntos

  GET          /admin/orders                    Lista de ventas importadas

  POST         /admin/orders/import             Subir CSV de ventas

  GET          /admin/rewards                   Lista de recompensas

  POST         /admin/rewards                   Crear recompensa

  PUT          /admin/rewards/{id}              Editar recompensa

  GET          /admin/redemptions               Lista de canjes (pendientes primero)

  POST         /admin/redemptions/{id}/fulfil   Confirmar entrega de canje

  POST         /admin/redemptions/{id}/cancel   Cancelar canje pendiente

  GET          /admin/audit-log                 Log de auditoría paginado

  GET          /admin/dashboard                 Métricas resumen del dashboard

  PUT          /admin/config                    Actualizar configuración de puntos
  ----------------------------------------------------------------------------------

**13. Admin Panel**

**13.1 Secciones del Panel**

**Dashboard**

-   Total de clientes activos en el programa.

-   Puntos en circulación (suma de points_balance de todos los
    clientes).

-   Canjes del mes (fulfilled y pendientes).

-   Últimas importaciones y estado.

**Clientes**

-   Tabla con: nombre, teléfono, email, puntos actuales, última
    actividad.

-   Búsqueda por nombre, teléfono o email.

-   Vista detalle con historial completo de transacciones.

-   Acción: ajuste manual de puntos (con justificación requerida).

**Ventas Importadas**

-   Tabla con: fecha, total, cliente vinculado, puntos asignados, método
    de match.

-   Filtros por fecha, estado y tipo de venta.

-   Botón \'Importar CSV\'.

-   Indicador de ventas sin vincular.

**Recompensas**

-   Lista de recompensas activas e inactivas.

-   Crear / editar / desactivar recompensas.

-   Ver cuántas veces fue canjeada cada recompensa.

**Canjes**

-   Lista de canjes ordenados por fecha (pendientes primero).

-   Acción: marcar como entregado o cancelar.

-   Historial de canjes completados.

**Auditoría**

-   Log completo de operaciones críticas.

-   Filtros por actor, acción y rango de fechas.

**Configuración**

-   Regla de puntos (monto por punto).

-   Nombre y datos del restaurante.

-   Gestión de usuarios admin.

**14. Customer Web Interface**

**14.1 Páginas del Portal /club**

**/ club (Landing / Registro)**

-   Presentación del programa de fidelización del restaurante.

-   Campo para ingresar número de teléfono.

-   Botón \'Ver mis puntos\' / \'Registrarme\'.

**/club/verify**

-   Campo para ingresar código OTP recibido.

-   Opción de reenviar código.

**/club/dashboard**

-   Saldo de puntos grande y visible.

-   Barra de progreso hacia la próxima recompensa.

-   Últimas 5 transacciones.

-   Botón \'Ver todas las recompensas\'.

**/club/rewards**

-   Tarjetas de cada recompensa disponible.

-   Indicación visual de cuáles ya puede canjear (puntos suficientes).

-   Botón \'Canjear\' en cada recompensa.

**/club/history**

-   Historial completo de movimientos de puntos.

-   Fecha, descripción y puntos ganados/canjeados por transacción.

**14.2 Principios de UX**

-   Mobile-first: diseñado para funcionar perfectamente en el teléfono
    del cliente.

-   Sin fricción: el cliente ve sus puntos con el mínimo de pasos
    posibles.

-   Claridad: mostrar siempre cuántos puntos faltan para la próxima
    recompensa.

**15. Security Model**

**15.1 Autenticación**

  -----------------------------------------------------------------------
  **Actor**          **Método**              **Token**
  ------------------ ----------------------- ----------------------------
  Admin              Email + Password        JWT con organization_id,
                     (bcrypt)                role, exp corto

  Cliente Final      OTP por teléfono/email  JWT con customer_id,
                                             organization_id

  Super Admin        Email + Password + 2FA  JWT separado con
                                             scope=superadmin
  -----------------------------------------------------------------------

**15.2 Permisos**

-   owner: acceso total al panel del restaurante, incluyendo
    configuración y ajustes de puntos.

-   manager: acceso a operaciones del día a día, sin configuración.

-   staff: solo puede ver canjes pendientes y marcarlos como entregados.

**15.3 Protección de Datos**

-   Todas las comunicaciones por HTTPS.

-   Passwords hasheadas con bcrypt (costo \>= 12).

-   PII (teléfono, email, nombre) nunca expuesto en logs ni en audit_log
    en texto plano.

-   Rate limiting en endpoints de OTP para prevenir brute force.

-   CORS configurado para aceptar solo orígenes del dominio del SaaS.

-   Headers de seguridad: HSTS, X-Frame-Options,
    Content-Security-Policy.

**15.4 Aislamiento Multi-Tenant**

-   Todo request autenticado lleva organization_id en el JWT.

-   Middleware del backend valida organization_id en cada operación.

-   No existen endpoints que mezclen datos de distintos tenants.

**16. Audit Logging**

**16.1 Eventos que Generan Registro de Auditoría**

  -----------------------------------------------------------------------
  **Evento (action)**         **Descripción**
  --------------------------- -------------------------------------------
  points.earn                 Puntos asignados a cliente por venta

  points.reversal             Puntos revertidos por venta anulada

  points.manual_adjust        Ajuste manual de puntos por admin

  redemption.request          Cliente solicita canje

  redemption.fulfil           Admin confirma entrega de canje

  redemption.cancel           Admin cancela canje pendiente

  import.completed            Importación de CSV completada

  admin.login                 Login exitoso de admin

  config.update               Cambio en configuración de puntos

  reward.create/update        Creación o modificación de recompensa
  -----------------------------------------------------------------------

**16.2 Principios del Audit Log**

-   Los registros de audit_log son inmutables: no se pueden editar ni
    eliminar.

-   Se guarda el payload completo (before/after) para operaciones de
    modificación.

-   Se registra siempre la IP del actor cuando está disponible.

-   El log es visible para admin con rol \'owner\' desde el panel.

**17. MVP Version**

**17.1 Incluido en MVP**

-   Autenticación admin por email/password.

-   Autenticación cliente por OTP (simplificado: código por email).

-   Importación de ventas desde CSV.

-   Motor de matching (customer_id, teléfono, email).

-   Cálculo y asignación automática de puntos.

-   Deduplicación por external_sale_id.

-   Portal del cliente (/club) con saldo, recompensas e historial.

-   Catálogo de recompensas configurable por el admin.

-   Flujo de canje (solicitud del cliente → confirmación del admin).

-   Panel admin básico (clientes, ventas, canjes, recompensas).

-   Audit log básico.

-   Soporte multi-tenant a nivel de base de datos.

**17.2 Dejado para Versión 2**

-   OTP por SMS/WhatsApp real.

-   Notificaciones automáticas (puntos acreditados, canje disponible).

-   Dashboard con gráficas y métricas avanzadas.

-   Re-procesamiento automático de ventas unmatched al registrarse.

-   Conector directo a DB o API del POS (sin CSV manual).

-   Super Admin panel completo.

-   Importación automática programada (cron job).

-   Segmentación de clientes.

-   Campañas de puntos bonus (ej: dobles puntos los martes).

**18. Future Features**

**18.1 Integraciones POS**

-   Conector nativo con sistemas POS populares en LATAM (Restoo, Colppy,
    Bistro, etc.).

-   Webhook receptor para acreditación de puntos en tiempo real al
    cerrar una venta.

-   API pública para que el POS consulte saldo de puntos del cliente en
    caja.

**18.2 Comunicación y Marketing**

-   Envío automático de SMS/WhatsApp al acreditar puntos.

-   Campañas de email/WhatsApp para clientes inactivos.

-   Notificación push cuando el cliente está a N puntos de una
    recompensa.

-   Segmentación: clientes por rango de puntos, frecuencia de visita,
    tipo de pedido.

**18.3 Gamificación**

-   Niveles de membresía (Bronce, Plata, Oro) con beneficios
    adicionales.

-   Bonificaciones por primer pedido, cumpleaños, referidos.

-   Puntos dobles en días o horarios específicos configurables por el
    admin.

**18.4 Analítica**

-   Dashboard avanzado con LTV por cliente, tasa de retención, ROI del
    programa.

-   Exportación de reportes en CSV/Excel.

-   Comparativa mes a mes de actividad del programa.

**19. Scalability**

**19.1 Escalabilidad a Nivel de Base de Datos**

-   PostgreSQL soporta el volumen de cientos de restaurantes con miles
    de clientes cada uno sin necesidad de sharding en el corto/mediano
    plazo.

-   Índices correctamente definidos sobre organization_id en todas las
    tablas garantizan queries eficientes.

-   Connection pooling (PgBouncer o equivalente) para manejar múltiples
    instancias de la API.

-   A largo plazo: particionamiento de loyalty_transactions y audit_log
    por fecha.

**19.2 Escalabilidad a Nivel de API**

-   La API es stateless: el estado de sesión vive en el JWT. Permite
    múltiples instancias en paralelo.

-   El import pipeline puede moverse a un worker separado (queue) para
    no bloquear la API durante importaciones grandes.

-   Horizontal scaling del backend detrás de un load balancer.

**19.3 Escalabilidad a Nivel de SaaS**

-   Cada nuevo tenant es solo una nueva fila en organizations: no
    requiere provisioning de infraestructura.

-   Rate limiting por organización para prevenir que un tenant consuma
    todos los recursos.

-   Plan-based limits (importaciones/mes, clientes máximos)
    implementadas a nivel de middleware.

**19.4 Estimaciones de Capacidad**

  -----------------------------------------------------------------------
  **Escenario**           **Tenants**             **Capacidad estimada**
  ----------------------- ----------------------- -----------------------
  MVP / Piloto            1-5                     PostgreSQL single node,
                                                  1 API instance

  Crecimiento             10-100                  Connection pool, worker
                                                  separado, CDN

  Escala                  100-1000                DB read replicas,
                                                  multi-instance API,
                                                  queue
  -----------------------------------------------------------------------

**20. Implementation Notes for Software Generators**

**20.1 Instrucciones para Generadores de Software**

Este documento está diseñado para ser consumido directamente por
generadores de software como Google Antigravity u otras herramientas de
generación automática de aplicaciones. Las siguientes notas explican
cómo interpretar esta especificación:

**Modelo de datos**

-   El SQL Schema de la Sección 7 es la fuente de verdad para la
    estructura de base de datos. Generar las migraciones a partir de
    este schema.

-   Todos los IDs deben ser UUID v4. No usar integers
    auto-incrementales.

-   Todos los timestamps deben ser TIMESTAMPTZ (con timezone). La zona
    horaria del negocio se almacena en organizations.settings.

-   El campo raw_data en loyalty_orders debe ser JSONB para permitir
    consultas sobre los datos originales.

**API**

-   Implementar versionado /api/v1 desde el inicio para facilitar
    migraciones futuras.

-   Todos los endpoints de admin deben verificar que organization_id del
    token coincide con el resource solicitado.

-   Implementar el middleware de multi-tenant como primera capa de
    seguridad después de la autenticación.

-   El endpoint POST /admin/orders/import debe procesar el CSV de forma
    asíncrona y retornar un job_id para consultar el estado.

**Frontend**

-   El portal /club debe funcionar correctamente sin JavaScript
    (server-side rendering) para máxima compatibilidad con browsers de
    gama baja.

-   El panel admin puede ser una SPA (Single Page Application) dado que
    es usado por operadores con mejores dispositivos.

-   Implementar la ruta /club/{slug} para soporte multi-tenant en el
    frontend.

**Jobs y Workers**

-   El import pipeline debe ser idempotente: ejecutar el mismo CSV dos
    veces debe producir el mismo resultado.

-   Implementar retry con backoff exponencial para el procesamiento de
    importaciones fallidas.

-   Loguear el inicio, progreso y fin de cada importación en audit_log.

**Seguridad**

-   Nunca retornar el campo password_hash en ningún endpoint.

-   Implementar rate limiting de 5 intentos de OTP por número de
    teléfono por hora.

-   Los JWT de cliente deben expirar en 30 días. Los de admin en 8
    horas.

**Testing**

-   Casos de prueba críticos: doble importación del mismo CSV, venta con
    cliente sin teléfono ni email, canje con puntos insuficientes,
    reversal de venta ya acreditada.

-   La lógica de normalización de teléfonos debe tener suite de tests
    unitarios exhaustiva.

> **Prioridad de implementación:** Iniciar por: 1) Schema DB +
> migraciones, 2) Import pipeline + matching, 3) API admin básica, 4)
> Portal cliente. El MVP puede entregarse en este orden sin necesidad de
> tener todo completo simultáneamente.

*Loyalty SaaS --- PRD v1.0 --- Marzo 2026*
