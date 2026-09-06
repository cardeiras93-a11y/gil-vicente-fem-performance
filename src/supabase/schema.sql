-- ==============================================================================
-- SCHEMA SQL SUPABASE - GIL VICENTE FUTEBOL CLUBE (PERFORMANCE & SAÚDE)
-- ==============================================================================

-- 1. TABELA DE ATLETAS
CREATE TABLE IF NOT EXISTS public.athletes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE QUESTIONÁRIOS DE WELLNESS (PRÉ-TREINO)
CREATE TABLE IF NOT EXISTS public.wellness_entries (
    id TEXT PRIMARY KEY,
    athlete_id TEXT NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    athlete_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    menstrual_cycle TEXT NOT NULL,
    sleep_quality INT NOT NULL CHECK (sleep_quality BETWEEN 1 AND 5),
    sleep_duration INT NOT NULL CHECK (sleep_duration BETWEEN 1 AND 5),
    mood INT NOT NULL CHECK (mood BETWEEN 1 AND 5),
    stress INT NOT NULL CHECK (stress BETWEEN 1 AND 5),
    fatigue INT NOT NULL CHECK (fatigue BETWEEN 1 AND 5),
    soreness INT NOT NULL CHECK (soreness BETWEEN 1 AND 5),
    heavy_legs INT NOT NULL CHECK (heavy_legs BETWEEN 1 AND 5),
    muscle_fatigue JSONB DEFAULT '{}'::jsonb,
    needs_physio BOOLEAN NOT NULL DEFAULT FALSE,
    physio_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE PERCEÇÃO DE ESFORÇO - RPE (PÓS-TREINO)
CREATE TABLE IF NOT EXISTS public.rpe_entries (
    id TEXT PRIMARY KEY,
    athlete_id TEXT NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    athlete_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    physical_demand INT NOT NULL CHECK (physical_demand BETWEEN 1 AND 10),
    post_fatigue INT NOT NULL CHECK (post_fatigue BETWEEN 1 AND 10),
    muscle_fatigue JSONB DEFAULT '{}'::jsonb,
    pre_workout_plans JSONB DEFAULT '[]'::jsonb,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE HIDRATAÇÃO E RECUPERAÇÃO HÍDRICA
CREATE TABLE IF NOT EXISTS public.hydration_entries (
    id TEXT PRIMARY KEY,
    athlete_id TEXT NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    athlete_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_min INT,
    pre_weight NUMERIC(5,2) NOT NULL,
    post_weight NUMERIC(5,2) NOT NULL,
    fluids_intake NUMERIC(5,2) DEFAULT 0,
    weight_loss NUMERIC(5,2) NOT NULL,
    dehydration_rate NUMERIC(5,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Adequada', 'Atenção', 'Alerta')),
    refill_needed_liters NUMERIC(5,2) NOT NULL,
    recommendation TEXT NOT NULL,
    biological_impact TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES PARA CONSULTAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_wellness_athlete_date ON public.wellness_entries(athlete_id, date);
CREATE INDEX IF NOT EXISTS idx_rpe_athlete_date ON public.rpe_entries(athlete_id, date);
CREATE INDEX IF NOT EXISTS idx_hydration_athlete_date ON public.hydration_entries(athlete_id, date);

-- POLÍTICAS DE ACESSO PÚBLICO (RLS)
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpe_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total aos Atletas" ON public.athletes FOR ALL USING (true);
CREATE POLICY "Acesso total ao Wellness" ON public.wellness_entries FOR ALL USING (true);
CREATE POLICY "Acesso total ao RPE" ON public.rpe_entries FOR ALL USING (true);
CREATE POLICY "Acesso total a Hidratacao" ON public.hydration_entries FOR ALL USING (true);

-- INSERÇÃO INICIAL DO PLANTEL OFICIAL GIL VICENTE FC (25 ATLETAS)
INSERT INTO public.athletes (id, name) VALUES
('ath-1', 'CARLOTA'),
('ath-2', 'CAROL'),
('ath-3', 'CARTAXO'),
('ath-4', 'EVA'),
('ath-5', 'FAITH'),
('ath-6', 'LARA'),
('ath-7', 'LAURA'),
('ath-8', 'LUANA CORREIA'),
('ath-9', 'LUANA MACEDO'),
('ath-10', 'MAGUI'),
('ath-11', 'MALTA'),
('ath-12', 'MANU'),
('ath-13', 'MARTHE'),
('ath-14', 'MERIVA'),
('ath-15', 'NICOLE'),
('ath-16', 'RAMOS'),
('ath-17', 'RIBEIRO'),
('ath-18', 'RITA R.'),
('ath-19', 'SARA ALVES'),
('ath-20', 'SARA TEIXEIRA'),
('ath-21', 'SERENA'),
('ath-22', 'SIMÃES'),
('ath-23', 'TICHA'),
('ath-24', 'TITA'),
('ath-25', 'VERÓNICA')
ON CONFLICT (id) DO NOTHING;
