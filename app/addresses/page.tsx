"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit3, Eye, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";

interface SavedAddress {
    id: number;
    address_type: "shipping" | "billing";
    customer_type: "company" | "individual";
    company_name?: string;
    first_name: string;
    last_name: string;
    country: string;
    state: string;
    city: string;
    street_address: string;
    building_no?: string;
    postal_code: string;
    mobile: string;
    is_default?: boolean | number;
}

function AddressesSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
        </div>
    );
}

function AddressesContent() {
    const router = useRouter();

    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id?: string | number; name?: string } | null>(null);

    // Modals
    const [viewingAddress, setViewingAddress] = useState<SavedAddress | null>(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
    const [addrType, setAddrType] = useState<"shipping" | "billing">("shipping");
    const [custType, setCustType] = useState<"company" | "individual">("individual");
    const [companyName, setCompanyName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [stateName, setStateName] = useState("");
    const [cityName, setCityName] = useState("");
    const [streetAddr, setStreetAddr] = useState("");
    const [buildingNo, setBuildingNo] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [mobile, setMobile] = useState("");
    const [isSavingAddr, setIsSavingAddr] = useState(false);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const savedUser = localStorage.getItem("megabyte_user");
                const token = localStorage.getItem("megabyte_user_token");

                if (!token || !savedUser) {
                    router.push("/login?redirect=/addresses");
                    return;
                }

                const userObj = JSON.parse(savedUser);
                setUser(userObj);

                if (userObj?.id) {
                    const res = await fetch(`/api/checkout/addresses?user_id=${userObj.id}`);
                    const data = await res.json();
                    if (data.status) {
                        setAddresses(data.addresses || []);
                    }
                }
            } catch (e) {
                console.error("Addresses page fetch error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchAddresses();
    }, [router]);

    const handleDeleteAddress = async (addressId: number) => {
        if (!user?.id) return;
        if (!window.confirm("Are you sure you want to delete this address?")) return;

        try {
            const res = await fetch("/api/checkout/delete-address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: addressId, user_id: user.id })
            });

            const data = await res.json();
            if (data.status) {
                setAddresses((prev) => prev.filter((a) => a.id !== addressId));
            } else {
                alert(data.message || "Failed to delete address.");
            }
        } catch (e) {
            console.error("Delete address error:", e);
        }
    };

    const handleOpenAddAddressModal = (type: "shipping" | "billing") => {
        setEditingAddressId(null);
        setAddrType(type);
        setCustType("individual");
        setCompanyName("");
        if (user?.name) {
            const parts = user.name.split(" ");
            setFirstName(parts[0] || "");
            setLastName(parts.slice(1).join(" ") || "");
        } else {
            setFirstName("");
            setLastName("");
        }
        setStateName("");
        setCityName("");
        setStreetAddr("");
        setBuildingNo("");
        setPostalCode("");
        setMobile("");
        setIsAddressModalOpen(true);
    };

    const handleOpenEditAddressModal = (addr: SavedAddress) => {
        setEditingAddressId(addr.id);
        setAddrType(addr.address_type || "shipping");
        setCustType(addr.customer_type || "individual");
        setCompanyName(addr.company_name || "");
        setFirstName(addr.first_name || "");
        setLastName(addr.last_name || "");
        setStateName(addr.state || "");
        setCityName(addr.city || "");
        setStreetAddr(addr.street_address || "");
        setBuildingNo(addr.building_no || "");
        setPostalCode(addr.postal_code || "");
        setMobile(addr.mobile || "");
        setIsAddressModalOpen(true);
    };

    const handleSaveAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        setIsSavingAddr(true);
        try {
            const payload = {
                id: editingAddressId,
                user_id: user.id,
                address_type: addrType,
                customer_type: custType,
                company_name: companyName,
                first_name: firstName,
                last_name: lastName,
                country: "India",
                state: stateName,
                city: cityName,
                street_address: streetAddr,
                building_no: buildingNo,
                postal_code: postalCode,
                mobile
            };

            const res = await fetch("/api/checkout/save-address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.status && data.address) {
                const newAddr: SavedAddress = data.address;
                if (editingAddressId) {
                    setAddresses((prev) => prev.map((a) => (a.id === editingAddressId ? newAddr : a)));
                } else {
                    setAddresses((prev) => [newAddr, ...prev]);
                }
                setIsAddressModalOpen(false);
            } else {
                alert(data.message || "Failed to save address.");
            }
        } catch (err) {
            console.error("Save address submit error:", err);
        } finally {
            setIsSavingAddr(false);
        }
    };

    const shippingAddresses = addresses.filter((a) => a.address_type !== "billing");
    const billingAddresses = addresses.filter((a) => a.address_type === "billing");

    return (
        <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#030712] text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row font-sans transition-colors">
            <DashboardSidebar />

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <Header />

                <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                    {/* Header Banner */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0b0f19] p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                                My Addresses
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
                                Manage your saved shipping and billing delivery addresses.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleOpenAddAddressModal("shipping")}
                                className="px-4 py-2.5 rounded-full bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ Add Shipping</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleOpenAddAddressModal("billing")}
                                className="px-4 py-2.5 rounded-full bg-gray-800 hover:bg-black text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ Add Billing</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0b0f19] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 shadow-2xs space-y-6">
                        <div className="border-b border-gray-100 dark:border-zinc-800 pb-4">
                            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Address Book</h2>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Keep your delivery and billing records up to date.</p>
                        </div>

                        {loading ? (
                            <AddressesSkeleton />
                        ) : (
                            <div className="space-y-6">
                                {/* Shipping Addresses Group */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                                        Shipping Addresses ({shippingAddresses.length})
                                    </h3>

                                    {shippingAddresses.length === 0 ? (
                                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 text-xs text-gray-500 dark:text-zinc-400">
                                            No shipping address stored. Click "+ Add Shipping" to create one.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {shippingAddresses.map((addr) => (
                                                <div key={addr.id} className="p-4 rounded-xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#0b0f19] shadow-2xs space-y-3 flex flex-col justify-between">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                                                                {addr.first_name} {addr.last_name}
                                                                {addr.company_name ? ` (${addr.company_name})` : ""}
                                                            </span>
                                                            {Boolean(addr.is_default) && (
                                                                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                                                                    DEFAULT
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed font-medium">
                                                            {addr.building_no ? `${addr.building_no}, ` : ""}{addr.street_address}, {addr.city}, {addr.state} - {addr.postal_code}, {addr.country}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-bold">Mobile: {addr.mobile}</p>
                                                    </div>

                                                    <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-end gap-2 text-xs">
                                                        <button
                                                            onClick={() => setViewingAddress(addr)}
                                                            className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 font-bold flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            <span>View</span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleOpenEditAddressModal(addr)}
                                                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                            <span>Edit</span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteAddress(addr.id)}
                                                            className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 font-bold flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Billing Addresses Group */}
                                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                                    <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                                        Billing Addresses ({billingAddresses.length})
                                    </h3>

                                    {billingAddresses.length === 0 ? (
                                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 text-xs text-gray-500 dark:text-zinc-400">
                                            No billing address stored. Click "+ Add Billing" to create one.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {billingAddresses.map((addr) => (
                                                <div key={addr.id} className="p-4 rounded-xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#0b0f19] shadow-2xs space-y-3 flex flex-col justify-between">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                                                                {addr.first_name} {addr.last_name}
                                                                {addr.company_name ? ` (${addr.company_name})` : ""}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold uppercase">
                                                                BILLING
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed font-medium">
                                                            {addr.building_no ? `${addr.building_no}, ` : ""}{addr.street_address}, {addr.city}, {addr.state} - {addr.postal_code}, {addr.country}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-bold">Mobile: {addr.mobile}</p>
                                                    </div>

                                                    <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-end gap-2 text-xs">
                                                        <button
                                                            onClick={() => setViewingAddress(addr)}
                                                            className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 font-bold flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            <span>View</span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleOpenEditAddressModal(addr)}
                                                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                            <span>Edit</span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteAddress(addr.id)}
                                                            className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-bold flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <Footer />
            </div>

            {/* View Address Modal */}
            {viewingAddress && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-extrabold text-gray-900 uppercase">
                                {viewingAddress.address_type === "billing" ? "Billing Address Details" : "Shipping Address Details"}
                            </h3>
                            <button onClick={() => setViewingAddress(null)} className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-xs font-medium text-gray-700">
                            <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Recipient Name</span><strong className="text-gray-900 text-sm">{viewingAddress.first_name} {viewingAddress.last_name}</strong></div>
                            {viewingAddress.company_name && <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Company</span><strong className="text-gray-900">{viewingAddress.company_name}</strong></div>}
                            <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Street Address</span><p className="text-gray-900">{viewingAddress.building_no ? `${viewingAddress.building_no}, ` : ""}{viewingAddress.street_address}</p></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><span className="text-gray-400 block text-[10px] uppercase font-bold">City</span><strong className="text-gray-900">{viewingAddress.city}</strong></div>
                                <div><span className="text-gray-400 block text-[10px] uppercase font-bold">State</span><strong className="text-gray-900">{viewingAddress.state}</strong></div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Postal Code</span><strong className="text-gray-900">{viewingAddress.postal_code}</strong></div>
                                <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Country</span><strong className="text-gray-900">{viewingAddress.country}</strong></div>
                            </div>
                            <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Mobile</span><strong className="text-gray-900">{viewingAddress.mobile}</strong></div>
                        </div>

                        <div className="pt-2 text-right">
                            <button onClick={() => setViewingAddress(null)} className="px-5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-xs text-gray-700 cursor-pointer">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Address Modal */}
            {isAddressModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-extrabold text-gray-900 uppercase">
                                {editingAddressId ? "Edit Address" : `Add New ${addrType === "billing" ? "Billing" : "Shipping"} Address`}
                            </h3>
                            <button onClick={() => setIsAddressModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveAddressSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Address Type</label>
                                    <select
                                        value={addrType}
                                        onChange={(e) => setAddrType(e.target.value as any)}
                                        className="w-full h-9 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none bg-white font-semibold"
                                    >
                                        <option value="shipping">Shipping Address</option>
                                        <option value="billing">Billing Address</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Customer Type</label>
                                    <select
                                        value={custType}
                                        onChange={(e) => setCustType(e.target.value as any)}
                                        className="w-full h-9 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none bg-white font-semibold"
                                    >
                                        <option value="individual">Individual Customer</option>
                                        <option value="company">Company</option>
                                    </select>
                                </div>
                            </div>

                            {custType === "company" && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Company Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Company Name"
                                        className="w-full h-9 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="First Name"
                                        className="w-full h-9 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Last Name"
                                        className="w-full h-9 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Country</label>
                                    <input type="text" readOnly value="India" className="w-full h-9 px-3 text-xs border border-gray-200 rounded-xl bg-gray-100 text-gray-600 font-bold" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
                                    <input
                                        type="text"
                                        required
                                        value={stateName}
                                        onChange={(e) => setStateName(e.target.value)}
                                        placeholder="State"
                                        className="w-full h-9 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">City *</label>
                                    <input
                                        type="text"
                                        required
                                        value={cityName}
                                        onChange={(e) => setCityName(e.target.value)}
                                        placeholder="City"
                                        className="w-full h-9 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Street Address *</label>
                                    <input
                                        type="text"
                                        required
                                        value={streetAddr}
                                        onChange={(e) => setStreetAddr(e.target.value)}
                                        placeholder="Street Address"
                                        className="w-full h-9 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Building/House No</label>
                                    <input
                                        type="text"
                                        value={buildingNo}
                                        onChange={(e) => setBuildingNo(e.target.value)}
                                        placeholder="Building/House No"
                                        className="w-full h-9 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Postal Code *</label>
                                    <input
                                        type="text"
                                        required
                                        value={postalCode}
                                        onChange={(e) => setPostalCode(e.target.value)}
                                        placeholder="Postal Code"
                                        className="w-full h-9 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Cell/Mobile *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        placeholder="Cell/Mobile number"
                                        className="w-full h-9 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddressModalOpen(false)}
                                    className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingAddr}
                                    className="px-6 py-2 rounded-full bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                                >
                                    {isSavingAddr ? "Saving..." : "Save Address"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AddressesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <AddressesContent />
        </Suspense>
    );
}
