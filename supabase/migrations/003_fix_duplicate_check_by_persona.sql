-- ============================================
-- Migración 003: Cambiar verificación de duplicados
-- De email/telefon a persona_id para permitir
-- envíos a personas distintas con mismo email/teléfono
-- ============================================

-- Eliminar funciones antiguas (con firma antigua)
DROP FUNCTION IF EXISTS was_email_sent_today(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS was_sms_sent_today(VARCHAR, VARCHAR);

-- Nueva función: verificar si email ya enviado hoy POR PERSONA
CREATE OR REPLACE FUNCTION was_email_sent_today(p_persona_id INTEGER, p_tipus VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM log_emails
        WHERE persona_id = p_persona_id
          AND tipus = p_tipus
          AND estat = 'SUCCESS'
          AND DATE(sent_at) = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Nueva función: verificar si SMS ya enviado hoy POR PERSONA
CREATE OR REPLACE FUNCTION was_sms_sent_today(p_persona_id INTEGER, p_tipus VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM log_sms
        WHERE persona_id = p_persona_id
          AND tipus = p_tipus
          AND estat = 'SUCCESS'
          AND DATE(sent_at) = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Índices para optimizar las consultas por persona_id
CREATE INDEX IF NOT EXISTS idx_log_emails_persona_id ON log_emails(persona_id);
CREATE INDEX IF NOT EXISTS idx_log_sms_persona_id ON log_sms(persona_id);
