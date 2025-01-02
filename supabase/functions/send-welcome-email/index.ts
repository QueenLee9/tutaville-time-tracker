import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName } = await req.json();
    
    console.log("Sending welcome email to:", email);

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    // Generate password reset link
    const { data: { user }, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (resetError) throw resetError;

    // Send email using Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Tutaville <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to Tutaville - Set Up Your Account",
        html: `
          <h2>Welcome to Tutaville${firstName ? `, ${firstName}` : ''}!</h2>
          <p>You've been added as a tutor to our platform.</p>
          <p>To set up your account and create your password, please click the link below:</p>
          <p><a href="${user?.recovery_links?.[0]?.href}">Set Up Your Account</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The Tutaville Team</p>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

serve(handler);