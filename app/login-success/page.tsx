"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { setAuthSession } from "@/lib/auth";

function LoginSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Processing Google authentication...");

    useEffect(() => {
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (error) {
            setStatus("error");
            setMessage(decodeURIComponent(error));
            return;
        }

        if (token) {
            try {
                // Decode token payload if JWT to extract basic user details
                let userObj: { id?: string | number; name?: string; email?: string; avatar?: string } = {};

                const parts = token.split(".");
                if (parts.length === 3) {
                    try {
                        const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
                        const decodedStr = atob(payloadBase64);
                        const decoded = JSON.parse(decodedStr);

                        userObj = {
                            id: decoded.user_id || decoded.sub || "usr_" + Date.now(),
                            name: decoded.name || searchParams.get("name") || decoded.email?.split("@")[0] || "User",
                            email: decoded.email || searchParams.get("email") || "",
                            avatar: decoded.avatar || searchParams.get("avatar") || "",
                        };
                    } catch (e) {
                        console.error("JWT payload decode warning:", e);
                    }
                }

                if (!userObj.email) {
                    const paramEmail = searchParams.get("email");
                    const paramName = searchParams.get("name");
                    userObj = {
                        id: "usr_" + Date.now(),
                        name: paramName || (paramEmail ? paramEmail.split("@")[0] : "Google User"),
                        email: paramEmail || "",
                        avatar: searchParams.get("avatar") || "",
                    };
                }

                // Store in auth state & localStorage
                setAuthSession(token, userObj);
                localStorage.setItem("megabyte_user_token", token);
                localStorage.setItem("megabyte_user", JSON.stringify(userObj));
                
                // Dispatch event for header & app state update
                window.dispatchEvent(new Event("megabyte_auth_updated"));

                setStatus("success");
                setMessage("Successfully signed in with Google!");

                // Redirect after brief delay for smooth UX
                const timer = setTimeout(() => {
                    router.push("/dashboard");
                }, 1000);

                return () => clearTimeout(timer);
            } catch (err) {
                console.error("Auth token processing error:", err);
                setStatus("error");
                setMessage("Failed to process session token. Please try signing in again.");
            }
        } else {
            setStatus("error");
            setMessage("No authentication token received from Google callback.");
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <Link href="/">
                        <img
                            src="/images/logo.png"
                            alt="Megabyte Circuits"
                            className="h-10 w-auto object-contain hover:opacity-90 transition-opacity"
                        />
                    </Link>
                </div>

                {status === "loading" && (
                    <div className="py-8 space-y-4">
                        <div className="relative flex justify-center">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">{message}</h2>
                        <p className="text-xs text-gray-500">Please wait while we finalize your account access.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="py-8 space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{message}</h2>
                        <p className="text-xs text-gray-500">Redirecting to your dashboard...</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="py-6 space-y-5">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold text-gray-900">Authentication Failed</h2>
                            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                                {message}
                            </p>
                        </div>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                        >
                            <span>Return to Login</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LoginSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <LoginSuccessContent />
        </Suspense>
    );
}
