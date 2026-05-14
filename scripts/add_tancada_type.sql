-- Script para agregar columna 'type' a Tancada cuando ya existen datos
-- Problema: Prisma no puede hacer cast implícito de NULL a 'FUMIGACION'/'SIEMBRA'
-- Solución: Agregar columna nullable, actualizar datos, luego hacer NOT NULL

-- Paso 1: Agregar columna como nullable (sin default, para evitar error de cast)
ALTER TABLE "Tancada" ADD COLUMN "type" VARCHAR(20);

-- Paso 2: Actualizar todas las tancadas existentes a 'FUMIGACION'
UPDATE "Tancada" SET "type" = 'FUMIGACION' WHERE "type" IS NULL;

-- Paso 3: Agregar constraint CHECK
ALTER TABLE "Tancada" ADD CONSTRAINT "Tancada_type_check" CHECK ("type" IN ('FUMIGACION', 'SIEMBRA'));

-- Paso 4: Hacer la columna NOT NULL (después de updatear los datos)
ALTER TABLE "Tancada" ALTER COLUMN "type" SET NOT NULL;

-- Verificar
-- SELECT "id", "type", "date" FROM "Tancada" LIMIT 10;