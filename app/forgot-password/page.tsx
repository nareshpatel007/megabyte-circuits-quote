"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Loader2, AlertCircle, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";

function ForgotPasswordContent() {
    const router = useRouter();

    // Flow steps: "request" | "verify" | "reset" | "success"
    const [step, setStep] = useState<"request" | "verify" | "reset" | "success">("request");

    // Form states
    const [email, setEmail] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Timers & cooldowns
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Refs for 6-digit OTP inputs
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (step === "verify" && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step, countdown]);

    // Handle 1. Request OTP
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!email.trim()) {
            setErrorMessage("Please enter your registered email address.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await res.json();

            if (data.status || data.success) {
                setMaskedEmail(data.masked_email || email.trim());
                setSuccessMessage("Verification code sent to your email!");
                setStep("verify");
                setCountdown(60);
                setCanResend(false);
            } else {
                setErrorMessage(data.message || "Unable to send verification code. Please try again.");
            }
        } catch (err) {
            console.error("Forgot password error:", err);
            setErrorMessage("Network error. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle OTP Input Change (Auto-advance & paste support)
    const handleOtpChange = (index: number, value: string) => {
        // Handle Paste event of full 6 digit string
        if (value.length > 1) {
            const digits = value.replace(/\D/g, "").slice(0, 6).split("");
            const newOtp = [...otpDigits];
            digits.forEach((d, i) => {
                newOtp[i] = d;
            });
            setOtpDigits(newOtp);
            const focusIndex = Math.min(digits.length, 5);
            inputRefs.current[focusIndex]?.focus();
            return;
        }

        const digit = value.replace(/\D/g, "");
        const newOtp = [...otpDigits];
        newOtp[index] = digit;
        setOtpDigits(newOtp);

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Handle 2. Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        const otpCode = otpDigits.join("");
        if (otpCode.length !== 6) {
            setErrorMessage("Please enter the complete 6-digit verification code.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/verify-password-reset-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), otp: otpCode }),
            });

            const data = await res.json();

            if (data.status || data.success) {
                setResetToken(data.reset_token);
                setSuccessMessage("Code verified! Please set your new password.");
                setStep("reset");
            } else {
                setErrorMessage(data.message || "Invalid or expired verification code.");
            }
        } catch (err) {
            console.error("Verify OTP error:", err);
            setErrorMessage("An error occurred while verifying code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Resend OTP
    const handleResendOtp = async () => {
        if (!canResend || isResending) return;

        setErrorMessage("");
        setSuccessMessage("");
        setIsResending(true);

        try {
            const res = await fetch("/api/auth/resend-password-reset-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await res.json();

            if (data.status || data.success) {
                setSuccessMessage("A new verification code has been sent!");
                setOtpDigits(Array(6).fill(""));
                setCountdown(60);
                setCanResend(false);
                inputRefs.current[0]?.focus();
            } else {
                setErrorMessage(data.message || "Failed to resend verification code.");
            }
        } catch (err) {
            setErrorMessage("Network error while resending verification code.");
        } finally {
            setIsResending(false);
        }
    };

    // Password requirements check
    const hasMinLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber;

    // Handle 3. Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!newPassword) {
            setErrorMessage("Please enter a new password.");
            return;
        }

        if (!isPasswordValid) {
            setErrorMessage("Password does not meet the complexity requirements.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reset_token: resetToken,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            });

            const data = await res.json();

            if (data.status || data.success) {
                setSuccessMessage("Password updated successfully!");
                setStep("success");
            } else {
                setErrorMessage(data.message || "Failed to update password. Please try requesting a new OTP.");
            }
        } catch (err) {
            console.error("Reset password error:", err);
            setErrorMessage("An error occurred while updating password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white flex flex-col md:flex-row font-sans">
            {/* Left Column: PCB Image Banner (Hidden on mobile) */}
            <div className="hidden md:block md:w-[320px] lg:w-[360px] xl:w-[380px] h-[300px] md:h-screen md:sticky md:top-0 md:self-start relative overflow-hidden shrink-0 p-0 m-0 bg-emerald-950">
                <img
                    src="/images/login-wide-pcb.png"
                    alt="PCB Circuit Board"
                    className="w-full h-full object-cover object-center block"
                />
            </div>

            {/* Right Column: Form Container */}
            <div className="flex-1 min-h-screen flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-white">
                <div className="w-full max-w-[460px] space-y-6">

                    {/* Logo & Header */}
                    <div className="text-center sm:text-left space-y-3">
                        <Link href="/" className="inline-block">
                            <img
                                src="/images/logo.png"
                                alt="Megabyte Circuits"
                                className="h-10 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            />
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                            {step === "request" && "Forgot Password?"}
                            {step === "verify" && "Verify Your Email"}
                            {step === "reset" && "Set New Password"}
                            {step === "success" && "Password Updated"}
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500">
                            {step === "request" && "Enter your registered email address and we'll send you a verification code."}
                            {step === "verify" && `Enter the 6-digit verification code sent to your email.`}
                            {step === "reset" && "Please create a new password for your account."}
                            {step === "success" && "Your password has been reset successfully."}
                        </p>
                    </div>

                    {/* Masked Email Banner on Verify Step */}
                    {step === "verify" && maskedEmail && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
                            <span>Code sent to <strong className="font-semibold">{maskedEmail}</strong></span>
                            <button
                                type="button"
                                onClick={() => { setStep("request"); setErrorMessage(""); setSuccessMessage(""); }}
                                className="text-emerald-700 hover:text-emerald-900 underline text-xs font-semibold ml-2"
                            >
                                Change
                            </button>
                        </div>
                    )}

                    {/* Error & Success Messages */}
                    {errorMessage && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}
                    {successMessage && step !== "success" && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* STEP 1: REQUEST OTP FORM */}
                    {step === "request" && (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your.email@example.com"
                                    required
                                    className="w-full h-11 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl outline-none focus:border-primary transition-all placeholder:text-gray-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Send OTP"}
                            </button>

                            <div className="text-center pt-2">
                                <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-primary transition-colors">
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Back to Sign In</span>
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* STEP 2: VERIFY OTP FORM */}
                    {step === "verify" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2 text-center">6-Digit Verification Code</label>
                                <div className="flex items-center justify-between gap-2 sm:gap-3">
                                    {otpDigits.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={(el) => { inputRefs.current[idx] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                            className="w-11 h-12 text-center font-bold text-lg border border-gray-300 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Resend Countdown */}
                            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                                <span>
                                    {countdown > 0 ? (
                                        `Resend OTP in 00:${countdown.toString().padStart(2, "0")}`
                                    ) : (
                                        "Didn't receive the code?"
                                    )}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={!canResend || isResending}
                                    className={`font-semibold text-xs flex items-center gap-1 transition-colors ${canResend && !isResending ? "text-primary hover:underline cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
                                >
                                    {isResending ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-3 h-3" />
                                            <span>Resend OTP</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Verify OTP"}
                            </button>

                            <div className="text-center pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setStep("request"); setErrorMessage(""); setSuccessMessage(""); }}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-primary transition-colors cursor-pointer"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Back to Email Request</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STEP 3: RESET PASSWORD FORM */}
                    {step === "reset" && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full h-11 pl-3.5 pr-10 text-xs sm:text-sm border border-gray-300 rounded-xl outline-none focus:border-primary transition-all placeholder:text-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full h-11 pl-3.5 pr-10 text-xs sm:text-sm border border-gray-300 rounded-xl outline-none focus:border-primary transition-all placeholder:text-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Password Requirements List */}
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
                                <p className="font-semibold text-gray-700 mb-1">Password Requirements:</p>
                                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-600" : "text-gray-500"}`}>
                                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? "text-emerald-600" : "text-gray-300"}`} />
                                    <span>At least 8 characters long</span>
                                </div>
                                <div className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-600" : "text-gray-500"}`}>
                                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasUpper ? "text-emerald-600" : "text-gray-300"}`} />
                                    <span>Contains an uppercase letter</span>
                                </div>
                                <div className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-600" : "text-gray-500"}`}>
                                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasLower ? "text-emerald-600" : "text-gray-300"}`} />
                                    <span>Contains a lowercase letter</span>
                                </div>
                                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600" : "text-gray-500"}`}>
                                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumber ? "text-emerald-600" : "text-gray-300"}`} />
                                    <span>Contains a number</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !isPasswordValid || newPassword !== confirmPassword}
                                className="w-full py-3 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Update Password"}
                            </button>
                        </form>
                    )}

                    {/* STEP 4: SUCCESS CONFIRMATION */}
                    {step === "success" && (
                        <div className="text-center space-y-5 py-4">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">
                                Your password has been updated successfully. You can now sign in with your new credentials.
                            </p>
                            <Link
                                href="/login"
                                className="w-full py-3 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-md transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                            >
                                Back to Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <ForgotPasswordContent />
        </Suspense>
    );
}
