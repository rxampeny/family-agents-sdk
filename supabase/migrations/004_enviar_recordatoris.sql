-- ============================================
-- Migración 004: Camp enviar_recordatoris
-- Permet excloure persones dels recordatoris
-- ============================================

-- Añadir columna: ¿se envían recordatorios cuando esta persona cumple años?
-- DEFAULT TRUE: todas las personas existentes siguen igual (no hay cambio de datos)
ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS enviar_recordatoris BOOLEAN NOT NULL DEFAULT TRUE;

-- Actualizar get_tomorrow_birthdays() para respetar el flag
-- Si enviar_recordatoris = FALSE, esa persona no aparece en la lista de recordatorios
-- => nadie recibe aviso cuando sea su cumpleaños
CREATE OR REPLACE FUNCTION get_tomorrow_birthdays()
RETURNS TABLE (
    id INTEGER,
    nom VARCHAR,
    dia INTEGER,
    mes INTEGER,
    any_naixement INTEGER,
    telefon VARCHAR,
    email VARCHAR,
    genere CHAR,
    viu BOOLEAN,
    edat INTEGER
) AS $$
DECLARE
    tomorrow DATE := CURRENT_DATE + INTERVAL '1 day';
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.nom,
        p.dia,
        p.mes,
        p.any_naixement,
        p.telefon,
        p.email,
        p.genere,
        p.viu,
        CASE
            WHEN p.any_naixement IS NOT NULL
            THEN EXTRACT(YEAR FROM tomorrow)::INTEGER - p.any_naixement
            ELSE NULL
        END as edat
    FROM personas p
    WHERE p.dia = EXTRACT(DAY FROM tomorrow)
      AND p.mes = EXTRACT(MONTH FROM tomorrow)
      AND p.enviar_recordatoris = TRUE;
END;
$$ LANGUAGE plpgsql;
