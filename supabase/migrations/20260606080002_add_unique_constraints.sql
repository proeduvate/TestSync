-- Add UNIQUE constraints to feedback_id columns to allow ON CONFLICT (feedback_id) upserts
ALTER TABLE public.proof_hashes 
    ADD CONSTRAINT unique_proof_hashes_feedback_id UNIQUE (feedback_id);

ALTER TABLE public.proof_embeddings 
    ADD CONSTRAINT unique_proof_embeddings_feedback_id UNIQUE (feedback_id);

ALTER TABLE public.ai_verification_log 
    ADD CONSTRAINT unique_ai_verification_log_feedback_id UNIQUE (feedback_id);
