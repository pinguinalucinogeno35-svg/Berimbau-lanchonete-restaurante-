// Valida os GLB de public/demo/models com o validador oficial do Khronos.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import validator from 'gltf-validator';

const dir = process.argv[2] || 'public/demo/models';
let falhou = false;
for (const f of readdirSync(dir).filter((f) => f.endsWith('.glb'))) {
  const r = await validator.validateBytes(new Uint8Array(readFileSync(join(dir, f))));
  const { numErrors, numWarnings } = r.issues;
  console.log(`${f}: ${numErrors} erros, ${numWarnings} avisos`);
  for (const m of r.issues.messages.filter((m) => m.severity <= 1))
    console.log(`  - ${m.code}: ${m.message} ${m.pointer ?? ''}`);
  if (numErrors) falhou = true;
}
process.exit(falhou ? 1 : 0);
