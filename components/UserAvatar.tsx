"use client";

import React, { useState, useEffect } from "react";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    src?: string | null;
    googleSrc?: string | null;
    name?: string | null;
    className?: string;
    iconClassName?: string;
    imgClassName?: string;
}

export function UserAvatar({
    src,
    googleSrc,
    name,
    className = "w-9 h-9",
    iconClassName = "w-4 h-4 text-primary dark:text-emerald-400",
    imgClassName = "w-full h-full object-cover"
}: UserAvatarProps) {
    const [imgFailed, setImgFailed] = useState(false);
    const [fallbackFailed, setFallbackFailed] = useState(false);

    // Primary image candidate (custom or primary avatar_url)
    const primarySrc = src || null;
    // Secondary fallback (e.g. googleSrc if primary is custom_avatar and fails)
    const secondarySrc = googleSrc && googleSrc !== primarySrc ? googleSrc : null;

    useEffect(() => {
        setImgFailed(false);
        setFallbackFailed(false);
    }, [src, googleSrc]);

    const activeSrc = !imgFailed ? primarySrc : (!fallbackFailed ? secondarySrc : null);

    if (activeSrc) {
        return (
            <div className={cn("relative rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 border border-gray-200/80 dark:border-zinc-700/80 shadow-2xs", className)}>
                <img
                    src={activeSrc}
                    alt={name || "User Avatar"}
                    className={cn("w-full h-full object-cover rounded-full", imgClassName)}
                    onError={() => {
                        if (!imgFailed) {
                            setImgFailed(true);
                        } else {
                            setFallbackFailed(true);
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div className={cn("rounded-full bg-gray-100 dark:bg-zinc-800 border border-gray-200/80 dark:border-zinc-700/80 shrink-0 flex items-center justify-center shadow-2xs", className)}>
            <UserIcon className={iconClassName} />
        </div>
    );
}

export default UserAvatar;
