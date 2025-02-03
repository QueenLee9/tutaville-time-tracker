import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/layout/Footer";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Active session found, redirecting to dashboard");
        navigate("/dashboard");
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === "SIGNED_IN" && session) {
          console.log("User signed in, redirecting to dashboard");
          navigate("/dashboard");
        } else if (event === "SIGNED_OUT") {
          console.log("User signed out, staying on login page");
          navigate("/");
        } else if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
        } else if (event === "USER_UPDATED") {
          console.log("User profile updated");
          if (session) {
            navigate("/dashboard");
          }
        }
      }
    );

    // Handle auth errors using the session state change
    const handleAuthError = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error_description');
      const errorType = urlParams.get('error');
      
      if (error?.includes("Invalid login credentials")) {
        toast({
          title: "Login Failed",
          description: "The email or password you entered is incorrect. Please try again.",
          variant: "destructive",
        });
      } else if (error?.includes("User already registered")) {
        toast({
          title: "Account exists",
          description: "This email is already registered in the system.",
          variant: "destructive",
        });
      } else if (errorType === 'invalid_grant') {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
      } else if (error) {
        toast({
          title: "Error",
          description: "An error occurred during authentication. Please try again.",
          variant: "destructive",
        });
      }
    };

    // Check for auth errors on mount
    handleAuthError();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sage-50 to-sage-100">
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold text-sage-900">Welcome to Tutaville</h1>
            <p className="text-sage-600">
              Sign in to manage your tutoring schedule and time entries
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl p-6">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#7C9082',
                      brandAccent: '#2A4858',
                    },
                  },
                },
              }}
              providers={[]}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;