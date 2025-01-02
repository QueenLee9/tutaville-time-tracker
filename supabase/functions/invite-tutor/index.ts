import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Starting invite-tutor function");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { email, first_name, last_name, phone } = await req.json()
    console.log("Received data:", { email, first_name, last_name, phone });

    // First check if user already exists
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing user:", checkError);
      throw checkError;
    }

    if (existingUser) {
      console.log("User already exists:", existingUser);
      return new Response(
        JSON.stringify({
          error: 'User already exists',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log("Inviting new user");
    const { data, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          first_name,
          last_name,
          phone,
          role: 'tutor',
        },
      }
    )

    if (inviteError) {
      console.error("Error inviting user:", inviteError);
      throw inviteError;
    }

    console.log("Successfully invited user:", data);
    return new Response(
      JSON.stringify({ data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in invite-tutor function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})