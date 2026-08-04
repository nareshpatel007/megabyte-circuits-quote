"use client";

import React, { useState, useRef } from "react";
import { Upload, X, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { UploadResponse } from "../../lib/gerber/types";

interface GerberUploaderProps {
    onUploadSuccess: (res: UploadResponse, file: File) => void;
    onReset: () => void;
    extraActions?: React.ReactNode;
}

export default function GerberUploader({ onUploadSuccess, onReset, extraActions }: GerberUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [loadingState, setLoadingState] = useState<"idle" | "uploading" | "extracting" | "parsing" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateAndProcessFile = async (selectedFile: File) => {
        setErrorMessage(null);

        // Size validation: 100 MB
        const maxSize = 100 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
            setErrorMessage("File exceeds 100 MB limit.");
            setLoadingState("error");
            return;
        }

        // Extension validation
        const ext = selectedFile.name.split(".").pop()?.toLowerCase();
        if (ext !== "zip") {
            setErrorMessage("Only .zip Gerber archives are supported.");
            setLoadingState("error");
            return;
        }

        setFile(selectedFile);
        uploadFile(selectedFile);
    };

    const uploadFile = (file: File) => {
        setLoadingState("uploading");
        setProgress(0);

        // Simulate progress bar before POSTing to Next API
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 15;
            });
        }, 150);

        const formData = new FormData();
        formData.append("file", file);

        fetch("/api/upload", {
            method: "POST",
            body: formData,
        })
            .then(res => res.json())
            .then((data: UploadResponse) => {
                clearInterval(interval);
                setProgress(100);

                if (data.success) {
                    setLoadingState("success");
                    setTimeout(() => {
                        onUploadSuccess(data, file);
                    }, 800);
                } else {
                    setErrorMessage(data.error || "Gerber parsing failed.");
                    setLoadingState("error");
                }
            })
            .catch(() => {
                clearInterval(interval);
                setErrorMessage("Network or server connection failed.");
                setLoadingState("error");
            });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndProcessFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndProcessFile(e.target.files[0]);
        }
    };

    const resetUploader = () => {
        setFile(null);
        setProgress(0);
        setLoadingState("idle");
        setErrorMessage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onReset();
    };

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
            />

            {loadingState === "success" ? null : (
                <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`relative rounded-xl text-center transition-all duration-300 ${loadingState === "uploading"
                            ? "bg-primary/5"
                            : dragActive
                                ? "border border-dashed border-primary bg-primary/10 scale-[1.005] py-14 px-6"
                                : loadingState === "error"
                                    ? "border border-dashed border-red-300 bg-red-50/10 py-12 px-6"
                                    : "border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 py-14 px-6"
                        }`}
                >
                    {loadingState === "idle" && (
                        <div className="flex flex-col items-center justify-center">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-primary hover:opacity-90 text-white font-bold text-base px-8 py-3 rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                                <Upload className="w-5 h-5" /> Add gerber file
                            </button>
                            <p className="mt-4 text-xs sm:text-sm text-gray-400 font-medium">
                                Only accept zip or rar, Max 100 MB
                            </p>
                            <p className="mt-2 text-xs sm:text-sm text-gray-400 font-medium flex items-center justify-center gap-1.5">
                                <span className="text-sm">🔒</span> All uploads are secure and confidential.
                            </p>
                        </div>
                    )}

                    {loadingState === "uploading" && (
                        <div className="bg-primary/5 rounded-xl p-10 sm:p-14 flex flex-col items-center justify-center space-y-6">
                            <p className="text-gray-700 font-medium text-sm sm:text-base tracking-wide">
                                Uploading your files....
                            </p>
                            <div className="w-full max-w-xl flex items-center gap-4">
                                <div className="flex-1 bg-gray-200/70 h-4 sm:h-5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-primary h-full rounded-full transition-all duration-300 shadow-sm"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-primary font-bold text-lg sm:text-2xl shrink-0 min-w-[55px] text-right">
                                    {progress}%
                                </span>
                            </div>
                        </div>
                    )}

                    {loadingState === "error" && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-2">
                            <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500">
                                <AlertCircle className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-base font-bold text-red-600">Verification Failed</p>
                                <p className="text-sm text-gray-600 mt-1.5 px-6 py-2 bg-red-50 rounded-lg inline-block border border-red-100">
                                    {errorMessage}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={resetUploader}
                                className="text-xs font-semibold text-primary hover:underline mt-2 cursor-pointer"
                            >
                                Try uploading another file
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
