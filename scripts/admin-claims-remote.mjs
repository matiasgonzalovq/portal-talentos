#!/usr/bin/env node
// Admin Claim Script — REMOTO (Portal Talentos, CP3.0)
// ============================================================================
// Diseño para la futura asignación REMOTA de custom claims mediante Admin SDK.
// SEPARADO de scripts/admin-claims.mjs (que es exclusivo de emuladores).
//
// Este archivo NO contiene credenciales. Requiere:
//   FIREBASE_PROJECT_ID        — projectId obligatorio (sin defaults)
//   FIREBASE_SERVICE_ACCOUNT   — ruta a un JSON de service account aprobado
//
// Seguridad:
//   - Sin FIREBASE_PROJECT_ID  -> aborta (exit 1)
//   - Proyecto no autorizado    -> aborta (exit 1), no basta un warning
//   - Sin service account       -> aborta (exit 1)
//   - Dry-run por defecto       -> requiere --apply + confirmación [y/N]
//   - Conserva claims previas   -> spread
//   - No imprime credenciales ni PII
//
// Uso:
//   FIREBASE_PROJECT_ID=<pid> FIREBASE_SERVICE_ACCOUNT=/ruta/sa.json \
//     node scripts/admin-claims-remote.mjs --uid UID [--superadmin] [--apply]
//
// NO EJECUTAR con --apply sin autorización humana de CP3.
// ============================================================================

import { readFileSync } from "node:fs";
import { argv } from "node:process";

// === CONFIGURACIÓN OBLIGATORIA ===
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
if (!PROJECT_ID) {
  console.error("❌ ERROR: FIREBASE_PROJECT_ID environment variable is required");
  process.exit(1);
}

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!SERVICE_ACCOUNT_PATH) {
  console.error("❌ ERROR: FIREBASE_SERVICE_ACCOUNT environment variable is required");
  console.error("   Ruta al JSON de credenciales de service account aprobada.");
  process.exit(1);
}

// === ARGUMENTOS ===
const args = argv.slice(2);
let targetUid = null;
let dryRun = true;
let makeSuperAdmin = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--uid" && args[i + 1]) { targetUid = args[i + 1]; i++; }
  else if (args[i] === "--apply") dryRun = false;
  else if (args[i] === "--dry-run") dryRun = true;
  else if (args[i] === "--superadmin") makeSuperAdmin = true;
}

// === VALIDACIÓN DE SEGURIDAD DEL PROYECTO (verificación estricta) ===
// Solo proyectos explícitamente autorizados. Un warning NO es suficiente.
// Lista configurable vía FIREBASE_ALLOWED_PROJECT_IDS (separados por coma);
// por defecto solo el proyecto de test/emuladores.
const ALLOWED_ENV = (process.env.FIREBASE_ALLOWED_PROJECT_IDS || "portal-talentos-test")
  .split(",").map((s) => s.trim()).filter(Boolean);
const EXPECTED_PROJECT_IDS = ALLOWED_ENV; // Añadir aquí el remoto aprobado
if (!EXPECTED_PROJECT_IDS.includes(PROJECT_ID)) {
  console.error(`🚫 ERROR FATAL: FIREBASE_PROJECT_ID='${PROJECT_ID}'`);
  console.error("   No se reconocen credenciales de este proyecto.");
  console.error("   Proyectos seguros esperados: " + EXPECTED_PROJECT_IDS.join(", "));
  console.error("   Operación ABORTADA.");
  process.exit(1);
}

if (!targetUid) {
  console.error("❌ ERROR: --uid USER_UID is required");
  process.exit(1);
}

// === INICIALIZACIÓN ADMIN SDK CON SERVICE ACCOUNT ===
let admin;
try {
  const serviceAccount = JSON.parse(
    readFileSync(SERVICE_ACCOUNT_PATH, "utf8"),
  );
  // Verificar coherencia entre el projectId declarado y el del service account
  if (serviceAccount.project_id && serviceAccount.project_id !== PROJECT_ID) {
    console.error(`🚫 ERROR FATAL: el service account pertenece a '${serviceAccount.project_id}', no a '${PROJECT_ID}'.`);
    process.exit(1);
  }
  // Dynamic import (ESM). No se envía la credencial a la consola.
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const app = initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
  admin = getAuth(app);
} catch (e) {
  console.error("❌ Error inicializando Admin SDK (sin exponer credenciales).");
  process.exit(1);
}

console.log(`🔐 Admin Claim Script (REMOTO) — Proyecto verificado: ${PROJECT_ID}`);
console.log(`👤 UID: ${targetUid} | modo: ${dryRun ? "DRY-RUN (seguro)" : "APPLY"}`);
console.log("");

// === PASO 1-2: Consultar usuario y claims ===
let user;
try {
  user = await admin.getUser(targetUid);
} catch (e) {
  console.error(`❌ Usuario no encontrado en ${PROJECT_ID}.`);
  process.exit(1);
}
const currentClaims = user.customClaims || {};
console.log(`📋 Claims actuales:`, JSON.stringify(currentClaims, null, 2));

// === PASO 3: Preservar y añadir ===
const newClaims = { ...currentClaims, admin: true };
if (makeSuperAdmin) newClaims.superAdmin = true;

const hasAll =
  currentClaims.admin === true &&
  (!makeSuperAdmin || currentClaims.superAdmin === true);
if (hasAll) {
  console.log("✅ Claims requeridas ya existen. Sin cambios.");
  process.exit(0);
}

if (dryRun) {
  console.log("\n🔍 DRY-RUN: claims propuestas ->", JSON.stringify(newClaims, null, 2));
  console.log("   Ejecutar con --apply tras aprobación de CP3.");
  process.exit(0);
}

// === PASO 4: Confirmación explícita ===
console.log("\n⚠️ Claims propuestas ->", JSON.stringify(newClaims, null, 2));
const { createInterface } = await import("node:readline/promises");
const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question(`¿Asignar a ${targetUid} en ${PROJECT_ID}? [y/N]: `);
rl.close();
if (!/^y(es)?$/i.test(answer)) {
  console.log("✅ Operación cancelada.");
  process.exit(0);
}

// === PASO 5-6: Aplicar y verificar ===
try {
  await admin.setCustomUserClaims(targetUid, newClaims);
  const after = await admin.getUser(targetUid);
  console.log("✅ Claims actualizadas:", JSON.stringify(after.customClaims, null, 2));
  console.log("   El usuario debe renovar su token (logout/login).");
  process.exit(0);
} catch (e) {
  console.error("❌ Error asignando claims.");
  process.exit(1);
}