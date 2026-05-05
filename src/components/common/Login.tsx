"use client";

import React, { useState } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  LayoutGrid,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginProps {
  onLoginSuccess?: () => void;
}

interface PasswordStrength {
  score: number; // 0–4
  label: string;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map: Record<number, { label: string; color: string }> = {
    0: { label: "Too short", color: "bg-gray-200" },
    1: { label: "Weak", color: "bg-red-400" },
    2: { label: "Fair", color: "bg-orange-400" },
    3: { label: "Good", color: "bg-yellow-400" },
    4: { label: "Strong", color: "bg-green-500" },
  };

  return { score, ...map[score] };
}

// ─── Password Input ────────────────────────────────────────────────────────────

function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder ?? "••••••••"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="pl-9 pr-10 h-11 border-gray-200 focus-visible:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Strength Bar ─────────────────────────────────────────────────────────────

function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color } = getPasswordStrength(password);
  const labelColor =
    score <= 1
      ? "text-red-500"
      : score === 2
        ? "text-orange-500"
        : score === 3
          ? "text-yellow-600"
          : "text-green-600";

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-1 rounded-full transition-all duration-300",
              i <= score ? color : "bg-gray-200",
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", labelColor)}>{label}</p>
    </div>
  );
}

// ─── OAuth Buttons ────────────────────────────────────────────────────────────

function OAuthButtons() {
  return (
    <>
      <div className="relative my-5">
        <Separator />
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-400">
          or continue with
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-10 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-sm font-medium"
        >
          {/* Google icon */}
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-sm font-medium"
        >
          {/* Microsoft icon */}
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path fill="#f25022" d="M1 1h10v10H1z" />
            <path fill="#00a4ef" d="M13 1h10v10H13z" />
            <path fill="#7fba00" d="M1 13h10v10H1z" />
            <path fill="#ffb900" d="M13 13h10v10H13z" />
          </svg>
          Microsoft
        </Button>
      </div>
    </>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, clearError, registerUser } from "@/store/slices/authSlice";

function LoginForm({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return;
    }
    setSuccess("");
    dispatch(clearError());

    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      setSuccess("Signed in successfully! Redirecting…");
      setTimeout(() => onLoginSuccess?.(), 1000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert
          variant="destructive"
          className="py-2.5 border-red-200 bg-red-50 text-red-700"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="py-2.5 border-green-200 bg-green-50 text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <Label
          htmlFor="login-email"
          className="text-sm font-medium text-gray-700"
        >
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            id="login-email"
            type="email"
            placeholder="admin@actbusiness.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="pl-9 h-11 border-gray-200 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="login-password"
            className="text-sm font-medium text-gray-700"
          >
            Password
          </Label>
          <button
            type="button"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <PasswordInput
          id="login-password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm shadow-blue-200 transition-all"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
      </Button>

      <OAuthButtons />
    </form>
  );
}

// ─── Signup Form ──────────────────────────────────────────────────────────────

function SignupForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [success, setSuccess] = useState("");

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      return;
    }
    if (!agreed) {
      return;
    }
    
    setSuccess("");
    dispatch(clearError());

    const result = await dispatch(registerUser({ 
      name: `${firstName} ${lastName}`,
      email, 
      organisationName: company,
      password 
    }));

    if (registerUser.fulfilled.match(result)) {
      setSuccess("Account created! Please check your email to verify.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert
          variant="destructive"
          className="py-2.5 border-red-200 bg-red-50 text-red-700"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="py-2.5 border-green-200 bg-green-50 text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="signup-first"
            className="text-sm font-medium text-gray-700"
          >
            First Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              id="signup-first"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="pl-9 h-11 border-gray-200 focus-visible:ring-blue-500"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="signup-last"
            className="text-sm font-medium text-gray-700"
          >
            Last Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              id="signup-last"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="pl-9 h-11 border-gray-200 focus-visible:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Work Email */}
      <div className="space-y-1.5">
        <Label
          htmlFor="signup-email"
          className="text-sm font-medium text-gray-700"
        >
          Work Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            id="signup-email"
            type="email"
            placeholder="john@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="pl-9 h-11 border-gray-200 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* Company */}
      <div className="space-y-1.5">
        <Label
          htmlFor="signup-company"
          className="text-sm font-medium text-gray-700"
        >
          Company Name{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            id="signup-company"
            type="text"
            placeholder="Acme Corp"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="pl-9 h-11 border-gray-200 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label
          htmlFor="signup-password"
          className="text-sm font-medium text-gray-700"
        >
          Password
        </Label>
        <PasswordInput
          id="signup-password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <StrengthBar password={password} />
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2.5 pt-1">
        <Checkbox
          id="terms"
          checked={agreed}
          onCheckedChange={(v) => setAgreed(v === true)}
          className="mt-0.5 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
        <label
          htmlFor="terms"
          className="text-sm text-gray-500 leading-relaxed cursor-pointer"
        >
          I agree to the{" "}
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            Privacy Policy
          </a>
        </label>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm shadow-blue-200 transition-all"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Create Account"
        )}
      </Button>

      <OAuthButtons />
    </form>
  );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────

export default function AuthPage({ onLoginSuccess }: LoginProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-10">
      {/* Soft background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-100 rounded-full opacity-50 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl mb-3 shadow-md shadow-blue-200">
            <LayoutGrid className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            ACT Business Solution
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Enterprise Management Platform
          </p>
        </div>

        {/* Card */}
        <Card className="border border-gray-100 shadow-xl shadow-gray-100/60 rounded-2xl bg-white">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-0 pt-6 px-6">
              <TabsList className="w-full h-10 bg-gray-100 rounded-xl p-1">
                <TabsTrigger
                  value="login"
                  className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* Login */}
            <TabsContent value="login" className="mt-0">
              <CardContent className="px-6 pt-5 pb-6">
                <div className="mb-5">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Welcome back 👋
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-400 mt-1">
                    Sign in to continue to your dashboard
                  </CardDescription>
                </div>
                <LoginForm onLoginSuccess={onLoginSuccess} />
              </CardContent>
            </TabsContent>

            {/* Signup */}
            <TabsContent value="signup" className="mt-0">
              <CardContent className="px-6 pt-5 pb-6">
                <div className="mb-5">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Create your account
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-400 mt-1">
                    Join ACT Business Solution today — it's free
                  </CardDescription>
                </div>
                <SignupForm />
              </CardContent>
            </TabsContent>
          </Tabs>

          <CardFooter className="justify-center border-t border-gray-100 py-4">
            <p className="text-xs text-gray-400">
              Protected by enterprise-grade security &nbsp;·&nbsp;{" "}
              <a href="#" className="text-blue-500 hover:text-blue-600">
                Privacy Policy
              </a>
            </p>
          </CardFooter>
        </Card>

        {/* Version badge */}
        <div className="text-center mt-5">
          <Badge
            variant="outline"
            className="text-xs text-gray-400 border-gray-200 font-normal"
          >
            ACT v2.4.0
          </Badge>
        </div>
      </div>
    </div>
  );
}
