"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Loader2, AlertCircle, ArrowLeft, MailCheck } from "lucide-react";
import { setAuthSession, getAuthToken, getLogoutReason, clearLogoutReason } from "@/lib/auth";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect") || "/";
    const mainSiteUrl = (process.env.NEXT_PUBLIC_MAIN_URL || "https://megabytecircuit.com").replace(/\/$/, "");

    const [viewMode, setViewMode] = useState<"signin" | "signup">("signin");
    const [signupStep, setSignupStep] = useState<"form" | "otp">("form");
    const [accountType, setAccountType] = useState<"company" | "personal">("personal");

    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [country, setCountry] = useState("India");
    const [gstNumber, setGstNumber] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [agreeTerms, setAgreeTerms] = useState(true);

    // OTP State
    const [registrationToken, setRegistrationToken] = useState("");
    const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
    const [resendCooldown, setResendCooldown] = useState(60);
    const [isResending, setIsResending] = useState(false);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isSocialLoading, setIsSocialLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const clearFieldError = (fieldName: string) => {
        if (fieldErrors[fieldName]) {
            setFieldErrors((prev) => {
                const updated = { ...prev };
                delete updated[fieldName];
                return updated;
            });
        }
    };

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage("");
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    useEffect(() => {
        // 1. Check if logout reason stored (e.g. ACCOUNT_SUSPENDED)
        const logoutReason = getLogoutReason();
        if (logoutReason && logoutReason.message) {
            setErrorMessage(logoutReason.message);
            clearLogoutReason();
        } else {
            // Check if error in URL from OAuth redirect
            const urlError = searchParams.get("error");
            if (urlError) {
                setErrorMessage(decodeURIComponent(urlError));
            }
        }

        // 2. Skip login if user is already authenticated
        const token = getAuthToken() || (typeof window !== "undefined" ? localStorage.getItem("megabyte_user_token") : null);
        if (token) {
            router.push(redirectUrl);
        }
    }, [searchParams, router, redirectUrl]);

    // Resend Cooldown Countdown Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (signupStep === "otp" && resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [signupStep, resendCooldown]);

    // Auto Focus 1st OTP Input box when step changes to OTP
    useEffect(() => {
        if (signupStep === "otp") {
            setTimeout(() => {
                otpInputRefs.current[0]?.focus();
            }, 100);
        }
    }, [signupStep]);

    const maskEmail = (emailStr: string) => {
        if (!emailStr || !emailStr.includes("@")) return emailStr;
        const [user, domain] = emailStr.split("@");
        if (user.length <= 2) return `${user[0]}***@${domain}`;
        return `${user[0]}***${user[user.length - 1]}@${domain}`;
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        setFieldErrors({});

        if (viewMode === "signin") {
            const validation = signInSchema.safeParse({ usernameOrEmail, password });
            if (!validation.success) {
                const errors: Record<string, string> = {};
                validation.error.issues.forEach((issue) => {
                    const key = issue.path[0]?.toString();
                    if (key && !errors[key]) {
                        errors[key] = issue.message;
                    }
                });
                setFieldErrors(errors);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: usernameOrEmail, password }),
                });

                const data = await res.json();

                if (data.status || data.success) {
                    const token = data.data?.access_token || data.token || data.data?.token || data.api_key || "sess_token_" + Date.now();
                    const userObj = {
                        id: data.data?.user_id || data.user?.id || data.user_id,
                        name: data.data?.name || data.user?.name || usernameOrEmail.split("@")[0],
                        email: data.data?.email || data.user?.email || usernameOrEmail,
                    };

                    setAuthSession(token, userObj);
                    window.dispatchEvent(new Event("megabyte_auth_updated"));

                    setSuccessMessage("Signed in successfully!");
                    setTimeout(() => {
                        router.push(redirectUrl);
                    }, 700);
                } else {
                    setErrorMessage(data.message || "Invalid credentials. Please try again.");
                }
            } catch (err) {
                console.error("Auth error:", err);
                setErrorMessage("An error occurred. Please try again.");
            } finally {
                setIsLoading(false);
            }
        } else {
            // Sign Up Submission -> Triggers OTP Email Send
            const validation = signUpSchema.safeParse({
                username,
                email,
                password,
                accountType,
                country,
                gstNumber,
                agreeTerms,
            });
            if (!validation.success) {
                const errors: Record<string, string> = {};
                validation.error.issues.forEach((issue) => {
                    const key = issue.path[0]?.toString();
                    if (key && !errors[key]) {
                        errors[key] = issue.message;
                    }
                });
                setFieldErrors(errors);
                return;
            }

            setIsLoading(true);
            try {
                const payload = {
                    username: username,
                    name: username,
                    email: email,
                    password: password,
                    company_name: accountType === "company" ? username : "",
                    country: country,
                    gst_number: gstNumber
                };

                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await res.json();

                if (data.status || data.success) {
                    setRegistrationToken(data.registration_token);
                    setSignupStep("otp");
                    setResendCooldown(60);
                    setSuccessMessage(data.message || "Verification code sent to your email address.");
                } else {
                    setErrorMessage(data.message || "Registration failed. Please check your details.");
                }
            } catch (err) {
                console.error("Registration error:", err);
                setErrorMessage("An error occurred during registration. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    // OTP Input Change Handler
    const handleOtpChange = (index: number, value: string) => {
        const cleanValue = value.replace(/[^0-9]/g, "");
        if (!cleanValue && value !== "") return;

        const newDigits = [...otpDigits];
        newDigits[index] = cleanValue.slice(-1); // Take last digit
        setOtpDigits(newDigits);

        if (cleanValue && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    // OTP KeyDown Handler for Backspace
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    // OTP Paste Handler
    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
        if (!pastedData) return;

        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
            newDigits[i] = pastedData[i] || "";
        }
        setOtpDigits(newDigits);

        const nextFocusIndex = Math.min(pastedData.length, 5);
        otpInputRefs.current[nextFocusIndex]?.focus();
    };

    // Verify OTP & Complete Registration
    const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        const code = otpDigits.join("");
        if (code.length < 6) {
            setErrorMessage("Please enter all 6 digits of the verification code.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/register/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    registration_token: registrationToken,
                    otp: code,
                }),
            });

            const data = await res.json();

            if (data.status || data.success) {
                const token = data.data?.access_token || data.token || data.data?.token || "sess_token_" + Date.now();
                const userObj = {
                    id: data.data?.user_id || data.user?.id || data.user_id,
                    name: data.data?.name || data.user?.name || username,
                    email: data.data?.email || data.user?.email || email,
                };

                setAuthSession(token, userObj);
                window.dispatchEvent(new Event("megabyte_auth_updated"));

                setSuccessMessage("Account created successfully! Redirecting...");
                setTimeout(() => {
                    router.push(redirectUrl);
                }, 700);
            } else {
                setErrorMessage(data.message || "Invalid verification code. Please try again.");
            }
        } catch (err) {
            console.error("OTP verification error:", err);
            setErrorMessage("An error occurred during verification. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP Handler
    const handleResendOtp = async () => {
        if (resendCooldown > 0 || isResending) return;

        setErrorMessage("");
        setSuccessMessage("");
        setIsResending(true);

        try {
            const res = await fetch("/api/auth/register/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ registration_token: registrationToken }),
            });

            const data = await res.json();

            if (data.status || data.success) {
                setOtpDigits(["", "", "", "", "", ""]);
                setResendCooldown(60);
                setSuccessMessage(data.message || "A new verification code has been sent to your email.");
                setTimeout(() => {
                    otpInputRefs.current[0]?.focus();
                }, 100);
            } else {
                setErrorMessage(data.message || "Failed to resend code. Please try again.");
            }
        } catch (err) {
            console.error("Resend OTP error:", err);
            setErrorMessage("Failed to resend verification code. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    const handleGoogleAuth = () => {
        setErrorMessage("");
        setSuccessMessage("");
        setIsSocialLoading(true);

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        window.location.href = `${backendUrl}api/auth/google`;
    };

    return (
        <div className="min-h-screen w-full bg-white flex flex-col md:flex-row font-sans">
            {/* Left Column: Slimmer Full-Height PCB Image (Hidden on mobile) */}
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

                    {/* Logo & Title Header */}
                    <div className="text-center sm:text-left space-y-3">
                        <a href={process.env.NEXT_PUBLIC_MAIN_URL || "https://megabytecircuit.com"} className="inline-block">
                            <img
                                src="/images/logo.png"
                                alt="Megabyte Circuits"
                                className="h-10 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            />
                        </a>

                        {signupStep === "otp" && viewMode === "signup" ? (
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
                                    <MailCheck className="w-3.5 h-3.5" />
                                    <span>Verification Code Sent</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                    Verify Your Email
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    We&apos;ve sent a 6-digit verification code to{" "}
                                    <span className="font-semibold text-gray-800">{maskEmail(email)}</span>.
                                </p>
                            </div>
                        ) : (
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                {viewMode === "signin" ? "Sign in to Megabyte" : "Create Your Account"}
                            </h1>
                        )}
                    </div>

                    {/* Status Messages */}
                    {errorMessage && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* OTP VERIFICATION SCREEN */}
                    {signupStep === "otp" && viewMode === "signup" ? (
                        <form onSubmit={handleVerifyOtpSubmit} noValidate className="space-y-6">
                            {/* 6-Digit OTP Box Grid */}
                            <div className="flex items-center justify-between gap-2 sm:gap-3 my-4">
                                {otpDigits.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => {
                                            otpInputRefs.current[idx] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        onPaste={handleOtpPaste}
                                        className={`w-11 h-13 sm:w-13 sm:h-14 text-center text-lg sm:text-xl font-bold border rounded-xl outline-none transition-all shadow-2xs ${digit
                                            ? "border-emerald-600 bg-emerald-50/40 text-emerald-950"
                                            : "border-gray-300 bg-white text-gray-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Verify Button */}
                            <button
                                type="submit"
                                disabled={isLoading || otpDigits.join("").length < 6}
                                className="w-full py-3.5 rounded-xl bg-primary hover:bg-secondary disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                ) : (
                                    <span>Verify &amp; Create Account</span>
                                )}
                            </button>

                            {/* Resend OTP Row */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-600">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSignupStep("form");
                                        setErrorMessage("");
                                        setSuccessMessage("");
                                    }}
                                    className="flex items-center gap-1.5 font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Change Email / Back</span>
                                </button>

                                <div>
                                    {resendCooldown > 0 ? (
                                        <span className="text-gray-400 font-medium">
                                            Resend OTP in 00:{resendCooldown < 10 ? `0${resendCooldown}` : resendCooldown}
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={isResending}
                                            className="font-bold text-primary hover:underline transition-all cursor-pointer flex items-center gap-1"
                                        >
                                            {isResending && <Loader2 className="w-3 h-3 animate-spin" />}
                                            <span>Resend OTP</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    ) : (
                        /* INITIAL SIGNIN / SIGNUP FORM */
                        <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
                            {viewMode === "signup" && (
                                <>
                                    {/* Personal / Company Radios */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <label
                                            onClick={() => {
                                                setAccountType("personal");
                                                setGstNumber("");
                                                clearFieldError("accountType");
                                                clearFieldError("gstNumber");
                                            }}
                                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${accountType === "personal"
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="accountType"
                                                checked={accountType === "personal"}
                                                onChange={() => {
                                                    setAccountType("personal");
                                                    setGstNumber("");
                                                    clearFieldError("accountType");
                                                    clearFieldError("gstNumber");
                                                }}
                                                className="accent-primary"
                                            />
                                            <span>Personal</span>
                                        </label>

                                        <label
                                            onClick={() => {
                                                setAccountType("company");
                                                clearFieldError("accountType");
                                            }}
                                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${accountType === "company"
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="accountType"
                                                checked={accountType === "company"}
                                                onChange={() => {
                                                    setAccountType("company");
                                                    clearFieldError("accountType");
                                                }}
                                                className="accent-primary"
                                            />
                                            <span>Company</span>
                                        </label>
                                    </div>

                                    {/* Username */}
                                    <div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => {
                                                setUsername(e.target.value);
                                                clearFieldError("username");
                                            }}
                                            placeholder="Username"
                                            className={`w-full h-11 px-3.5 text-xs sm:text-sm border rounded-xl outline-none transition-all placeholder:text-gray-400 ${fieldErrors.username
                                                ? "border-red-500 focus:border-red-500"
                                                : "border-gray-300 focus:border-primary"
                                                }`}
                                        />
                                        {fieldErrors.username && (
                                            <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.username}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                clearFieldError("email");
                                            }}
                                            placeholder="Email"
                                            className={`w-full h-11 px-3.5 text-xs sm:text-sm border rounded-xl outline-none transition-all placeholder:text-gray-400 ${fieldErrors.email
                                                ? "border-red-500 focus:border-red-500"
                                                : "border-gray-300 focus:border-primary"
                                                }`}
                                        />
                                        {fieldErrors.email && (
                                            <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.email}</p>
                                        )}
                                    </div>
                                </>
                            )}

                            {viewMode === "signin" && (
                                <div>
                                    <input
                                        type="text"
                                        value={usernameOrEmail}
                                        onChange={(e) => {
                                            setUsernameOrEmail(e.target.value);
                                            clearFieldError("usernameOrEmail");
                                        }}
                                        placeholder="Username or Email"
                                        className={`w-full h-11 px-3.5 text-xs sm:text-sm border rounded-xl outline-none transition-all placeholder:text-gray-400 ${fieldErrors.usernameOrEmail
                                            ? "border-red-500 focus:border-red-500"
                                            : "border-gray-300 focus:border-primary"
                                            }`}
                                    />
                                    {fieldErrors.usernameOrEmail && (
                                        <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.usernameOrEmail}</p>
                                    )}
                                </div>
                            )}

                            {/* Password with Eye Toggle */}
                            <div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            clearFieldError("password");
                                        }}
                                        placeholder="Password"
                                        className={`w-full h-11 pl-3.5 pr-10 text-xs sm:text-sm border rounded-xl outline-none transition-all placeholder:text-gray-400 ${fieldErrors.password
                                            ? "border-red-500 focus:border-red-500"
                                            : "border-gray-300 focus:border-primary"
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {fieldErrors.password && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.password}</p>
                                )}
                            </div>

                            {/* Country Dropdown & GST Field for Register */}
                            {viewMode === "signup" && (
                                <div className="space-y-4">
                                    <div>
                                        <select
                                            value={country}
                                            onChange={(e) => {
                                                setCountry(e.target.value);
                                                clearFieldError("country");
                                            }}
                                            className={`w-full h-11 px-3.5 text-xs sm:text-sm border rounded-xl outline-none bg-white transition-all text-gray-700 ${fieldErrors.country
                                                ? "border-red-500 focus:border-red-500"
                                                : "border-gray-300 focus:border-primary"
                                                }`}
                                        >
                                            <option value="India">India</option>
                                            <option value="United States">United States</option>
                                            <option value="United Kingdom">United Kingdom</option>
                                            <option value="Germany">Germany</option>
                                            <option value="Canada">Canada</option>
                                            <option value="Australia">Australia</option>
                                            <option value="Japan">Japan</option>
                                        </select>
                                        {fieldErrors.country && (
                                            <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.country}</p>
                                        )}
                                    </div>
                                    {accountType === "company" && (
                                        <div>
                                            <input
                                                type="text"
                                                value={gstNumber}
                                                onChange={(e) => {
                                                    setGstNumber(e.target.value);
                                                    clearFieldError("gstNumber");
                                                }}
                                                placeholder="GST Number (Optional)"
                                                className={`w-full h-11 px-3.5 text-xs sm:text-sm border rounded-xl outline-none transition-all placeholder:text-gray-400 uppercase ${fieldErrors.gstNumber
                                                    ? "border-red-500 focus:border-red-500"
                                                    : "border-gray-300 focus:border-primary"
                                                    }`}
                                            />
                                            {fieldErrors.gstNumber && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.gstNumber}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Options Row for Signin */}
                            {viewMode === "signin" && (
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="rounded accent-primary"
                                        />
                                        <span>Remember me</span>
                                    </label>
                                    <Link href="/forgot-password" className="hover:text-primary transition-colors font-medium">
                                        Forgot password?
                                    </Link>
                                </div>
                            )}

                            {/* Checkboxes for Register */}
                            {viewMode === "signup" && (
                                <div className="space-y-1 text-xs text-gray-600">
                                    <label className="flex items-start gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={agreeTerms}
                                            onChange={(e) => {
                                                setAgreeTerms(e.target.checked);
                                                clearFieldError("agreeTerms");
                                            }}
                                            className="mt-0.5 rounded accent-primary shrink-0"
                                        />
                                        <span>
                                            I agree to Megabyte&apos;s <a href={`${mainSiteUrl}/terms-of-service`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Terms of Service</a> and <a href={`${mainSiteUrl}/privacy-policy`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Privacy Policy</a>.
                                        </span>
                                    </label>
                                    {fieldErrors.agreeTerms && (
                                        <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.agreeTerms}</p>
                                    )}
                                </div>
                            )}

                            {/* Primary Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                ) : (
                                    <span>{viewMode === "signin" ? "Sign In" : "Sign Up"}</span>
                                )}
                            </button>

                            {/* Secondary Switch Mode Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setViewMode(viewMode === "signin" ? "signup" : "signin");
                                    setSignupStep("form");
                                    setErrorMessage("");
                                    setSuccessMessage("");
                                    setFieldErrors({});
                                }}
                                className="w-full py-3 rounded-xl bg-gray-100/90 hover:bg-gray-200/80 text-gray-700 font-semibold text-xs sm:text-sm transition-all text-center cursor-pointer"
                            >
                                {viewMode === "signin"
                                    ? "Need new account? Sign up now"
                                    : "Already have an account? Sign In"}
                            </button>
                        </form>
                    )}

                    {/* Social Auth Divider (Shown when not in OTP step) */}
                    {signupStep !== "otp" && (
                        <>
                            <div className="relative flex items-center justify-center my-6">
                                <div className="border-t border-gray-200 w-full" />
                                <span className="bg-white px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider absolute">
                                    {viewMode === "signin" ? "OR" : "or continue with"}
                                </span>
                            </div>

                            {/* Google Button */}
                            <div>
                                <button
                                    type="button"
                                    onClick={handleGoogleAuth}
                                    disabled={isSocialLoading}
                                    className="w-full py-2.5 px-4 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-2xs active:scale-98"
                                >
                                    {isSocialLoading ? (
                                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                            />
                                        </svg>
                                    )}
                                    <span>{viewMode === "signin" ? "Sign in with Google" : "Register via Google"}</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
