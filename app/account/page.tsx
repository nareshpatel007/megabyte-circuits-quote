"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Camera, Trash2, X, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";
import UserAvatar from "@/components/UserAvatar";
import { toast } from "@/hooks/use-toast";
import { getAuthUser, setAuthSession } from "@/lib/auth";

interface UserProfile {
    id?: number | string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    company_name?: string;
    gst_number?: string;
    country?: string;
    created_at?: string;
    avatar_url?: string | null;
    avatar?: string | null;
    custom_avatar_url?: string | null;
    custom_avatar?: string | null;
    google_avatar_url?: string | null;
    google_avatar?: string | null;
    avatar_source?: "custom" | "google" | "default" | string;
    is_google_user?: boolean;
}

function AccountSkeleton() {
    return (
        <div className="space-y-6 animate-pulse max-w-2xl">
            <div className="flex items-center gap-6 p-6 rounded-2xl bg-gray-100 dark:bg-zinc-800/40 border border-gray-200/80 dark:border-zinc-800">
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-zinc-700 shrink-0"></div>
                <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded w-28 mt-2"></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-16 bg-gray-100 dark:bg-zinc-800/40 rounded-xl w-full"></div>
                <div className="h-16 bg-gray-100 dark:bg-zinc-800/40 rounded-xl w-full"></div>
                <div className="h-16 bg-gray-100 dark:bg-zinc-800/40 rounded-xl w-full"></div>
                <div className="h-16 bg-gray-100 dark:bg-zinc-800/40 rounded-xl w-full"></div>
            </div>
        </div>
    );
}

function AccountContent() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);

    // Form fields state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
        company_name: "",
        gst_number: "",
        country: "",
    });
    const [isSaving, setIsSaving] = useState(false);

    const fetchAccountData = async () => {
        try {
            const currentUser = getAuthUser();
            const token = localStorage.getItem("megabyte_user_token");

            if (!token || !currentUser) {
                router.push("/login?redirect=/account");
                return;
            }

            if (currentUser?.id) {
                const res = await fetch(`/api/dashboard/account?user_id=${currentUser.id}`);
                const data = await res.json();
                if (data.status && data.user) {
                    setUser(data.user);
                    setFormData({
                        name: data.user.name || "",
                        email: data.user.email || "",
                        phone_number: data.user.phone_number || "",
                        company_name: data.user.company_name || "",
                        gst_number: data.user.gst_number || "",
                        country: data.user.country || "",
                    });
                    // Sync storage
                    setAuthSession(data.user, token);
                } else {
                    setUser(currentUser);
                    setFormData({
                        name: currentUser.name || "",
                        email: currentUser.email || "",
                        phone_number: (currentUser as any).phone_number || "",
                        company_name: (currentUser as any).company_name || "",
                        gst_number: (currentUser as any).gst_number || "",
                        country: (currentUser as any).country || "",
                    });
                }
            }
        } catch (e) {
            console.error("Account page fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccountData();
    }, [router]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentUser = getAuthUser();
        if (!currentUser?.id) return;

        setIsSaving(true);
        try {
            const res = await fetch("/api/dashboard/account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    ...formData,
                }),
            });
            const data = await res.json();

            if (res.ok && data.status && data.user) {
                const token = localStorage.getItem("megabyte_user_token") || "";
                setUser(data.user);
                setAuthSession(data.user, token);
                window.dispatchEvent(new Event("megabyte_auth_updated"));

                toast({
                    title: "Profile Updated",
                    description: data.message || "Account profile updated successfully.",
                });
            } else {
                toast({
                    title: "Update Failed",
                    description: data.message || "Failed to update account details.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while updating profile details.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input value so re-selecting same file works
        e.target.value = "";

        // Client validation
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type.toLowerCase())) {
            toast({
                title: "Invalid File Format",
                description: "Please select a JPG, JPEG, PNG, or WEBP image file.",
                variant: "destructive",
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: "Profile picture must be less than 5MB.",
                variant: "destructive",
            });
            return;
        }

        const currentUser = getAuthUser();
        if (!currentUser?.id) return;

        const formData = new FormData();
        formData.append("user_id", String(currentUser.id));
        formData.append("avatar", file);

        setIsUploading(true);
        try {
            const res = await fetch("/api/dashboard/profile-picture", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (res.ok && data.status && data.user) {
                const token = localStorage.getItem("megabyte_user_token") || "";
                setUser(data.user);
                setAuthSession(data.user, token);
                window.dispatchEvent(new Event("megabyte_auth_updated"));

                toast({
                    title: "Success",
                    description: data.message || "Profile picture updated successfully.",
                });
            } else {
                toast({
                    title: "Upload Failed",
                    description: data.message || "Unable to upload profile picture.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while uploading profile picture.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePhoto = async () => {
        const currentUser = getAuthUser();
        if (!currentUser?.id) return;

        setIsRemoving(true);
        try {
            const res = await fetch(`/api/dashboard/profile-picture?user_id=${currentUser.id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (res.ok && data.status && data.user) {
                const token = localStorage.getItem("megabyte_user_token") || "";
                setUser(data.user);
                setAuthSession(data.user, token);
                window.dispatchEvent(new Event("megabyte_auth_updated"));

                toast({
                    title: "Success",
                    description: data.message || "Profile picture removed successfully.",
                });
            } else {
                toast({
                    title: "Removal Failed",
                    description: data.message || "Unable to remove profile picture.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while removing profile picture.",
                variant: "destructive",
            });
        } finally {
            setIsRemoving(false);
            setShowRemoveModal(false);
        }
    };

    // Determine avatar source label
    const getAvatarSourceLabel = () => {
        if (!user) return "";
        const source = user.avatar_source;
        if (source === "custom" || user.custom_avatar_url || user.custom_avatar) {
            return "Custom profile picture";
        }
        if (source === "google" || user.google_avatar_url || user.google_avatar || user.is_google_user) {
            return "Using your Google profile picture";
        }
        return "Default user icon";
    };

    const hasCustomAvatar = Boolean(user?.custom_avatar_url || user?.custom_avatar || user?.avatar_source === "custom");

    return (
        <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#030712] text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row font-sans transition-colors">
            <DashboardSidebar />

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <Header />

                <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                    {/* Header Banner */}
                    <div className="bg-white dark:bg-[#0b0f19] p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                            Account Profile
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
                            Inspect and manage your profile credentials.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#0b0f19] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 shadow-2xs space-y-6">
                        {loading ? (
                            <AccountSkeleton />
                        ) : (
                            <>
                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/jpeg,image/png,image/webp,image/jpg"
                                    className="hidden"
                                />

                                {/* Profile Picture Section */}
                                <div className="border-b border-gray-100 dark:border-zinc-800/80 pb-6">
                                    <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">
                                        Profile Picture
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-4">
                                        Upload a personal photo or use your account avatar.
                                    </p>

                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 rounded-2xl bg-gray-50/70 dark:bg-zinc-800/30 border border-gray-200/80 dark:border-zinc-800">
                                        <div className="relative group shrink-0">
                                            <UserAvatar
                                                src={user?.avatar_url || user?.avatar || user?.custom_avatar_url}
                                                googleSrc={user?.google_avatar_url || user?.google_avatar}
                                                name={user?.name || user?.email}
                                                className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-white dark:ring-zinc-900 shadow-md"
                                                iconClassName="w-12 h-12 text-primary dark:text-emerald-400"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading || isRemoving}
                                                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary hover:bg-primary/90 text-white shadow-md transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
                                                title="Change Photo"
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Camera className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>

                                        <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
                                            <div>
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-200/70 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                                                    {getAvatarSourceLabel()}
                                                </span>
                                                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1.5 font-medium">
                                                    Supported Formats: JPG, JPEG, PNG, WEBP (Max 5MB)
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading || isRemoving}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                                >
                                                    {isUploading ? (
                                                        <>
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            <span>Uploading...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Camera className="w-3.5 h-3.5" />
                                                            <span>Change Photo</span>
                                                        </>
                                                    )}
                                                </button>

                                                {hasCustomAvatar && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowRemoveModal(true)}
                                                        disabled={isUploading || isRemoving}
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/70 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                                    >
                                                        {isRemoving ? (
                                                            <>
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                <span>Removing...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                <span>Remove Photo</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Details Form Section */}
                                <form onSubmit={handleSaveChanges} className="space-y-6">
                                    <div className="border-b border-gray-100 dark:border-zinc-800/80 pb-3 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Account & Business Details</h2>
                                            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Update your profile, contact details, and company information.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
                                        {/* Full Name */}
                                        <div className="space-y-1.5">
                                            <label className="text-gray-600 dark:text-zinc-400 font-bold block text-xs">
                                                Full Name / Contact Name <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleFormChange}
                                                required
                                                placeholder="e.g. John Doe"
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs transition-all"
                                            />
                                        </div>

                                        {/* Email Address */}
                                        <div className="space-y-1.5">
                                            <label className="text-gray-600 dark:text-zinc-400 font-bold block text-xs">
                                                Email Address <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleFormChange}
                                                required
                                                placeholder="e.g. john@example.com"
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs transition-all"
                                            />
                                        </div>

                                        {/* Phone Number */}
                                        <div className="space-y-1.5">
                                            <label className="text-gray-600 dark:text-zinc-400 font-bold block text-xs">
                                                Phone Number
                                            </label>
                                            <input
                                                type="text"
                                                name="phone_number"
                                                value={formData.phone_number}
                                                onChange={handleFormChange}
                                                placeholder="e.g. +91 98765 43210"
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs transition-all"
                                            />
                                        </div>

                                        {/* Company Name */}
                                        <div className="space-y-1.5">
                                            <label className="text-gray-600 dark:text-zinc-400 font-bold block text-xs">
                                                Company / Business Name
                                            </label>
                                            <input
                                                type="text"
                                                name="company_name"
                                                value={formData.company_name}
                                                onChange={handleFormChange}
                                                placeholder="e.g. Megabyte Circuits Pvt Ltd"
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs transition-all"
                                            />
                                        </div>

                                        {/* GST Number */}
                                        <div className="space-y-1.5">
                                            <label className="text-gray-600 dark:text-zinc-400 font-bold block text-xs">
                                                GST Number
                                            </label>
                                            <input
                                                type="text"
                                                name="gst_number"
                                                value={formData.gst_number}
                                                onChange={handleFormChange}
                                                placeholder="e.g. 24AAAAA0000A1Z5"
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs transition-all uppercase"
                                            />
                                        </div>

                                        {/* Country */}
                                        <div className="space-y-1.5">
                                            <label className="text-gray-600 dark:text-zinc-400 font-bold block text-xs">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleFormChange}
                                                placeholder="e.g. India"
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Additional info badge */}
                                    {user?.created_at && (
                                        <div className="pt-1 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                                            <span>Member since: <strong className="text-gray-800 dark:text-zinc-200">{new Date(user.created_at).toLocaleDateString()}</strong></span>
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-end gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Saving Changes...</span>
                                                </>
                                            ) : (
                                                <span>Save Profile Changes</span>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </main>

                <Footer />
            </div>

            {/* Remove Profile Picture Confirmation Modal */}
            {showRemoveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-zinc-800 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                <AlertCircle className="w-5 h-5" />
                                <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                                    Remove Profile Picture?
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowRemoveModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-zinc-300">
                            {user?.google_avatar_url || user?.google_avatar || user?.is_google_user
                                ? "Your custom picture will be removed and your Google profile picture will be restored."
                                : "Are you sure you want to remove your custom profile picture? Your account will revert to the default avatar icon."}
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowRemoveModal(false)}
                                disabled={isRemoving}
                                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleRemovePhoto}
                                disabled={isRemoving}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                {isRemoving ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Removing...</span>
                                    </>
                                ) : (
                                    <span>Remove</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AccountPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <AccountContent />
        </Suspense>
    );
}
