import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CacheManager } from "@/lib/cacheManager";
import { useAuth } from "@/hooks/useAuth";
import { FaApple, FaGoogle, FaEnvelope, FaArrowLeft } from "react-icons/fa";
import logoPath from "@assets/CL Logo Mark-02_1754280692282.png";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [authMethod, setAuthMethod] = useState<'welcome' | 'email' | 'apple' | 'google'>('welcome');
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });
  
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome back!",
        description: `Hello ${user.firstName}!`,
      });
      setLocation("/clubs");
    },
    onError: (error: any) => {
      toast({
        title: "Invalid username or password",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome to Corner League!",
        description: `Account created for ${user.firstName}!`,
      });
      setLocation("/clubs");
    },
    onError: (error: any) => {
      let title = "Registration failed";
      let description = "Please try again with different information.";
      
      if (error.message === "Username already exists") {
        title = "Username already taken";
        description = "Please choose a different username.";
      } else if (error.message === "Email already exists") {
        title = "Email already registered";
        description = "Please use a different email address or try logging in.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    const { confirmPassword, ...dataToSend } = registerData;
    registerMutation.mutate(dataToSend);
  };

  const handleAppleLogin = () => {
    toast({
      title: "Apple Sign In",
      description: "Apple Sign In is not yet implemented",
      variant: "destructive",
    });
  };

  const handleGoogleLogin = () => {
    toast({
      title: "Google Sign In",
      description: "Google Sign In is not yet implemented",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {authMethod === 'welcome' ? (
          /* Welcome Screen */
          <>
            {/* Back Arrow */}
            <div className="absolute top-6 left-6">
              <button
                onClick={() => setLocation('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaArrowLeft size={24} />
              </button>
            </div>

            {/* Logo */}
            <div className="text-center mb-16">
              <div className="flex justify-center mb-8">
                <img 
                  src={logoPath} 
                  alt="Corner League Logo" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <h1 className="text-4xl font-light mb-4">Welcome</h1>
            </div>

            {/* Auth Options */}
            <div className="flex justify-center items-center gap-8 mb-16">
              {/* Apple */}
              <button
                onClick={handleAppleLogin}
                className="w-20 h-20 rounded-full border border-gray-600 hover:border-gray-400 transition-colors duration-300 flex items-center justify-center group"
              >
                <FaApple size={28} className="text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                className="w-20 h-20 rounded-full border border-gray-600 hover:border-gray-400 transition-colors duration-300 flex items-center justify-center group"
              >
                <FaGoogle size={24} className="text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* Email */}
              <button
                onClick={() => setAuthMethod('email')}
                className="w-20 h-20 rounded-full border border-gray-600 hover:border-gray-400 transition-colors duration-300 flex items-center justify-center group"
              >
                <FaEnvelope size={24} className="text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Terms */}
            <p className="text-center text-sm text-gray-500 px-8 leading-relaxed">
              By continuing, you agree to our Terms and Privacy Policy.
            </p>
          </>
        ) : authMethod === 'email' ? (
          /* Email Auth Form */
          <>
            {/* Back Button */}
            <div className="absolute top-6 left-6">
              <button
                onClick={() => setAuthMethod('welcome')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaArrowLeft size={24} />
              </button>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light mb-4">
                {isLogin ? 'Sign In' : 'Create Account'}
              </h1>
              <p className="text-gray-400">
                {isLogin ? "Sign in to access clubs and connect with other fans" : "Create your account to get started"}
              </p>
            </div>

            {/* Auth Toggle */}
            <div className="flex mb-8 bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-4 rounded-md transition-colors ${
                  isLogin ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-4 rounded-md transition-colors ${
                  !isLogin ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Auth Form */}
            <div className="space-y-6">
              {isLogin ? (
                /* Login Form */
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <input
                      type="text"
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Username"
                      required
                    />
                  </div>
                  
                  <div>
                    <input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full px-6 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                      className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="First name"
                      required
                    />
                    <input
                      type="text"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                      className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Last name"
                      required
                    />
                  </div>

                  <input
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                    className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Choose a username"
                    required
                  />

                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />

                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Create a password"
                    required
                  />

                  <input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Confirm your password"
                    required
                  />

                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full px-6 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>
              )}

              {/* Terms */}
              <p className="text-center text-xs text-gray-500 mt-8">
                By {isLogin ? 'signing in' : 'creating an account'}, you agree to our Terms and Privacy Policy.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}