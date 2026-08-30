# Kerana

Kerana es una plataforma para estudiantes universitarios donde se pueden compartir y buscar apuntes por materia, seguir a otros usuarios, acceder a un sistema de mentorías con profesores/mentores, calificar contenido y recibir notificaciones en tiempo real de toda esa actividad.

---

## Stack tecnológico

- **Frontend:** React + Vite
- **Backend:** Supabase (PostgreSQL + Auth)
- **Gestión de estado:** Context API de React
- **Almacenamiento local:** LocalStorage (para notificaciones vistas)

---

## Estructura del proyecto

```
kerana/
├── src/
│   ├── api/
│   │   ├── database.js          # API principal con todos los endpoints
│   │   ├── notifications.js     # API específica de notificaciones
│   │   └── notificationTypes.js # Tipos de notificaciones predefinidos
│   │
│   ├── components/
│   │   └── UI/                  # Componentes reutilizables (Button, Card, Header, etc.)
│   │
│   ├── contexts/
│   │   └── NotificationsContext.jsx  # Context para notificaciones globales
│   │
│   ├── data/
│   │   └── subjects.js          # Data estática de materias
│   │
│   ├── hooks/
│   │   ├── useMentorStatus.js
│   │   ├── useNotifications.js
│   │   ├── useNotificationSettings.js
│   │   ├── usePrivacySettings.js
│   │   ├── useRecentSearches.js
│   │   ├── useSeguidores.js
│   │   └── useTabBadge.js
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Profile.jsx
│   │   ├── Settings.jsx
│   │   ├── Notifications.jsx
│   │   └── ...
│   │
│   ├── styles/
│   │   ├── notifications.css
│   │   └── theme.css
│   │
│   ├── utils/
│   │   ├── authHelpers.js
│   │   ├── exportUserData.js
│   │   ├── notificationGrouper.js
│   │   ├── notificationRouter.js
│   │   └── NotificationStorage.js
│   │
│   ├── App.jsx                  # Componente principal con routing
│   ├── main.jsx                 # Entry point
│   └── supabase.js              # Configuración del cliente de Supabase
│
├── public/
├── .env                         # Variables de entorno (no versionado)
├── package.json
└── vite.config.js
```

---

## Cómo correr el proyecto

```bash
# Clonar el repo
git clone <url-del-repo>
cd kerana

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env   # y completar con tus valores

# Correr en desarrollo
npm run dev
```

### Variables de entorno necesarias

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

> Nunca subas el `.env` con valores reales al repositorio.

---

## Base de datos (Supabase)

### Tabla principal: `usuario`

| Campo              | Tipo      | Notas                              |
|---------------------|-----------|-------------------------------------|
| id_usuario          | bigint    | PK                                   |
| auth_id             | uuid      | FK a `auth.users`                    |
| nombre              | text      |                                       |
| correo              | text      |                                       |
| username            | varchar(50) |                                     |
| foto                | text      | **no** es `avatar_url`, es `foto`  |
| creditos            | bigint    |                                       |
| perfil_publico      | boolean   |                                       |
| mostrar_email       | boolean   |                                       |
| permitir_mensajes   | boolean   |                                       |

### Otras tablas

- `notificaciones` — sistema de notificaciones en tiempo real
- `seguidores` — relaciones entre usuarios
- `mentor` / `mentor_materia` — sistema de mentorías
- `materia` — materias del curso
- `apunte` — apuntes subidos por usuarios
- `profesor_curso` — profesores
- `rating` — sistema de calificaciones

---

## APIs principales (`src/api/database.js`)

```javascript
export const userAPI = { ... }           // Gestión de usuarios
export const subjectsAPI = { ... }       // Materias
export const searchAPI = { ... }         // Búsqueda general
export const mentorAPI = { ... }         // Sistema de mentores
export const notesAPI = { ... }          // Apuntes
export const favoritesAPI = { ... }      // Favoritos
export const ratingsAPI = { ... }        // Calificaciones
export const professorAPI = { ... }      // Profesores
export const mentorshipAPI = { ... }     // Mentorías
export const followersAPI = { ... }      // Seguidores
export const notificationsAPI = { ... }  // Notificaciones
```

### `src/api/notifications.js`

- `obtenerMisNotificaciones()`
- `contarNoLeidas()`
- `marcarComoLeida(notifId)`
- `marcarTodasLeidas()`
- `eliminarNotificacion(notifId)`

### `src/api/notificationTypes.js`

Tipos predefinidos: `nuevoSeguidor`, `solicitudAceptada`, `nuevoComentario`, `nuevoLike`, `nuevaResenia`, `mentorAcepto`, `nuevoApunte`, `apunteAprobado`, `mentorAprobado`, `sistema`, `actualizacion`.

---

## Sistema de diseño

### Paleta de colores

**Marca (azules Kerana):**

| Nombre     | Hex       | Uso                                  |
|------------|-----------|---------------------------------------|
| primary    | `#13346b` | Header, sidebar, footer               |
| secondary  | `#2563eb` | Botones principales, links, highlights|
| accent     | `#0ea5a3` | Acentos en gradientes                 |
| light      | `#3b82f6` | Secundarios, hover states             |

**Gradiente hero:** `linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%)`

**Neutros:**

| Nombre         | Hex       |
|-----------------|-----------|
| pageBg          | `#f8fafc` |
| surface         | `#ffffff` |
| border          | `#e2e8f0` |
| textPrimary     | `#0f172a` |
| textSecondary   | `#64748b` |

**Estados:** success `#10b981` · warning `#f59e0b` · error `#ef4444` · info `#0ea5e9` (cada uno con variante light/dark, ver documentación interna de diseño).

### Tipografía

- **Fuente:** Inter (pesos 400, 500, 600, 700, 800)
- Escalas responsive con `clamp()`, de `h1` (32–64px) a `caption` (11–12px)
- Line-height estándar: `1.5`
- Letter-spacing estándar: `0` (badges/uppercase usan `0.5px`–`1px`)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
```

### Iconografía

Font Awesome exclusivamente en UI funcional (nunca emojis). Cubre navegación, búsqueda, acciones, estados, contacto, finanzas, seguridad, tiempo e impacto ambiental. El mapa completo de íconos está en la documentación interna de diseño.

### Espaciado

Sistema base 4px, de `xxs` (2px) a `ultra` (80px). Estándar: `base = 16px`, cards `20–24px`, botones `10px 20px`, inputs `12px 14px`.

### Componentes base

Botones (primario, secundario/outline, success, danger), cards con hover (`translateY(-4px)` + sombra), inputs con focus ring azul, badges tipo pill. Border-radius consistente entre 10–16px. Transiciones estándar `0.2s ease`.

---

## Convenciones de desarrollo

- No usar `export default` en componentes
- No usar `localStorage` / `sessionStorage` dentro de artifacts de Claude (no soportado)
- No tocar queries de Supabase ni RLS sin verificar antes
- Mantener toda la lógica funcional (hooks, APIs, state management) al tocar diseño/UI
- Responsive breakpoints: mobile `0–640px`, tablet `641–1024px`, desktop `1025px+`

---

## Estado del proyecto

En desarrollo activo. Diseño aplicado hasta el momento en `Home.jsx` y `SearchBar.jsx`; pendiente `Sidebar.jsx` y el resto de las páginas.

---

## Licencia

_Por definir._
