# 📋 Documentación Completa de la API - Congreso Digital

## 🎯 Objetivo
Este documento sirve como contrato definitivo entre el backend y frontend, detallando todos los endpoints, datos de entrada/salida, autenticación y comportamientos especiales del sistema.

---

## 🔐 Autenticación

### Login con Email/Contraseña
**POST** `/api/auth/login`

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "email": "usuario@umg.edu.gt",
  "password": "contraseña123"
}
```

**Response Exitoso (200):**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGc...",
  "tokenType": "Bearer",
  "expiresAtUtc": "2024-12-31T23:59:59Z",
  "user": {
    "id": "guid-del-usuario",
    "email": "usuario@umg.edu.gt",
    "fullName": "Juan Pérez",
    "roles": ["student"],
    "roleLevel": 1
  }
}
```

**Response Error (401):**
```json
{
  "message": "Invalid credentials"
}
```

### Login con Google (Solo dominios permitidos)
**POST** `/api/auth/google`

**Request Body:**
```json
{
  "email": "usuario@umg.edu.gt",
  "name": "Juan Pérez",
  "picture": "https://..."
}
```

**Response Error (403):**
```json
{
  "message": "Solo se permiten correos de los dominios: @umg.edu.gt"
}
```

### Obtener Información del Usuario Actual
**GET** `/api/auth/me`

**Headers:**
- `Authorization: Bearer {token}`

**Response:**
```json
{
  "userId": "guid-del-usuario",
  "email": "usuario@umg.edu.gt",
  "roles": ["student"],
  "roleLevel": 1
}
```

### Verificar Sesión
**GET** `/api/auth/session`

**Headers:**
- `Authorization: Bearer {token}`

**Response:**
```json
{
  "isAuthenticated": true,
  "user": {
    "id": "guid-del-usuario",
    "email": "usuario@umg.edu.gt",
    "name": "Juan Pérez",
    "roles": ["student"]
  },
  "roleLevel": 1
}
```

---

## 👥 Gestión de Usuarios

### Listar Usuarios (Solo Staff)
**GET** `/api/users?page=1&pageSize=50`

**Headers:**
- `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "guid-usuario",
        "email": "usuario@umg.edu.gt",
        "fullName": "Juan Pérez",
        "isUmg": true,
        "isActive": true,
        "avatarUrl": null,
        "orgName": "Universidad Mariano Gálvez",
        "status": "active",
        "lastLogin": "2024-12-01T10:00:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "totalCount": 150,
    "page": 1,
    "pageSize": 50,
    "totalPages": 3
  },
  "message": "Users retrieved successfully"
}
```

### Buscar Usuarios (Solo Staff)
**GET** `/api/users/search?q=busqueda`

### Obtener Usuario por ID
**GET** `/api/users/{id:guid}`

**Notas:**
- Usuarios normales solo pueden ver su propio perfil
- Staff puede ver cualquier perfil

### Crear Usuario (Solo Admin)
**POST** `/api/users`

**Request Body:**
```json
{
  "email": "nuevo@umg.edu.gt",
  "password": "contraseña123",
  "fullName": "Nuevo Usuario",
  "isUmg": true,
  "orgName": "Universidad Mariano Gálvez"
}
```

### Obtener Usuarios por Rol
**GET** `/api/users/role/{role}`

**Roles disponibles:** `admin`, `student`, `staff`

---

## 📋 Actividades Públicas

### Listar Actividades
**GET** `/api/activities` (alias de `/api/public/activities`)

**Query Parameters:**
- `kinds` (opcional): Filtrar por tipos (talk, workshop, competition)

**Response:**
```json
[
  {
    "id": "guid-actividad",
    "title": "Taller de React",
    "activityType": "workshop",
    "location": "Aula 101",
    "startTime": "2024-12-15T09:00:00Z",
    "endTime": "2024-12-15T12:00:00Z",
    "capacity": 50,
    "published": true,
    "enrolledCount": 0,
    "availableSpots": 50,
    "speaker": {
      "id": "guid-ponente",
      "name": "María García",
      "company": "Tech Corp",
      "roleTitle": "Senior Developer",
      "avatarUrl": "https://...",
      "links": null
    }
  }
]
```

### Obtener Actividad por ID
**GET** `/api/activities/{id}`

**Response:**
```json
{
  "id": "guid-actividad",
  "activity_type": "TALLER",
  "title": "Taller de React",
  "description": "Aprende React desde cero",
  "location": "Aula 101",
  "starts_at": "2024-12-15T09:00:00Z",
  "ends_at": "2024-12-15T12:00:00Z",
  "capacity": 50,
  "is_active": true
}
```

### Actividades Próximas
**GET** `/api/activities/upcoming`

---

## 📝 Inscripciones

### Crear Inscripción
**POST** `/api/enrollments`

**Request Body:**
```json
{
  "request": {
    "userId": "guid-usuario",
    "activityIds": ["guid-actividad-1", "guid-actividad-2"]
  }
}
```

**Response Exitoso (201):**
```json
{
  "data": {
    "id": "guid-nueva-inscripción"
  }
}
```

**Response Error (409):**
```json
{
  "message": "Usuario ya inscrito en esta actividad",
  "type": "already_enrolled",
  "error_code": "DUPLICATE_ENROLLMENT"
}
```

**Response Error (422):**
```json
{
  "message": "Conflicto de horario con otra actividad",
  "type": "time_conflict",
  "error_code": "TIME_CONFLICT"
}
```

**Response Error (409):**
```json
{
  "message": "Cupo agotado",
  "type": "capacity_full",
  "error_code": "CAPACITY_EXCEEDED"
}
```

### Validar Conflicto de Horario
**POST** `/api/enrollments/validate-conflict`

**Request Body:**
```json
{
  "userId": "guid-usuario",
  "activityId": "guid-actividad"
}
```

**Response con Conflicto:**
```json
{
  "hasConflict": true,
  "message": "Conflicto detectado",
  "conflictingActivity": {
    "id": "guid-actividad-conflicto",
    "title": "Otra actividad",
    "startTime": "2024-12-15T09:00:00Z",
    "endTime": "2024-12-15T12:00:00Z"
  }
}
```

### Validar Múltiples Conflictos de Tiempo
**POST** `/api/enrollments/validate-time-conflicts`

**Request Body:**
```json
{
  "activityIds": ["guid-1", "guid-2", "guid-3"]
}
```

### Validar Conflicto con Inscripciones del Usuario
**POST** `/api/enrollments/validate-time-conflict`

**Request Body:**
```json
{
  "activityIds": ["guid-1", "guid-2"]
}
```

### Verificar Cupo de Actividades
**POST** `/api/enrollments/check-capacity`

**Request Body:**
```json
{
  "activityIds": ["guid-1", "guid-2"]
}
```

---

## 📜 Certificados

### Generar Certificado
**POST** `/api/certificates/generate`

**Request Body:**
```json
{
  "userId": "guid-usuario",
  "type": "attendance",
  "activityId": "guid-actividad" // opcional
}
```

**Response:**
```json
{
  "id": "guid-certificado",
  "userId": "guid-usuario",
  "type": "attendance",
  "hash": "abc123...",
  "issuedAt": "2024-12-01T10:00:00Z",
  "expiresAt": null,
  "metadata": {
    "activityTitle": "Taller de React",
    "issuedBy": "Sistema Congreso"
  }
}
```

### Obtener Certificados de Usuario
**GET** `/api/certificates/user/{userId}?page=1&pageSize=10`

**Response:**
```json
{
  "items": [...],
  "totalCount": 5,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

### Validar Certificado
**GET** `/api/certificates/validate/{hash}`

**Response Válido:**
```json
{
  "isValid": true,
  "message": "Certificado válido",
  "certificateId": "guid-certificado"
}
```

**Response Inválido:**
```json
{
  "isValid": false,
  "message": "Certificado no encontrado o expirado",
  "certificateId": null
}
```

---

## 📍 Check-in/Asistencia

### Realizar Check-in
**POST** `/api/attendances/checkin`

**Request Body:**
```json
{
  "token": "token-qr-o-checkin"
}
```

**Response Exitoso:**
```json
{
  "message": "Check-in realizado exitosamente",
  "wasAlreadyCheckedIn": false,
  "checkInTime": "2024-12-01T10:00:00Z"
}
```

**Response Ya Registrado:**
```json
{
  "message": "El usuario ya había realizado check-in",
  "wasAlreadyCheckedIn": true,
  "checkInTime": "2024-12-01T09:30:00Z"
}
```

---

## 👤 Perfiles de Usuario

### Perfiles de Staff

#### Listar Todos los Staff (Admin)
**GET** `/api/profiles/staff`

#### Obtener Perfil de Staff
**GET** `/api/profiles/staff/{userId:guid}`

**Response:**
```json
{
  "userId": "guid-usuario",
  "staffRole": "Admin",
  "displayName": "Juan Pérez",
  "extraData": {
    "departamento": "TI",
    "telefono": "5555-1234"
  },
  "isAdmin": true,
  "isSuperAdmin": false,
  "roleDescription": "Administrador",
  "updatedAt": "2024-12-01T10:00:00Z"
}
```

#### Crear Perfil de Staff (Super Admin)
**POST** `/api/profiles/staff`

**Request Body:**
```json
{
  "userId": "guid-usuario",
  "staffRole": "Admin",
  "displayName": "Juan Pérez",
  "extraData": {
    "departamento": "TI"
  }
}
```

#### Actualizar Perfil de Staff
**PUT** `/api/profiles/staff/{userId:guid}`

#### Eliminar Perfil de Staff (Super Admin)
**DELETE** `/api/profiles/staff/{userId:guid}`

### Perfiles de Estudiante

#### Listar Todos los Estudiantes (Staff)
**GET** `/api/profiles/students`

#### Obtener Perfil de Estudiante
**GET** `/api/profiles/students/{userId:guid}`

**Response:**
```json
{
  "userId": "guid-usuario",
  "carnet": "0900123456",
  "career": "Ingeniería en Sistemas",
  "cohortYear": 2023,
  "organization": "UMG",
  "isEnabled": true,
  "enabledAt": "2024-01-01T00:00:00Z",
  "isUmgStudent": true,
  "currentAcademicYear": 2024
}
```

#### Crear Perfil de Estudiante (Staff)
**POST** `/api/profiles/students`

**Request Body:**
```json
{
  "userId": "guid-usuario",
  "carnet": "0900123456",
  "career": "Ingeniería en Sistemas",
  "cohortYear": 2023,
  "organization": "UMG"
}
```

---

## 🎪 Podio/Ganadores

### Obtener Podio por Año
**GET** `/api/podium?year=2024`

**Response:**
```json
[
  {
    "id": 1,
    "year": 2024,
    "place": 1,
    "activityId": "guid-actividad",
    "activityTitle": "Competencia de Programación",
    "winnerName": "Equipo Alpha",
    "awardDate": "2024-12-01T00:00:00Z",
    "teamId": 123,
    "prizeDescription": "Primer lugar"
  }
]
```

### Ponentes/Palestrantes
**GET** `/api/speakers`

**Response:**
```json
[
  {
    "id": "guid-ponente",
    "name": "María García",
    "bio": "Experta en Inteligencia Artificial",
    "company": "Tech Corp",
    "roleTitle": "Senior Developer",
    "avatarUrl": "https://...",
    "links": null
  }
]
```

---

## ❓ Preguntas Frecuentes (FAQ)

### Obtener FAQ Público
**GET** `/api/faq`

**Response:**
```json
[
  {
    "id": 1,
    "question": "¿Cómo me inscribo a una actividad?",
    "answer": "Puedes inscribirte desde la sección de actividades...",
    "published": true,
    "position": 0
  }
]
```

---

## 🏢 Organizaciones

### Actualizar Organización (Admin)
**PUT** `/api/admin/organizations/{id:guid}`

**Request Body:**
```json
{
  "name": "Universidad Mariano Gálvez",
  "type": "Universidad",
  "domain": "umg.edu.gt"
}
```

---

## 📊 Dashboard/Estadísticas

### Vista de Actividades Públicas
**GET** `/api/activities-view?from=2024-12-01&to=2024-12-31&type=taller`

### Métricas del Sistema
**GET** `/api/public/metrics`

**Response:**
```json
{
  "totalUsers": 1250,
  "totalActivities": 45,
  "totalEnrollments": 890,
  "recentEnrollments": [...]
}
```

---

## 🔧 Diagnóstico/Salud

### Health Check General
**GET** `/health` → 200 OK

### Health Check Detallado
**GET** `/health/detailed`

**Response:**
```json
{
  "status": "Healthy",
  "checks": {
    "database": "Healthy",
    "cache": "Healthy",
    "externalServices": "Healthy"
  },
  "duration": "00:00:00.1234567"
}
```

### Health Check de Base de Datos
**GET** `/health/postgres`

### Health Check de Caché
**GET** `/health/cache`

---

## 📋 Modelos de Datos

### User (Usuario)
```json
{
  "id": "guid",
  "email": "string",
  "passwordHash": "string (nullable)",
  "fullName": "string (nullable)",
  "isUmg": "boolean",
  "lastLogin": "datetime (nullable)",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "isActive": "boolean",
  "avatarUrl": "string (nullable)",
  "orgId": "guid (nullable)",
  "orgName": "string (nullable)",
  "status": "string"
}
```

### Activity (Actividad)
```json
{
  "id": "guid",
  "title": "string",
  "type": "string (deprecated)",
  "location": "string (nullable)",
  "startTime": "datetime (nullable)",
  "endTime": "datetime (nullable)",
  "capacity": "integer (nullable)",
  "published": "boolean",
  "description": "string (nullable)",
  "isActive": "boolean",
  "requiresEnrollment": "boolean",
  "activityType": "enum: CHARLA, TALLER, COMPETENCIA",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Enrollment (Inscripción)
```json
{
  "id": "guid",
  "userId": "guid",
  "activityId": "guid",
  "seatNumber": "integer (nullable)",
  "qrCodeId": "string (nullable)",
  "attended": "boolean"
}
```

### StaffAccount (Cuenta Staff)
```json
{
  "userId": "guid",
  "staffRole": "enum: AdminDev, Admin, Asistente",
  "displayName": "string (nullable)",
  "extra": "jsonb",
  "updatedAt": "datetime"
}
```

### StudentAccount (Cuenta Estudiante)
```json
{
  "userId": "guid",
  "carnet": "string (nullable)",
  "career": "string (nullable)",
  "cohortYear": "integer (nullable)",
  "organization": "string (nullable)",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "isEnabled": "boolean",
  "enabledAt": "datetime (nullable)"
}
```

---

## 🔐 Roles y Permisos

### Jerarquía de Roles
1. **AdminDev** (Desarrollador/Super Admin) - Level 3
2. **Admin** (Administrador) - Level 2  
3. **Asistente** (Asistente) - Level 1
4. **Student** (Estudiante) - Level 1

### Políticas de Autorización
- `RequireStaffOrHigher`: Requiere Admin, AdminDev o Asistente
- `AdminOnly`: Requiere Admin o AdminDev
- `SuperAdminOnly`: Requiere AdminDev únicamente
- `StaffOnly`: Requiere Asistente, Admin o AdminDev

---

## 🚨 Códigos de Error Comunes

| Código HTTP | Significado |
|-------------|-------------|
| 200 | Éxito |
| 201 | Creado |
| 204 | Sin contenido |
| 400 | Solicitud inválida |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | No encontrado |
| 409 | Conflicto (duplicado) |
| 422 | Entidad no procesable |
| 500 | Error del servidor |

### Códigos de Error de Inscripción
- `DUPLICATE_ENROLLMENT`: Usuario ya inscrito
- `TIME_CONFLICT`: Conflicto de horario
- `CAPACITY_EXCEEDED`: Cupo agotado
- `GENERAL_ERROR`: Error general

---

## 🔧 Configuración y Variables de Entorno

### Dominios Permitidos para Google Login
Variable: `GOOGLE_ALLOWED_DOMAINS`
Default: `umg.edu.gt`

### Base de Datos
- Connection string en variable de entorno
- Soporte para Neon PostgreSQL con SSL

### JWT
- Tokens con expiración configurable
- Refresh tokens no implementados

---

## 📱 Notas para el Frontend

### Manejo de Tokens
- Almacenar token en localStorage o sessionStorage
- Incluir en header `Authorization: Bearer {token}`
- Token expira según configuración del servidor

### Manejo de Errores
- Siempre verificar `success` en responses
- Mostrar mensajes user-friendly basados en `message`
- Manejar códigos de error específicos para inscripciones

### Paginación
- Usar query parameters `page` y `pageSize`
- Responses incluyen `totalCount` y `totalPages`

### Filtros y Búsqueda
- Actividades: filtrar por `kinds` (talk, workshop, competition)
- Usuarios: buscar con parámetro `q`
- Fechas: usar `from` y `to` en formato ISO

### Optimizaciones
- Usar vistas públicas para datos generales
- Implementar caché local para FAQ y speakers
- Validar conflictos antes de enviar inscripciones

---

## 📞 Soporte

Para dudas sobre la API, contactar al equipo de backend con:
- Endpoint específico
- Request completo (headers, body)
- Response recibido
- Expected behavior

**Última actualización:** Diciembre 2024
**Versión de API:** 1.0.0
**Backend:** ASP.NET Core 8.0
**Base de Datos:** PostgreSQL 15+