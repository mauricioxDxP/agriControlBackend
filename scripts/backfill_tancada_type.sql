-- Script para actualizar todas las tancadas existentes a 'FUMIGACION'
-- Esto es necesario si ya existían tancadas antes de agregar el campo type

UPDATE "Tancada" SET "type" = 'FUMIGACION' WHERE "type" IS NULL;