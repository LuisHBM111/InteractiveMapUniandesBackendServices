# InteractiveMapUniandes Backend

Backend en NestJS para horarios, lugares, rutas y la futura integración con la app móvil autenticada por Firebase.

## Setup

```bash
npm install
```

## Ejecución local

```powershell
$env:DB_SYNCHRONIZE='true'
npm.cmd run start:dev
```

Swagger queda disponible en [http://localhost:3000/api](http://localhost:3000/api).

## Firebase local seguro

La credencial de Firebase Admin no debe subirse al repo. Este proyecto ya ignora:

- `secrets/`
- `storage/`
- archivos tipo `*firebase-adminsdk*.json`
- archivos tipo `*serviceAccount*.json`

La ruta recomendada para la llave local es:

```text
secrets/interactivemapuniandes-firebase-adminsdk-fbsvc-ec21fcc479.json
```

Para arrancar el backend con Firebase Admin y Storage:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

## Modo de prueba local para `/me`

Si todavía no quieres usar un token real de Firebase, puedes probar los endpoints `/api/v1/me/...` así:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1 -UseDevAuth
```

En Swagger usa `Authorize` con este formato:

```text
dev:<uid>|<email>|<name>
```

Ejemplo:

```text
dev:demo-user|demo@uniandes.edu.co|Demo Uniandes
```

## Endpoints útiles

- `POST /api/v1/setup/campus/seed/default`
- `POST /api/v1/me/schedules/import/default`
- `POST /api/v1/me/schedules/import/file`
- `GET /api/v1/me`
- `GET /api/v1/me/schedules/current`
- `GET /api/v1/me/schedules/current/classes`
- `GET /api/v1/me/classes/next`
- `GET /api/v1/me/classes/today`
- `GET /api/v1/me/routes/to-class/:classId?from=ML`

## Seed del campus

Los datos del campus son globales para todos los usuarios. Para cargarlos una sola vez:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\seed-campus-data.ps1
```

Eso usa el endpoint protegido `POST /api/v1/setup/campus/seed/default` y carga:

- `src/utils/edificios_y_casas.xlsx`
- `src/utils/move.xlsx`

## Verificación

```bash
npm run build
npm test -- --runInBand
npm audit
```
