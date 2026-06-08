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
  ArrowLeft,
  KeyRound,
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  login,
  clearError,
  registerUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} from "@/store/slices/authSlice";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginProps {
  onLoginSuccess?: () => void;
}

type AuthView = "auth" | "otp" | "forgot";

interface PasswordStrength {
  score: number;
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

// ─── OAuth Buttons ────────────────────────────────────────────────────────────

// function OAuthButtons() {
//   return (
//     <>
//       <div className="relative my-6">
//         <div className="absolute inset-0 flex items-center">
//           <Separator className="w-full border-gray-100" />
//         </div>
//         <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
//           <span className="bg-white px-3 text-gray-400">Or continue with</span>
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-3">
//         <Button
//           variant="outline"
//           className="h-10 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-sm font-medium"
//         >
//           <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
//             <path
//               d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//               fill="#4285F4"
//             />
//             <path
//               d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//               fill="#34A853"
//             />
//             <path
//               d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//               fill="#FBBC05"
//             />
//             <path
//               d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//               fill="#EA4335"
//             />
//           </svg>
//           Google
//         </Button>
//         <Button
//           variant="outline"
//           className="h-10 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-sm font-medium"
//         >
//           <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
//             <path fill="#f25022" d="M1 1h10v10H1z" />
//             <path fill="#00a4ef" d="M13 1h10v10H13z" />
//             <path fill="#7fba00" d="M1 13h10v10H1z" />
//             <path fill="#ffb900" d="M13 13h10v10H13z" />
//           </svg>
//           Microsoft
//         </Button>
//       </div>
//     </>
//   );
// }

// ─── Otp Form ───────────────────────────────────────────────────────────────

function OtpForm({ email, onVerifySuccess }: { email: string; onVerifySuccess?: () => void }) {
  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState("");
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;

    const result = await dispatch(verifyOtp({ email, otp }));
    if (verifyOtp.fulfilled.match(result)) {
      setSuccess("Account verified! Redirecting...");
      setTimeout(() => onVerifySuccess?.(), 1500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="py-2.5 border-red-200 bg-red-50 text-red-700">
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

      <div className="space-y-1.5 text-center">
        <Label htmlFor="otp" className="text-gray-500">
          Enter the 6-digit code sent to <span className="font-semibold text-gray-900">{email}</span>
        </Label>
        <div className="flex justify-center pt-2">
          <Input
            id="otp"
            type="text"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-40 text-center text-2xl tracking-[0.5em] font-bold h-14 border-gray-200 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || otp.length < 6}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-100 transition-all active:scale-[0.98]"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin-slow" />
            Verifying...
          </>
        ) : (
          "Verify Account"
        )}
      </Button>

      <div className="text-center pt-2">
        <button
          type="button"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Didn't receive a code? Resend
        </button>
      </div>
    </form>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({
  onLoginSuccess,
  onForgotPassword,
}: LoginProps & { onForgotPassword: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setSuccess("");
    dispatch(clearError());

    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      setSuccess("Signed in successfully! Redirecting...");
      setTimeout(() => onLoginSuccess?.(), 1000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="py-2.5 border-red-200 bg-red-50 text-red-700">
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

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-gray-700 font-medium ml-1">Work Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9 h-11 border-gray-200 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between ml-1">
          <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <PasswordInput id="password" value={password} onChange={setPassword} />
      </div>

      <div className="flex items-center space-x-2 pt-1 ml-1">
        <Checkbox id="remember" className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
        <Label htmlFor="remember" className="text-xs text-gray-500 font-normal cursor-pointer">Keep me signed in for 30 days</Label>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-100 transition-all active:scale-[0.98] mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin-slow" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      {/* <OAuthButtons /> */}
    </form>
  );
}

// ─── Signup Form ───────────────────────────────────────────────────────────────

function ForgotPasswordForm({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [success, setSuccess] = useState("");
  const [localError, setLocalError] = useState("");

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const strength = getPasswordStrength(newPassword);

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return;

    setSuccess("");
    setLocalError("");
    dispatch(clearError());

    const result = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(result)) {
      setCodeSent(true);
      setSuccess("Reset code sent to your email.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setLocalError("");
    dispatch(clearError());

    if (otp.length < 6) {
      setLocalError("Enter the 6-digit reset code.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    const result = await dispatch(resetPassword({ email, otp, newPassword }));
    if (resetPassword.fulfilled.match(result)) {
      setSuccess("Password reset successful. You can sign in now.");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(onBackToLogin, 1500);
    }
  };

  return (
    <form onSubmit={codeSent ? handleResetPassword : handleSendCode} className="space-y-4">
      {(error || localError) && (
        <Alert variant="destructive" className="py-2.5 border-red-200 bg-red-50 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{localError || error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="py-2.5 border-green-200 bg-green-50 text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="reset-email" className="text-gray-700 font-medium ml-1">Work Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            id="reset-email"
            type="email"
            placeholder="name@company.com"
            value={email}
            disabled={codeSent}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9 h-11 border-gray-200 focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
      </div>

      {codeSent && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="reset-otp" className="text-gray-700 font-medium ml-1">Reset Code</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                className="pl-9 h-11 border-gray-200 focus-visible:ring-blue-500 tracking-[0.3em] font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-gray-700 font-medium ml-1">New Password</Label>
            <PasswordInput id="new-password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
            {newPassword && (
              <div className="px-1 pt-1">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Security Strength</span>
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", strength.color.replace("bg-", "text-"))}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all duration-500", strength.color)} style={{ width: `${(strength.score / 4) * 100}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-gray-700 font-medium ml-1">Confirm Password</Label>
            <PasswordInput id="confirm-password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          </div>
        </>
      )}

      <Button
        type="submit"
        disabled={loading || !email || (codeSent && (!otp || !newPassword || !confirmPassword))}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-100 transition-all active:scale-[0.98] mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin-slow" />
            {codeSent ? "Resetting..." : "Sending code..."}
          </>
        ) : codeSent ? (
          "Reset Password"
        ) : (
          "Send Reset Code"
        )}
      </Button>

      {codeSent && (
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSendCode()}
          disabled={loading}
          className="w-full h-11 border-gray-200 text-gray-700"
        >
          Resend Code
        </Button>
      )}

      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </button>
    </form>
  );
}

function SignupForm({ onSignupSuccess }: { onSignupSuccess: (email: string) => void }) {
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
    if (!firstName || !lastName || !email || !password) return;
    if (!agreed) return;
    
    setSuccess("");
    dispatch(clearError());

    const result = await dispatch(registerUser({ 
      fullname: `${firstName} ${lastName}`,
      email, 
      companyName: company,
      password 
    }));

    if (registerUser.fulfilled.match(result)) {
      setSuccess("Account created! Redirecting to verification...");
      setTimeout(() => onSignupSuccess(email), 1200);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="py-2.5 border-red-200 bg-red-50 text-red-700">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-gray-700 font-medium ml-1">First Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              id="firstName"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="pl-9 h-11 border-gray-200 focus-visible:ring-blue-500"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-gray-700 font-medium ml-1">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-11 border-gray-200 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-email" className="text-gray-700 font-medium ml-1">Work Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            id="signup-email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9 h-11 border-gray-200 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="company" className="text-gray-700 font-medium ml-1">Company Name</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            id="company"
            placeholder="Acme Corp"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="pl-9 h-11 border-gray-200 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-password" className="text-gray-700 font-medium ml-1">Password</Label>
        <PasswordInput id="signup-password" value={password} onChange={setPassword} autoComplete="new-password" />
        {password && (
          <div className="px-1 pt-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Security Strength</span>
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", getPasswordStrength(password).color.replace("bg-", "text-"))}>
                {getPasswordStrength(password).label}
              </span>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className={cn("h-full transition-all duration-500", getPasswordStrength(password).color)} style={{ width: `${(getPasswordStrength(password).score / 4) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start space-x-2 pt-1">
        <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(!!checked)} className="mt-0.5 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
        <Label htmlFor="terms" className="text-xs text-gray-500 leading-normal font-normal cursor-pointer">
          I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
        </Label>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-100 transition-all active:scale-[0.98] mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin-slow" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      {/* <OAuthButtons /> */}
    </form>
  );
}

// ─── OTP Verification Form ───────────────────────────────────────────────────

function OtpFormLegacy({
  email,
  onBackToLogin,
}: {
  email: string;
  onBackToLogin: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState("");

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) {
      return;
    }

    setSuccess("");
    dispatch(clearError());

    const result = await dispatch(verifyOtp({ email, otp }));
    if (verifyOtp.fulfilled.match(result)) {
      setSuccess("OTP verified successfully. Signing you in...");
    }
  };

  const handleResend = async () => {
    if (!email) {
      return;
    }

    setSuccess("");
    dispatch(clearError());
    const result = await dispatch(resendOtp({ email }));
    if (resendOtp.fulfilled.match(result)) {
      setSuccess("A new OTP has been sent to your email.");
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
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

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-gray-700">Email Address</Label>
        <Input value={email} disabled className="h-11 border-gray-200 bg-gray-50" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="otp-code" className="text-sm font-medium text-gray-700">
          OTP Code
        </Label>
        <Input
          id="otp-code"
          type="text"
          inputMode="numeric"
          placeholder="Enter the 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          className="h-11 border-gray-200 focus-visible:ring-blue-500 tracking-[0.3em] text-center text-lg"
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBackToLogin}
          className="w-1/3 h-11 border-gray-200 text-gray-700"
        >
          Back
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleResend}
          disabled={loading}
          className="w-2/3 h-11 border-gray-200 text-gray-700"
        >
          Resend OTP
        </Button>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm shadow-blue-200 transition-all"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin-slow" /> : "Verify OTP"}
      </Button>
    </form>
  );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────

export default function AuthPage({ onLoginSuccess }: LoginProps) {
  const [step, setStep] = useState<AuthView>('auth');
  const [signupEmail, setSignupEmail] = useState("");
  const dispatch = useAppDispatch();

  const handleSignupSuccess = (email: string) => {
    setSignupEmail(email);
    setStep('otp');
  };

  const showAuthTabs = step === 'auth';

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-10">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-100 rounded-full opacity-50 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl mb-3 shadow-md shadow-blue-200">
            <LayoutGrid className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">ACT Business Solution</h1>
          <p className="text-sm text-gray-400 mt-1">Enterprise Management Platform</p>
        </div>

        <Card className="border border-gray-100 shadow-xl shadow-gray-100/60 rounded-2xl bg-white">
          {showAuthTabs ? (
            <Tabs defaultValue="login" className="w-full">
              <CardHeader className="pb-0 pt-6 px-6">
                <TabsList className="w-full h-10 bg-gray-100 rounded-xl p-1">
                  <TabsTrigger value="login" className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500">Create Account</TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="login" className="mt-0">
                <CardContent className="px-6 pt-5 pb-6">
                  <div className="mb-5">
                    <CardTitle className="text-xl font-bold text-gray-900">Welcome back 👋</CardTitle>
                    <CardDescription className="text-sm text-gray-400 mt-1">Sign in to continue to your dashboard</CardDescription>
                  </div>
                  <LoginForm
                    onLoginSuccess={onLoginSuccess}
                    onForgotPassword={() => {
                      dispatch(clearError());
                      setStep('forgot');
                    }}
                  />
                </CardContent>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <CardContent className="px-6 pt-5 pb-6">
                  <div className="mb-5">
                    <CardTitle className="text-xl font-bold text-gray-900">Create your account</CardTitle>
                    <CardDescription className="text-sm text-gray-400 mt-1">Join ACT Business Solution today - it's free</CardDescription>
                  </div>
                  <SignupForm onSignupSuccess={handleSignupSuccess} />
                </CardContent>
              </TabsContent>
            </Tabs>
          ) : step === 'forgot' ? (
            <CardContent className="px-6 pt-8 pb-8">
              <div className="mb-6 text-center">
                <CardTitle className="text-xl font-bold text-gray-900">Reset password</CardTitle>
                <CardDescription className="text-sm text-gray-400 mt-1">Use the code sent to your email to create a new password</CardDescription>
              </div>
              <ForgotPasswordForm
                onBackToLogin={() => {
                  dispatch(clearError());
                  setStep('auth');
                }}
              />
            </CardContent>
          ) : (
            <CardContent className="px-6 pt-8 pb-8">
              <div className="mb-6 text-center">
                <CardTitle className="text-xl font-bold text-gray-900">Verify your email</CardTitle>
                <CardDescription className="text-sm text-gray-400 mt-1">We've sent a 6-digit verification code to your inbox</CardDescription>
              </div>
              <OtpForm email={signupEmail} onVerifySuccess={onLoginSuccess} />
              <div className="mt-6 text-center">
                <button onClick={() => setStep('auth')} className="text-xs text-gray-400 hover:text-gray-600 underline">Back to Signup</button>
              </div>
            </CardContent>
          )}

          <CardFooter className="justify-center border-t border-gray-100 py-4">
            <p className="text-xs text-gray-400">Protected by enterprise-grade security &nbsp;�-&nbsp; <a href="#" className="text-blue-500 hover:text-blue-600">Privacy Policy</a></p>
          </CardFooter>
        </Card>

        <div className="text-center mt-5">
          <Badge variant="outline" className="text-xs text-gray-400 border-gray-200 font-normal">ACT v2.4.0</Badge>
        </div>
      </div>
    </div>
  );
}
