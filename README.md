# InteractiveMapUniandes Backend

Backend en NestJS para horarios, lugares, rutas y la futura integracion con la app movil autenticada por Firebase.

## Setup

```bash
npm install
```

## Ejecucion local

Para levantar el backend en modo de prueba local con Firebase dev auth:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1 -UseDevAuth
```

Por defecto, el script:

- deja `DB_SYNCHRONIZE=false`
- ejecuta las migraciones pendientes
- habilita los endpoints de setup

Swagger queda disponible en [http://localhost:3000/api](http://localhost:3000/api).
Health check local: [http://localhost:3000/healthz](http://localhost:3000/healthz).

Si quieres forzar el comportamiento antiguo solo para desarrollo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1 -UseDevAuth -UseDbSync
```

Si ya tienes la base lista y solo quieres correr migraciones manualmente:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-migrations.ps1
```

Si tu base local ya fue creada con `synchronize` y todavia no tiene historial de migraciones, marca la migracion inicial una sola vez:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\baseline-initial-migration.ps1
```

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

Si todavia no quieres usar un token real de Firebase, puedes probar los endpoints `/api/v1/me/...` asi:

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

## Endpoints utiles

- `POST /api/v1/setup/campus/seed/default`
- `POST /api/v1/me/schedules/import/default`
- `POST /api/v1/me/schedules/import/file`
- `GET /api/v1/me`
- `GET /api/v1/me/schedules/current`
- `GET /api/v1/me/schedules/current/classes`
- `GET /api/v1/me/classes/next`
- `GET /api/v1/me/classes/today`
- `GET /api/v1/me/routes/to-class/:classId?from=ML`
- `GET /api/v1/me/routes/to-next-class?from=ML`

## Seed del campus

Los datos del campus son globales para todos los usuarios. Para cargarlos una sola vez:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\seed-campus-data.ps1
```

Eso usa el endpoint protegido `POST /api/v1/setup/campus/seed/default` y carga:

- `src/utils/edificios_y_casas.xlsx`
- `src/utils/move.xlsx`

## Verificacion

```bash
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm audit
```

## Despliegue en GCP

La guia de despliegue a Cloud Run + Cloud SQL + Secret Manager esta en [docs/GCP_DEPLOYMENT.md](C:/Users/PERSONAL/IdeaProjects/InteractiveMapUniandesBackendServices/docs/GCP_DEPLOYMENT.md).
