-- Script para hacer que la columna 'type' en Tancada coincida exactamente con lo que Prisma espera
-- Prisma schema: VARCHAR NOT NULL DEFAULT 'FUMIGACION' + CHECK ("type" IN ('FUMIGACION', 'SIEMBRA'))
-- La columna ya fue creada como VARCHAR nullable, este script la hace match con Prisma

-- Paso 1: Asegurar que los datos existentes tengan valor antes de hacer NOT NULL
UPDATE "Tancada" SET "type" = 'FUMIGACION' WHERE "type" IS NULL;

-- Paso 2: Eliminar constraint anterior si existe (para poder recrearla)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Tancada_type_check'
    ) THEN
        ALTER TABLE "Tancada" DROP CONSTRAINT "Tancada_type_check";
    END IF;
END $$;

-- Paso 3: Agregar constraint CHECK
ALTER TABLE "Tancada" ADD CONSTRAINT "Tancada_type_check" CHECK ("type" IN ('FUMIGACION', 'SIEMBRA'));

-- Paso 4: Agregar DEFAULT 'FUMIGACION' a la columna
ALTER TABLE "Tancada" ALTER COLUMN "type" SET DEFAULT 'FUMIGACION';

-- Paso 5: Hacer NOT NULL (ahora que tiene valor default y constraint)
ALTER TABLE "Tancada" ALTER COLUMN "type" SET NOT NULL;

-- Verificar que quedó correcto
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'Tancada' AND column_name = 'type';

-- Verificar constraint
-- SELECT constraint_name, check_clause FROM information_schema.table_constraints WHERE table_name = 'Tancada';