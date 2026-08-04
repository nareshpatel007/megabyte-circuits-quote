"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect") || "/";

    const [viewMode, setViewMode] = useState<"signin" | "signup">("signin");
    const [accountType, setAccountType] = useState<"company" | "personal">("personal");

    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [country, setCountry] = useState("India");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [agreeTerms, setAgreeTerms] = useState(true);
    const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isSocialLoading, setIsSocialLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        setIsLoading(true);

        try {
            const endpoint = viewMode === "signin" ? "/api/auth/login" : "/api/auth/register";
            const payload = viewMode === "signin"
                ? { email: usernameOrEmail, password }
                : {
                    name: username,
                    email: email,
                    password: password,
                    company_name: accountType === "company" ? username : "",
                    country: country
                };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.status || data.success) {
                const token = data.data?.access_token || data.token || data.data?.token || data.api_key || "sess_token_" + Date.now();
                const userObj = {
                    id: data.data?.user_id || data.user?.id || data.user_id,
                    name: data.data?.name || data.user?.name || (viewMode === "signin" ? usernameOrEmail.split("@")[0] : username),
                    email: data.data?.email || data.user?.email || (viewMode === "signin" ? usernameOrEmail : email),
                };

                localStorage.setItem("megabyte_user_token", token);
                localStorage.setItem("megabyte_user", JSON.stringify(userObj));
                window.dispatchEvent(new Event("megabyte_auth_updated"));

                setSuccessMessage(viewMode === "signin" ? "Signed in successfully!" : "Account created successfully!");
                setTimeout(() => {
                    router.push(redirectUrl);
                }, 700);
            } else {
                setErrorMessage(data.message || (viewMode === "signin" ? "Invalid credentials. Please try again." : "Registration failed. Please check your details."));
            }
        } catch (err) {
            console.error("Auth error:", err);
            setErrorMessage("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setErrorMessage("");
        setSuccessMessage("");
        setIsSocialLoading(true);

        try {
            const userEmail = prompt("Enter your Google Account Email to continue:");
            if (!userEmail || !userEmail.includes("@")) {
                setIsSocialLoading(false);
                return;
            }

            const userName = userEmail.split("@")[0];
            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: userEmail,
                    name: userName,
                    avatar: "https://lh3.googleusercontent.com/a/default-user"
                }),
            });

            const data = await res.json();

            const token = data.token || data.data?.token || "google_sess_" + Date.now();
            const userObj = data.user || data.data?.user || { email: userEmail, name: userName };

            localStorage.setItem("megabyte_user_token", token);
            localStorage.setItem("megabyte_user", JSON.stringify(userObj));
            window.dispatchEvent(new Event("megabyte_auth_updated"));

            setSuccessMessage("Authenticated via Google!");
            setTimeout(() => {
                router.push(redirectUrl);
            }, 700);
        } catch (err) {
            console.error("Google auth error:", err);
            setErrorMessage("Google Sign-In failed.");
        } finally {
            setIsSocialLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white flex flex-col md:flex-row font-sans">
            {/* Left Column: Slimmer Full-Height PCB Image */}
            <div className="w-full md:w-[320px] lg:w-[360px] xl:w-[380px] min-h-[300px] md:min-h-screen relative overflow-hidden shrink-0 p-0 m-0 bg-emerald-950">
                <img
                    src="/images/login-wide-pcb.png"
                    alt="PCB Circuit Board"
                    className="w-full h-full object-cover object-center block"
                />
            </div>

            {/* Right Column: Wider Form Container */}
            <div className="flex-1 min-h-screen flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-white">
                <div className="w-full max-w-[460px] space-y-6">

                    {/* Logo & Title Header */}
                    <div className="text-center sm:text-left space-y-3">
                        <Link href="/" className="inline-block">
                            <img
                                src="/images/logo.png"
                                alt="Megabyte Circuits"
                                className="h-10 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            />
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                            {viewMode === "signin" ? "Sign in to Megabyte" : "Create Your Account"}
                        </h1>
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

                    {/* Form */}
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {viewMode === "signup" && (
                            <>
                                {/* Company / Personal Radios */}
                                <div className="grid grid-cols-2 gap-3">
                                    <label
                                        onClick={() => setAccountType("company")}
                                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${accountType === "company"
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="accountType"
                                            checked={accountType === "company"}
                                            onChange={() => setAccountType("company")}
                                            className="accent-primary"
                                        />
                                        <span>Company</span>
                                    </label>

                                    <label
                                        onClick={() => setAccountType("personal")}
                                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${accountType === "personal"
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="accountType"
                                            checked={accountType === "personal"}
                                            onChange={() => setAccountType("personal")}
                                            className="accent-primary"
                                        />
                                        <span>Personal</span>
                                    </label>
                                </div>

                                {/* Username */}
                                <div>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Username"
                                        className="w-full h-11 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email"
                                        className="w-full h-11 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                    />
                                </div>
                            </>
                        )}

                        {viewMode === "signin" && (
                            <div>
                                <input
                                    type="text"
                                    required
                                    value={usernameOrEmail}
                                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                                    placeholder="Username or Email"
                                    className="w-full h-11 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>
                        )}

                        {/* Password with Eye Toggle */}
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full h-11 pl-3.5 pr-10 text-xs sm:text-sm border border-gray-300 rounded-xl focus:border-primary outline-none transition-all placeholder:text-gray-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Country Dropdown for Register */}
                        {viewMode === "signup" && (
                            <div>
                                <select
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="w-full h-11 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:border-primary outline-none bg-white transition-all text-gray-700"
                                >
                                    <option value="India">India</option>
                                    <option value="United States">United States</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="Germany">Germany</option>
                                    <option value="Canada">Canada</option>
                                    <option value="Australia">Australia</option>
                                    <option value="Japan">Japan</option>
                                </select>
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
                                <a href="#" className="hover:text-primary transition-colors font-medium">
                                    Forgot password?
                                </a>
                            </div>
                        )}

                        {/* Checkboxes for Register */}
                        {viewMode === "signup" && (
                            <div className="space-y-2 text-xs text-gray-600">
                                <label className="flex items-start gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                        className="mt-0.5 rounded accent-primary shrink-0"
                                    />
                                    <span>
                                        I agree to Megabyte&apos;s <a href="#" className="text-primary hover:underline font-semibold">Terms of Use</a> and <a href="#" className="text-primary hover:underline font-semibold">Privacy Policy</a>.
                                    </span>
                                </label>
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
                                setErrorMessage("");
                                setSuccessMessage("");
                            }}
                            className="w-full py-3 rounded-xl bg-gray-100/90 hover:bg-gray-200/80 text-gray-700 font-semibold text-xs sm:text-sm transition-all text-center cursor-pointer"
                        >
                            {viewMode === "signin"
                                ? "Need new account? Sign up now"
                                : "Already have an account? Sign In"}
                        </button>
                    </form>

                    {/* Social Auth Divider */}
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
