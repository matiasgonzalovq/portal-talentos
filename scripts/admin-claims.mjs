#!/usr/bin/env --env-into=node --timeout=30000
// Admin Claim Script — Portal Talentos
// CP2C.8: Cierre de autorización administrativa
// FIREBASE_PROJECT_ID obligatorio — sin defaults.
// Dry-run por defecto. Sin credenciales de otro proyecto.
// Ejecutar SOLO en entorno local con emuladores.
//
// Uso: node scripts/admin-claims.mjs --uid USER_UID [--superadmin] [--apply]
//
// Si falta --apply, modo dry-run seguro.
// Si --apply: asigna claims y confirma.
// --superadmin: añade claim superAdmin:true (gestión de administradores).
// Nunca contra proyecto de producción.

import { getAuth as getAdminAuth } from "firebase-admin/auth";

// === CONFIGURACIÓN OBLIGATORIA ===
// FIREBASE_PROJECT_ID es obligatorio - sin defaults que adivinen
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
if (!PROJECT_ID) {
  console.error("❌ ERROR: FIREBASE_PROJECT_ID environment variable is required");
  console.error("   Ejemplo: export FIREBASE_PROJECT_ID=portal-talentos-test");
  process.exit(1);
}

import { argv } from "process";
const args = argv.slice(2);
let targetUid = null;
let dryRun = true; // Default: dry-run para seguridad
let makeSuperAdmin = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--uid" && args[i + 1]) {
    targetUid = args[i + 1];
    i++;
  } else if (args[i] === "--apply") {
    dryRun = false;
  } else if (args[i] === "--dry-run") {
    dryRun = true;
  } else if (args[i] === "--superadmin") {
    makeSuperAdmin = true;
  }
}

if (!targetUid) {
  console.error("❌ ERROR: --uid USER_UID is required");
  console.error("   Ejemplo: node admin-claims.mjs --uid FbO2xLxYZexample123");
  process.exit(1);
}

// === VALIDACIÓN DE SEGURIDAD DEL PROJECT ID ===
// Bloquear credenciales de proyectos no aprobados. Un warning no es suficiente:
// si el projectId NO está en la lista de proyectos seguros, abortar.
// La lista de proyectos permitidos es configurable vía FIREBASE_ALLOWED_PROJECT_IDS
// (separados por coma); si no se define, por defecto solo se permite el proyecto
// de test/emuladores.
const ALLOWED_ENV = (process.env.FIREBASE_ALLOWED_PROJECT_IDS || "portal-talentos-test")
  .split(",").map((s) => s.trim()).filter(Boolean);
const EXPECTED_PROJECT_IDS = ALLOWED_ENV;
if (!EXPECTED_PROJECT_IDS.includes(PROJECT_ID)) {
  console.error(`🚫 ERROR FATAL: FIREBASE_PROJECT_ID='${PROJECT_ID}'`);
  console.error("   No se reconocen credenciales de este proyecto.");
  console.error("   Proyectos seguros esperados: " + EXPECTED_PROJECT_IDS.join(", "));
  console.error("   Operación ABORTADA para evitar asignar claims a un proyecto incorrecto.");
  process.exit(1);
} else {
  console.log(`🔐 Project ID verificado: ${PROJECT_ID} (en lista de proyectos seguros)`);
}

// === INICIALIZACIÓN ===
console.log(`🔐 Admin Claim Script - Portal Talentos`);
console.log(`📁 Project ID: ${PROJECT_ID} (obligatorio)`);
console.log(`👤 Target UID: ${targetUid}`);
console.log(`� mode: ${dryRun ? "DRY-RUN (seguro)" : "APPLY (aplicará cambios)"}`);
console.log("");

console.log("");

try {
  // Connect the Admin SDK to the local Auth emulator BEFORE initializing the
  // app. This must happen before initializeApp so the SDK uses emulator creds.
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9161";
  console.log(dryRun
    ? `🔗 Auth emulator connected: localhost:9161 (modo lectura, no asigna)`
    : `🔗 Auth emulator connected: localhost:9161`);

  // Use ONLY the Admin SDK. The client `firebase` package is not needed to
  // assign custom claims. The Admin SDK is initialized with an explicit
  // projectId and, when connecting to the local emulator, no real credentials
  // are required.
  const { initializeApp: initAdminApp } = await import("firebase-admin/app");
  const adminApp = initAdminApp({ projectId: PROJECT_ID });

  const adminAuth = getAdminAuth(adminApp);

  // === PASO 1: Consultar claims existentes ===
  console.log(`\n🔍 PASO 1: Consultando claims existentes para UID: ${targetUid}`);
  let userRecord;
  try {
    userRecord = await adminAuth.getUser(targetUid);
    console.log(`   ✅ Usuario encontrado: ${userRecord.uid}`);
    console.log(`   📧 Email: ${userRecord.email || "(ninguario)"}`);
  } catch (error) {
    console.error(`❌ Error obteniendo usuario: ${error.message}`);
    console.error(`   El UID debe pertenecer a un usuario en el projectId: ${PROJECT_ID}`);
    process.exit(1);
  }

  // === PASO 2: Consultar claims actuales ===
  console.log(`\n📋 PASO 2: Consultando claims actuales...`);
  const currentClaims = userRecord.customClaims || {};
  console.log(`   Claims actuales:`, JSON.stringify(currentClaims, null, 2));

  // === PASO 3: Preservar claims existentes y añadir admin (y opcionalmente superAdmin) ===
  const rolePart = makeSuperAdmin ? "admin + superAdmin" : "admin";
  console.log(`\n🔄 PASO 3: Preparando claims (${rolePart}: true) preservando claims existentes...`);
  const newClaims = {
    ...currentClaims,  // Preservar claims existentes
    admin: true,       // Añadir claim admin
  };
  if (makeSuperAdmin) {
    newClaims.superAdmin = true; // Añadir claim superAdmin (gestión de administradores)
  }

  // Verificar si ya tiene todos los claims necesarios
  const hasAll = currentClaims.admin === true && (!makeSuperAdmin || currentClaims.superAdmin === true);
  if (hasAll) {
    console.log(`   ✅ Claims requeridas ya existen. No hay cambios necesarios.`);
    console.log(`   Proyecto: ${PROJECT_ID}`);
    process.exit(0);
  }

  // === PASO 4 (dry-run): Mostrar y salir ===
  if (dryRun) {
    console.log(`\n🔍 DRY-RUN: No se aplicarán cambios.`);
    console.log(`   Ejecute con --apply para asignar claims al proyecto ${PROJECT_ID}`);
    console.log(`   El usuario deberá cerrar sesión e iniciar nuevamente para renovar su token.`);
    console.log(`\n✅ DRY-RUN completado. Sin modificaciones realizadas en proyecto ${PROJECT_ID}.`);
    process.exit(0);
  }

  // === PASO 4: Confirmación explícita (modo apply) ===
  console.log(`\n⚠️  PASO 4: Confirmación requerida para modo APPLY`);
  console.log(`   Claims actuales:`);
  console.log(`     ${JSON.stringify(currentClaims, null, 2)}`);
  console.log(`   Claims propuestos:`);
  console.log(`     ${JSON.stringify(newClaims, null, 2)}`);
  console.log("");

  console.log(`⚠️  ADVERTENCIA: Esto modificará los custom claims del usuario ${targetUid}`);
  console.log(`   en el proyecto Firebase: ${PROJECT_ID}`);
  console.log(`   El usuario deberá cerrar sesión e iniciar nuevamente para renovar su token.`);

  // Prompt de confirmación (readline/promises, ESM-safe)
  const readline = await import('readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('¿Desea continuar con la asignación de claims? [y/N]: ');
  rl.close();

  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log(`\n✅ Operación cancelada. No se realizaron cambios.`);
    process.exit(0);
  }

  // === PASO 5: Aplicar claims ===
  console.log(`\n🔐 PASO 5: Aplicando claims...`);
  try {
    await adminAuth.setCustomUserClaims(targetUid, newClaims);
    console.log(`   ✅ Claims asignados exitosamente:`);
    console.log(`      ${JSON.stringify(newClaims, null, 2)}`);

    // === PASO 6: Verificar claims actualizados ===
    console.log(`\n🔄 PASO 6: Verificando claims actualizados...`);
    const updated = await adminAuth.getUser(targetUid);
    console.log(`   ✅ Usuario actualizado: ${updated.uid}`);
    console.log(`   ✅ Claims actualizados:`, JSON.stringify(updated.customClaims, null, 2));

    console.log(`
✅ COMPLETADO: Claim 'admin: true' ha sido asignado al usuario ${targetUid} en proyecto ${PROJECT_ID}.

Próximos pasos:
1. El usuario debe renovar su ID token (logout/inicio de sesión)
2. O esperar que el token existente caduque y se renueve
3. Luego las reglas Firestore isAdmin() reconocerán el claim

⚠️ IMPORTANTE:
- Este cambio solo afecta a este proyecto Firebase: ${PROJECT_ID}
- Para otros proyectos, reejecutar con FIREBASE_PROJECT_ID correspondiente
- Para remover claim después: ejecutar setCustomUserClaims con admin: undefined
`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error aplicando claims: ${error.message}`);
    console.error("   El claim admin: true no pudo asignarse");
    process.exit(1);
  }

} catch (error) {
  console.error("❌ Error fatal:", error.message);
  process.exit(1);
}