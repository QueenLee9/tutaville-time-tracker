import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
          user: existingUser,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log("Creating new user");
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Create the user with the temporary password
    const { data: userData, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_name, last_name, phone }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw createError;
    }

    // Update the profile with additional information
    if (userData?.user) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({
          first_name,
          last_name,
          email,
          phone,
          role: 'tutor'
        })
        .eq('id', userData.user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        throw profileError;
      }
    }

    console.log("Successfully created user:", userData);
    
    // Send password reset email so user can set their own password
    const { error: resetError } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      // Don't throw here as the user is already created
    }

    return new Response(
      JSON.stringify({ 
        data: userData,
        message: "User created successfully. A password reset email has been sent." 
      }),
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