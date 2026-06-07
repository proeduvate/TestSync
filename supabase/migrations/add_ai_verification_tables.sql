-- ============================================================
-- AI Verification Tables
-- Run this migration in your Supabase SQL editor
-- ============================================================

-- 1. proof_hashes — stores perceptual hash per submitted proof URL
--    Used for image duplicate detection (simulated pHash via URL fingerprint)
CREATE TABLE IF NOT EXISTS proof_hashes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id   UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    tester_id     UUID NOT NULL,
    task_id       UUID NOT NULL,
    proof_url     TEXT NOT NULL,
    url_hash      TEXT NOT NULL,         -- SHA-256 of normalized proof URL (proxy for pHash)
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proof_hashes_url_hash  ON proof_hashes(url_hash);
CREATE INDEX IF NOT EXISTS idx_proof_hashes_tester_id ON proof_hashes(tester_id);

-- 2. proof_embeddings — stores extracted text + embedding vector for text duplicate detection
CREATE TABLE IF NOT EXISTS proof_embeddings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id         UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    tester_id           UUID NOT NULL,
    task_id             UUID NOT NULL,
    extracted_text      TEXT,            -- Text pulled by Vision LLM from the proof
    embedding           vector(1536),    -- text-embedding-3-small output (1536-dim)
    similarity_threshold FLOAT DEFAULT 0.90,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proof_embeddings_tester_id ON proof_embeddings(tester_id);

-- Enable pgvector extension (required for vector similarity search)
-- NOTE: Run this separately if not already enabled:
-- CREATE EXTENSION IF NOT EXISTS vector;

-- 3. ai_verification_log — full audit trail of every AI pipeline run
CREATE TABLE IF NOT EXISTS ai_verification_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id         UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    tester_id           UUID NOT NULL,
    task_id             UUID NOT NULL,

    -- Stage 1: Vision LLM result
    vision_is_valid         BOOLEAN,
    vision_confidence       FLOAT,
    vision_proof_type       TEXT,
    vision_detected_text    TEXT,
    vision_reason           TEXT,

    -- Stage 2: Image duplicate check
    image_duplicate         BOOLEAN DEFAULT FALSE,
    image_similarity_score  FLOAT,
    image_matched_proof_id  UUID,

    -- Stage 3: Text duplicate check
    text_duplicate          BOOLEAN DEFAULT FALSE,
    text_similarity_score   FLOAT,
    text_matched_feedback_id UUID,

    -- Stage 4: Credit recommendation
    recommended_credits     INTEGER DEFAULT 0,
    credit_status           TEXT DEFAULT 'pending',  -- approved | partial | review | rejected
    credit_reason           TEXT,

    -- Final outcome
    final_status            TEXT DEFAULT 'pending',  -- approved | partial | manual_review | rejected
    pipeline_ran_at         TIMESTAMPTZ DEFAULT NOW(),
    error_message           TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_log_feedback_id ON ai_verification_log(feedback_id);
CREATE INDEX IF NOT EXISTS idx_ai_log_tester_id   ON ai_verification_log(tester_id);
