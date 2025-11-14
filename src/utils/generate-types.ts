/**
 * scripts/generate-types.ts
 * Генерирует TypeScript определения из JSON Schema, рекурсивно проходя src/validators.
 *
 * Запуск: npx ts-node scripts/generate-types.ts
 */

import fs from "fs";
import path from "path";
import { compileFromFile } from "json-schema-to-typescript";

const validatorsDir = path.resolve("src/validators"); // папка со схемами
const typesDir = path.resolve("src/types/schemas");   // куда сохраняем сгенерированные типы

// Рекурсивно ищем все файлы *.schema.json в папке validators.
// Возвращаем массив абсолютных путей к файлам.
function walkSchemas(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result: string[] = [];

  for (const ent of entries) {
    const fullPath = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      result.push(...walkSchemas(fullPath));
    } else if (ent.isFile() && ent.name.endsWith(".schema.json")) {
      result.push(fullPath);
    }
  }

  return result;
}

async function main(): Promise<void> {
  if (!fs.existsSync(validatorsDir)) {
    console.warn(`Validators directory not found: ${validatorsDir}`);
    return;
  }

  const schemas = walkSchemas(validatorsDir);
  if (schemas.length === 0) {
    console.log("No schema files found.");
    return;
  }

  // Убедимся, что папка для типов существует
  fs.mkdirSync(typesDir, { recursive: true });

  for (const schemaPath of schemas) {
    try {
      // относительный путь внутри validators (например auth/register.schema.json)
      const relative = path.relative(validatorsDir, schemaPath);
      // целевой путь для .d.ts (например src/types/schemas/auth/register.d.ts)
      const outPath = path.join(typesDir, relative.replace(".schema.json", ".d.ts"));

      // compileFromFile читает файл и возвращает Promise<string> с содержимым .d.ts
      const compiled = await compileFromFile(schemaPath, {
        bannerComment: `/* AUTO-GENERATED FILE — DO NOT EDIT MANUALLY */\n/* Generated from: ${relative} */`,
        style: { singleQuote: true },
      });

      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, compiled, { encoding: "utf-8" });

      console.log(`✅ Generated types for ${relative} -> ${path.relative(process.cwd(), outPath)}`);
    } catch (err) {
      console.error(`❌ Failed to generate types for ${schemaPath}:`, err);
      // не прерываем весь цикл, идём дальше
    }
  }
}

main().catch((err) => {
  console.error("Fatal error in generate-types script:", err);
  process.exit(1);
});