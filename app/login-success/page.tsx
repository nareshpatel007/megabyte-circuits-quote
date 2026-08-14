"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { setAuthSession } from "@/lib/auth";

function LoginSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [status, setStatus] = useState<"loading" | "success" | "gst_prompt" | "error">("loading");
    const [message, setMessage] = useState("Processing Google authentication...");
    const [gstNumber, setGstNumber] = useState("");
    const [isSavingGst, setIsSavingGst] = useState(false);
    const [userId, setUserId] = useState<string | number | null>(null);

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

                setAuthSession(token, userObj);
                localStorage.setItem("megabyte_user_token", token);
                localStorage.setItem("megabyte_user", JSON.stringify(userObj));
                window.dispatchEvent(new Event("megabyte_auth_updated"));

                if (userObj.id) {
                    setUserId(userObj.id);
                }

                // Show GST prompt modal
                setStatus("gst_prompt");
                setMessage("Successfully signed in with Google!");
            } catch (err) {
                console.error("Auth token processing error:", err);
                setStatus("error");
                setMessage("Failed to process session token. Please try signing in again.");
            }
        } else {
            setStatus("error");
            setMessage("No authentication token received from Google callback.");
        }
    }, [searchParams]);

    const handleSaveGst = async (skip: boolean = false) => {
        setIsSavingGst(true);
        try {
            if (!skip && gstNumber.trim() && userId) {
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                await fetch(`${backendUrl}/api/dashboard/update-gst`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: userId, gst_number: gstNumber.trim() }),
                });
            }
        } catch (e) {
            console.error("Failed to save GST number:", e);
        } finally {
            setIsSavingGst(false);
            setStatus("success");
            setTimeout(() => {
                router.push("/dashboard");
            }, 600);
        }
    };

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

                {status === "gst_prompt" && (
                    <div className="py-4 space-y-4 text-left">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div className="text-center space-y-1">
                            <h2 className="text-xl font-bold text-gray-900">Welcome! Google Login Successful</h2>
                            <p className="text-xs text-gray-500">Please provide your GST number to complete your business profile.</p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">GST Number</label>
                                <input
                                    type="text"
                                    value={gstNumber}
                                    onChange={(e) => setGstNumber(e.target.value)}
                                    placeholder="e.g. 24AAAAA0000A1Z5"
                                    className="w-full h-11 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:border-primary outline-none uppercase transition-all"
                                />
                            </div>

                            <button
                                type="button"
                                disabled={isSavingGst}
                                onClick={() => handleSaveGst(false)}
                                className="w-full py-3 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                            >
                                {isSavingGst ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>Save & Continue</span>}
                            </button>

                            <button
                                type="button"
                                disabled={isSavingGst}
                                onClick={() => handleSaveGst(true)}
                                className="w-full py-2.5 text-center text-xs text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
                            >
                                Skip for now
                            </button>
                        </div>
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
