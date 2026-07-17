"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose?: () => void;
}

export default function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
        info: <AlertCircle className="h-5 w-5 text-blue-500" />,
    };

    const bgColors = {
        success: "bg-green-50 border-green-200",
        error: "bg-red-50 border-red-200",
        warning: "bg-amber-50 border-amber-200",
        info: "bg-blue-50 border-blue-200",
    };

    const textColors = {
        success: "text-green-800",
        error: "text-red-800",
        warning: "text-amber-800",
        info: "text-blue-800",
    };

    return (
        <div
            className={`fixed top-4 right-4 z-[99999] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ${
                bgColors[type]
            } ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}`}
        >
            {icons[type]}
            <p className={`text-sm font-medium ${textColors[type]}`}>{message}</p>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => onClose?.(), 300);
                }}
                className="ml-2 hover:opacity-70 transition-opacity"
            >
                <X className="h-4 w-4 text-gray-500" />
            </button>
        </div>
    );
}
