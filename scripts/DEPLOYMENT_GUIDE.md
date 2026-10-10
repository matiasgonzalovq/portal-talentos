# Portal Talentos — Guía de Activación Segura (CP3)

> **ESTADO: PROCEDIMIENTO PREVISTO, NO EJECUTADO.**
> Solo se realizaron verificaciones locales. Ningún comando de este archivo
> ha sido ejecutado contra Firebase remoto.

## 1. Preflight (local — ya validado)

```bash
cd firebase-web
npx vitest run      # 52/52 PASS
npm run build       # OK
```

## 2. Backup de las reglas REMOTAS existentes (no solo el archivo local)

Descargar el ruleset actualmente publicado en el proyecto remoto y guardarlo:

```bash
# Uso el CLI de Firebase / REST. Requiere credenciales de proyecto ya autenticadas.
cd firebase-web
npx firebase use <PROJECT_ID>          # tu propio proyecto Firebase
mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)

# 1) Backup del archivo local actual
cp firestore.rules backups/firestore.rules.local.${STAMP}

# 2) Backup del ruleset REMOTO publicado (fuente de verdad del despliegue)
npx firebase deploy --only firestore:rules --dry-run > backups/firestore.rules-tool.${STAMP}.log

# 3) Exportar reglas remotas vía REST (Identity/Auth recomienda guardar la salida)
#    Requiere un access token válido (gcloud / firebase login).
PROJECT_ID=<PROJECT_ID>
TOKEN=$(gcloud auth print-access-token 2>/dev/null)
curl -s "https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o backups/firestore.releases-${PROJECT_ID}-${STAMP}.json
```

> Guardar las reglas remotas como JSON (con releases) permite restaurar el
> ruleset exacto (hash/version) en un rollback.

**Secreto recomendado en el backup:** incluir el nombre del ruleset (ej.
`cloud.firestore/...`) y la versión/release para poder hacer rollback a ese
revision con `getRelease` + `updateRelease`.

## 3. Despliegue de reglas corregidas

```bash
cd firebase-web
npx firebase use <PROJECT_ID>
npx firebase deploy --only firestore:rules
```

## 4. Verificación posterior

```bash
# Validar sintaxis sin publicar
npx firebase deploy --only firestore:rules --dry-run

# Verificar en la consola Firebase que isSuperAdmin() está activa y que
# delete de participants/submissions/resultAccess y gestión de admins la usan.
```

## 5. Asignación controlada de claims (ver `scripts/admin-claims-remote.mjs`)

```bash
# Exige FIREBASE_SERVICE_ACCOUNT (ruta a credenciales) + FIREBASE_PROJECT_ID.
# Dry-run por defecto. Bloquea proyectos no autorizados.
FIREBASE_PROJECT_ID=<PROJECT_ID> \
FIREBASE_SERVICE_ACCOUNT=/ruta/a/sa.json \
  node scripts/admin-claims-remote.mjs --uid <SUPER_ADMIN_UID> --superadmin --apply
```

## 6. Renovación de tokens

- Cada admin cierra sesión y vuelve a entrar para que `getIdTokenResult()` 
  refleje `admin` / `superAdmin`.

## 7. Prueba funcional

1. Login superAdmin → dashboard completo + gestión de admins.
2. Login admin normal → dashboard, pero sin gestión de admins ni botón borrar.
3. Registrar participante y crear submission (flujos públicos intactos).

## 8. Rollback

```bash
cd firebase-web
# Restaurar el ruleset REMOTO desde backups/firestore.releases-*.json
# (vía REST updateRelease con la versión guardada) O redeploy del archivo local previo
cp backups/firestore.rules.local.<STAMP> firestore.rules
npx firebase deploy --only firestore:rules
# Verificar que los delete vuelven a admin (o al estado anterior)
```

## Checklist de riesgo

- [ ] `.env` de producción con `VITE_FIREBASE_*` (sin ello, la app lanza error en runtime).
- [ ] Confirmar el proyecto remoto definitivo (tu propio proyecto Firebase).
- [ ] Autorizar descarga/generación de service account para `admin-claims-remote.mjs`.
- [ ] Aprobar el despliegue y la asignación de claims.