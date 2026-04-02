-- ============================================
-- Migración inicial: Aniversaris Familiars
-- De Google Sheets a Supabase PostgreSQL
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA PRINCIPAL: personas
-- ============================================
CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    dia INTEGER NOT NULL CHECK (dia >= 1 AND dia <= 31),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    any_naixement INTEGER,
    telefon VARCHAR(20),
    email VARCHAR(255),
    genere CHAR(1) CHECK (genere IN ('H', 'D', NULL)),
    viu BOOLEAN DEFAULT TRUE,
    pare_id INTEGER REFERENCES personas(id) ON DELETE SET NULL,
    mare_id INTEGER REFERENCES personas(id) ON DELETE SET NULL,
    parella_id INTEGER REFERENCES personas(id) ON DELETE SET NULL,
    url_foto TEXT,
    estat_relacio VARCHAR(50),
    lloc_naixement VARCHAR(255),
    any_mort INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_personas_aniversari ON personas(mes, dia);
CREATE INDEX idx_personas_nom ON personas(LOWER(nom));
CREATE INDEX idx_personas_viu ON personas(viu);

-- ============================================
-- TABLA: personas_eliminadas (log de eliminados)
-- ============================================
CREATE TABLE personas_eliminadas (
    id SERIAL PRIMARY KEY,
    persona_id INTEGER,
    nom VARCHAR(255) NOT NULL,
    dia INTEGER,
    mes INTEGER,
    any_naixement INTEGER,
    telefon VARCHAR(20),
    email VARCHAR(255),
    genere CHAR(1),
    viu BOOLEAN,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_by VARCHAR(255)
);

-- ============================================
-- TABLA: log_emails
-- ============================================
CREATE TABLE log_emails (
    id SERIAL PRIMARY KEY,
    persona_id INTEGER REFERENCES personas(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    nom_destinatari VARCHAR(255),
    tipus VARCHAR(50) NOT NULL,  -- 'BIRTHDAY', 'REMINDER'
    estat VARCHAR(20) NOT NULL,  -- 'SUCCESS', 'FAILED', 'SKIPPED', 'NO_BIRTHDAYS'
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_log_emails_sent_at ON log_emails(sent_at);
CREATE INDEX idx_log_emails_email ON log_emails(email);

-- ============================================
-- TABLA: log_sms
-- ============================================
CREATE TABLE log_sms (
    id SERIAL PRIMARY KEY,
    persona_id INTEGER REFERENCES personas(id) ON DELETE SET NULL,
    telefon VARCHAR(20) NOT NULL,
    nom_destinatari VARCHAR(255),
    tipus VARCHAR(50) NOT NULL,  -- 'BIRTHDAY', 'REMINDER'
    estat VARCHAR(20) NOT NULL,  -- 'SUCCESS', 'FAILED', 'SKIPPED', 'NO_BIRTHDAYS'
    twilio_sid VARCHAR(50),
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_log_sms_sent_at ON log_sms(sent_at);
CREATE INDEX idx_log_sms_telefon ON log_sms(telefon);

-- ============================================
-- TABLA: configuracion
-- ============================================
CREATE TABLE configuracion (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT,
    descripcion TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO configuracion (clave, valor, descripcion) VALUES
    ('manteniment', 'false', 'Modo mantenimiento activo'),
    ('email_actiu', 'true', 'Envío de emails habilitado'),
    ('sms_actiu', 'true', 'Envío de SMS habilitado'),
    ('hora_envio_recordatoris', '20:00', 'Hora de envío de recordatorios');

-- ============================================
-- FUNCIÓN: actualizar timestamp updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en personas
CREATE TRIGGER update_personas_updated_at
    BEFORE UPDATE ON personas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en configuracion
CREATE TRIGGER update_configuracion_updated_at
    BEFORE UPDATE ON configuracion
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCIÓN: obtener cumpleaños de hoy
-- ============================================
CREATE OR REPLACE FUNCTION get_today_birthdays()
RETURNS TABLE (
    id INTEGER,
    nom VARCHAR,
    dia INTEGER,
    mes INTEGER,
    any_naixement INTEGER,
    telefon VARCHAR,
    email VARCHAR,
    genere CHAR,
    edat INTEGER
) AS $$
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
        CASE
            WHEN p.any_naixement IS NOT NULL
            THEN EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - p.any_naixement
            ELSE NULL
        END as edat
    FROM personas p
    WHERE p.dia = EXTRACT(DAY FROM CURRENT_DATE)
      AND p.mes = EXTRACT(MONTH FROM CURRENT_DATE)
      AND p.viu = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: obtener cumpleaños de mañana
-- ============================================
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
      AND p.mes = EXTRACT(MONTH FROM tomorrow);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: obtener miembros activos
-- ============================================
CREATE OR REPLACE FUNCTION get_active_members()
RETURNS TABLE (
    id INTEGER,
    nom VARCHAR,
    email VARCHAR,
    telefon VARCHAR,
    genere CHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.nom,
        p.email,
        p.telefon,
        p.genere
    FROM personas p
    WHERE p.viu = TRUE
      AND (p.email IS NOT NULL OR p.telefon IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: verificar si email ya enviado hoy
-- ============================================
CREATE OR REPLACE FUNCTION was_email_sent_today(p_email VARCHAR, p_tipus VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM log_emails
        WHERE email = p_email
          AND tipus = p_tipus
          AND estat = 'SUCCESS'
          AND DATE(sent_at) = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: verificar si SMS ya enviado hoy
-- ============================================
CREATE OR REPLACE FUNCTION was_sms_sent_today(p_telefon VARCHAR, p_tipus VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM log_sms
        WHERE telefon = p_telefon
          AND tipus = p_tipus
          AND estat = 'SUCCESS'
          AND DATE(sent_at) = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: calcular similitud de nombres (Levenshtein simplificado)
-- ============================================
CREATE OR REPLACE FUNCTION name_similarity(name1 VARCHAR, name2 VARCHAR)
RETURNS FLOAT AS $$
DECLARE
    s1 VARCHAR;
    s2 VARCHAR;
    len1 INTEGER;
    len2 INTEGER;
    max_len INTEGER;
BEGIN
    -- Normalizar: minúsculas, sin acentos, sin espacios extra
    s1 := LOWER(TRIM(REGEXP_REPLACE(
        TRANSLATE(name1, 'áéíóúàèìòùâêîôûäëïöüñç', 'aeiouaeiouaeiouaeiounç'),
        '\s+', ' ', 'g'
    )));
    s2 := LOWER(TRIM(REGEXP_REPLACE(
        TRANSLATE(name2, 'áéíóúàèìòùâêîôûäëïöüñç', 'aeiouaeiouaeiouaeiounç'),
        '\s+', ' ', 'g'
    )));

    -- Si son idénticos
    IF s1 = s2 THEN
        RETURN 1.0;
    END IF;

    -- Si uno contiene al otro
    IF POSITION(s1 IN s2) > 0 OR POSITION(s2 IN s1) > 0 THEN
        len1 := LENGTH(s1);
        len2 := LENGTH(s2);
        RETURN LEAST(len1, len2)::FLOAT / GREATEST(len1, len2)::FLOAT;
    END IF;

    -- Similitud básica basada en longitud de prefijo común
    len1 := LENGTH(s1);
    len2 := LENGTH(s2);
    max_len := GREATEST(len1, len2);

    -- Contar caracteres comunes desde el inicio
    DECLARE
        common_prefix INTEGER := 0;
        i INTEGER := 1;
    BEGIN
        WHILE i <= LEAST(len1, len2) AND SUBSTRING(s1 FROM i FOR 1) = SUBSTRING(s2 FROM i FOR 1) LOOP
            common_prefix := common_prefix + 1;
            i := i + 1;
        END LOOP;

        IF max_len = 0 THEN
            RETURN 0.0;
        END IF;

        RETURN common_prefix::FLOAT / max_len::FLOAT;
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: buscar duplicados y similares
-- ============================================
CREATE OR REPLACE FUNCTION find_duplicates_and_similar(
    p_nom VARCHAR,
    p_dia INTEGER,
    p_mes INTEGER,
    p_umbral FLOAT DEFAULT 0.75
)
RETURNS TABLE (
    tipo VARCHAR,
    nombre_existente VARCHAR,
    similitud FLOAT
) AS $$
BEGIN
    -- Buscar duplicado exacto (mismo nombre normalizado)
    RETURN QUERY
    SELECT
        'duplicado_exacto'::VARCHAR as tipo,
        p.nom as nombre_existente,
        1.0::FLOAT as similitud
    FROM personas p
    WHERE name_similarity(p.nom, p_nom) = 1.0
    LIMIT 1;

    -- Si no hay duplicado exacto, buscar similares con misma fecha
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT
            'similar'::VARCHAR as tipo,
            p.nom as nombre_existente,
            name_similarity(p.nom, p_nom) as similitud
        FROM personas p
        WHERE p.dia = p_dia
          AND p.mes = p_mes
          AND name_similarity(p.nom, p_nom) >= p_umbral
          AND name_similarity(p.nom, p_nom) < 1.0
        ORDER BY similitud DESC;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- Por ahora deshabilitadas (acceso público)
-- ============================================
-- ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Acceso público lectura" ON personas FOR SELECT USING (true);
-- CREATE POLICY "Acceso público escritura" ON personas FOR ALL USING (true);

-- ============================================
-- PERMISOS
-- ============================================
-- Permitir acceso anónimo a las tablas (para uso sin autenticación)
GRANT SELECT, INSERT, UPDATE, DELETE ON personas TO anon;
GRANT SELECT, INSERT ON personas_eliminadas TO anon;
GRANT SELECT, INSERT ON log_emails TO anon;
GRANT SELECT, INSERT ON log_sms TO anon;
GRANT SELECT, UPDATE ON configuracion TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- También para el rol authenticated (por si se añade auth en el futuro)
GRANT SELECT, INSERT, UPDATE, DELETE ON personas TO authenticated;
GRANT SELECT, INSERT ON personas_eliminadas TO authenticated;
GRANT SELECT, INSERT ON log_emails TO authenticated;
GRANT SELECT, INSERT ON log_sms TO authenticated;
GRANT SELECT, UPDATE ON configuracion TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
