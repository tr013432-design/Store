import { createClient } from '@supabase/supabase-js';

// 1. Cole aqui o "Project URL" que você pegou nas configurações:
const SUPABASE_URL = 'https://yhhlxiurgagojdtzznla.supabase.co'; 

// 2. Cole aqui a chave "anon" / "public" (é um textão comprido):
const SUPABASE_ANON_KEY = 'sb_publishable_MWxPpWmSgu0UNmR_uemClg_PoFn4Oqv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
