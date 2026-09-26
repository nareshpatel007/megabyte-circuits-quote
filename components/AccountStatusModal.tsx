"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, Lock, AlertCircle, HelpCircle, LogOut } from "lucide-react";

export default function AccountStatusModal() {
    const { isStatusModalOpen, accountStatus, statusMessage, logoutAndRedirect } = useAuth();

    if (!isStatusModalOpen || !accountStatus) return null;

    const isSuspended = accountStatus === "ACCOUNT_SUSPENDED" || accountStatus === "suspended";
    const isBlocked = accountStatus === "ACCOUNT_BLOCKED" || accountStatus === "blocked";
    const isInactive = accountStatus === "ACCOUNT_INACTIVE" || accountStatus === "inactive";
    const isPending = accountStatus === "ACCOUNT_PENDING" || accountStatus === "pending";

    const title = isSuspended
        ? "Account Suspended"
        : isBlocked
        ? "Account Blocked"
        : isPending
        ? "Account Pending Approval"
        : isInactive
        ? "Account Inactive"
        : "Account Access Restricted";

    const defaultMsg = isSuspended
        ? "Your account access has been suspended by the administrator. You cannot access protected areas of the application while your account is suspended. If you believe this is an error, please contact support."
        : isBlocked
        ? "Your account has been blocked by the administrator. Please contact customer support for further assistance."
        : isPending
        ? "Your account is currently awaiting approval from an administrator."
        : "Your account is inactive. Please contact support to reactivate your access.";

    const displayMessage = statusMessage || defaultMsg;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 shadow-2xl space-y-6 focus:outline-none">
                {/* Header Icon */}
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        isSuspended || isBlocked 
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" 
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}>
                        {isSuspended ? (
                            <ShieldAlert className="w-8 h-8" />
                        ) : isBlocked ? (
                            <Lock className="w-8 h-8" />
                        ) : (
                            <AlertCircle className="w-8 h-8" />
                        )}
                    </div>
                    <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-500 dark:text-rose-400">
                            Security Notification
                        </span>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {title}
                        </h2>
                    </div>
                </div>

                {/* Body Content */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4.5 space-y-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                        {displayMessage}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
                        For security reasons, your current session has been invalidated and protected actions are blocked.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                    <a
                        href="mailto:quote@megabytecircuit.com?subject=Account%20Access%20Inquiry"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                        <HelpCircle className="w-4 h-4 text-emerald-500" />
                        Contact Support
                    </a>
                    <button
                        onClick={() => logoutAndRedirect()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md hover:shadow-lg"
                    >
                        <LogOut className="w-4 h-4" />
                        Acknowledge & Return to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
