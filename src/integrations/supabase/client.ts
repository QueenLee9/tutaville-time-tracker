// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://payxlkocpgwganjtnuzm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBheXhsa29jcGd3Z2FuanRudXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxNjA1MjUsImV4cCI6MjA1MDczNjUyNX0.XWaNUjMJHFAhU2PB31ItYbCdZVjJRiAF1oLX17BITZk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);