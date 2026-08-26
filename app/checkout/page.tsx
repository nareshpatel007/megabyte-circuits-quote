"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { ShieldCheck, ArrowLeft, Check, Plus, Loader2, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";
import GerberBoardPreview from "@/components/GerberBoardPreview";
import { useCurrency } from "@/context/CurrencyContext";
import { loadCartFromBackend, saveCartToBackend } from "@/lib/cartSession";
import { getAuthToken, getAuthUser } from "@/lib/auth";

interface CartItem {
    id: string;
    productType: "pcb" | "stencil" | "part";
    boardName: string;
    gerberFileName?: string;
    gerberPreview?: string;
    boardId?: string;
    pcbColor?: string;
    layers: string;
    dimensions: string;
    qty: number;
    buildTime: string;
    price: number;
    unitPrice?: number;
    material: string;
    thickness: string;
    surfaceFinish?: string;
    copperWeight?: string;
    shippingOption?: string;
    shippingOptionKey?: string;
    shippingCharge?: number;
    width?: number | string;
    height?: number | string;
    photoUrl?: string;
    partNumber?: string;
    description?: string;
    date: string;
}

interface SavedAddress {
    id: number;
    address_type?: "shipping" | "billing";
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

function CheckoutContent() {
    const router = useRouter();
    const { symbol, formatPrice } = useCurrency();

    // Cart & User state
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [user, setUser] = useState<{ id?: string | number; name?: string; email?: string } | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        try {
            const token = getAuthToken();
            const authUser = getAuthUser();
            setIsLoggedIn(Boolean(token && authUser));
        } catch (e) {
            setIsLoggedIn(false);
        }
    }, []);

    // Address Lists & Selections
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [statesList, setStatesList] = useState<{ id: number; code: string; name: string }[]>([]);
    const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<number | null>(null);
    const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<number | null>(null);

    // Mode toggles
    const [billingOption, setBillingOption] = useState<"same" | "choose">("same");
    const [activeFormType, setActiveFormType] = useState<"none" | "shipping" | "billing">("none");

    // Address Form State
    const [customerType, setCustomerType] = useState<"company" | "individual">("individual");
    const [companyName, setCompanyName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [country, setCountry] = useState("India"); // Country dropdown India only
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [buildingNo, setBuildingNo] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [mobile, setMobile] = useState("");

    // Payment Processing State
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchStates = async () => {
        if (statesList.length > 0) return;
        try {
            const res = await fetch("/api/checkout/states");
            const data = await res.json();
            if (data.status && Array.isArray(data.data)) {
                setStatesList(data.data);
            }
        } catch (e) {
            console.error("Failed to fetch states list:", e);
        }
    };

    const fetchAddresses = async (userId: string | number) => {
        try {
            const res = await fetch(`/api/checkout/addresses?user_id=${userId}`);
            const data = await res.json();
            if (data.status && Array.isArray(data.addresses)) {
                setSavedAddresses(data.addresses);

                // Set default shipping address
                const shippingAddrs = data.addresses.filter((a: SavedAddress) => a.address_type !== "billing");
                if (shippingAddrs.length > 0) {
                    const defaultShip = shippingAddrs.find((a: SavedAddress) => a.is_default) || shippingAddrs[0];
                    setSelectedShippingAddressId(defaultShip.id);
                } else if (data.addresses.length > 0) {
                    setSelectedShippingAddressId(data.addresses[0].id);
                }

                // Set default billing address
                const billingAddrs = data.addresses.filter((a: SavedAddress) => a.address_type === "billing");
                if (billingAddrs.length > 0) {
                    const defaultBill = billingAddrs.find((a: SavedAddress) => a.is_default) || billingAddrs[0];
                    setSelectedBillingAddressId(defaultBill.id);
                } else {
                    setSelectedBillingAddressId(null);
                }
            }
        } catch (e) {
            console.error("Failed to fetch addresses:", e);
        }
    };

    useEffect(() => {
        const initCheckout = async () => {
            try {
                // Check User Session
                const savedUser = localStorage.getItem("megabyte_user");
                const token = localStorage.getItem("megabyte_user_token");

                if (!token || !savedUser) {
                    router.push("/login?redirect=/checkout");
                    return;
                }

                const userObj = JSON.parse(savedUser);
                setUser(userObj);

                if (userObj.name) {
                    const parts = userObj.name.split(" ");
                    setFirstName(parts[0] || "");
                    setLastName(parts.slice(1).join(" ") || "");
                }

                // Fetch Saved Addresses for user
                if (userObj.id) {
                    await fetchAddresses(userObj.id);
                }

                // Load Cart Items (Prioritize explicitly checked items for checkout)
                const savedCheckoutItems = localStorage.getItem("megabyte_checkout_items");
                if (savedCheckoutItems) {
                    const parsed = JSON.parse(savedCheckoutItems);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setCartItems(parsed);
                    }
                } else {
                    const savedCart = localStorage.getItem("megabyte_cart");
                    if (savedCart) {
                        setCartItems(JSON.parse(savedCart));
                    }
                    const backendItems = await loadCartFromBackend();
                    if (Array.isArray(backendItems) && backendItems.length > 0) {
                        setCartItems(backendItems);
                    }
                }
            } catch (e) {
                console.error("Failed to load checkout page data", e);
            }
            setIsLoaded(true);
        };

        initCheckout();
    }, [router]);

    // Handle "Choose Billing Address" option click
    const handleSelectChooseBilling = () => {
        setBillingOption("choose");
        const billingAddrs = savedAddresses.filter((a) => a.address_type === "billing");
        if (billingAddrs.length > 0) {
            if (!selectedBillingAddressId || !billingAddrs.some((a) => a.id === selectedBillingAddressId)) {
                setSelectedBillingAddressId(billingAddrs[0].id);
            }
        } else {
            setSelectedBillingAddressId(null);
        }
    };

    const handleSaveNewAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");

        if (!firstName.trim() || !lastName.trim() || !state.trim() || !city.trim() || !streetAddress.trim() || !postalCode.trim() || !mobile.trim()) {
            setErrorMessage("Please fill in all required address fields.");
            return;
        }

        setIsSavingAddress(true);

        try {
            const targetType = activeFormType === "billing" ? "billing" : "shipping";

            const payload = {
                user_id: user?.id,
                address_type: targetType,
                customer_type: customerType,
                company_name: companyName,
                first_name: firstName,
                last_name: lastName,
                country: "India",
                state,
                city,
                street_address: streetAddress,
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
                setSavedAddresses((prev) => [newAddr, ...prev]);

                if (targetType === "billing") {
                    setSelectedBillingAddressId(newAddr.id);
                    setBillingOption("choose");
                } else {
                    setSelectedShippingAddressId(newAddr.id);
                }

                setActiveFormType("none");
            } else {
                setErrorMessage(data.message || "Failed to save address.");
            }
        } catch (err: any) {
            console.error("Address save error:", err);
            setErrorMessage("Error saving address. Please try again.");
        } finally {
            setIsSavingAddress(false);
        }
    };

    const shippingAddresses = savedAddresses.filter((a) => a.address_type !== "billing");
    const billingAddresses = savedAddresses.filter((a) => a.address_type === "billing");

    const selectedShippingAddress = savedAddresses.find((a) => a.id === selectedShippingAddressId);
    const selectedBillingAddress = billingOption === "same"
        ? selectedShippingAddress
        : savedAddresses.find((a) => a.id === selectedBillingAddressId);

    // Dynamic shipping charge calculation based on selected address state
    const effectiveCartItems = cartItems.map((item) => {
        if (!item.shippingOption || item.productType === "part") {
            return item;
        }

        const defaultShippingOptions = [
            { key: "standard", location: "Standard", method: "Standard", rate: 0 },
            { key: "plus", location: "Plus", method: "Plus", rate: 150 },
            { key: "fasttrack", location: "Fasttrack", method: "Fasttrack", rate: 450 },
        ];

        const foundOpt = defaultShippingOptions.find(o => 
            o.key === item.shippingOptionKey || 
            item.shippingOption?.toLowerCase().includes(o.key) ||
            (o.key === "standard" && (item.shippingOption?.toLowerCase().includes("standard") || item.shippingOptionKey === "gujarat_road")) ||
            (o.key === "plus" && (item.shippingOption?.toLowerCase().includes("plus") || item.shippingOptionKey === "out_air" || item.shippingOptionKey === "out_road")) ||
            (o.key === "fasttrack" && (item.shippingOption?.toLowerCase().includes("fasttrack") || item.shippingOptionKey === "out_fastrack"))
        ) || defaultShippingOptions[0];

        const newOptionKey = foundOpt.key;
        const newOption = (!foundOpt.method || foundOpt.location === foundOpt.method) ? foundOpt.location : `${foundOpt.location} - ${foundOpt.method}`;
        const newRate = foundOpt.rate;

        // Calculate weight
        let w = Number(item.width);
        let h = Number(item.height);
        if ((!w || !h) && item.dimensions) {
            const match = item.dimensions.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
            if (match) {
                w = parseFloat(match[1]);
                h = parseFloat(match[2]);
            }
        }
        if (!w) w = 100;
        if (!h) h = 100;

        const totalAreaInSqM = (w / 1000) * (h / 1000) * (item.qty || 1);
        const weightPerSqM = item.material === "Flex" ? 0.3 : 3.8;
        const estimatedWeightKg = Math.max(0.1, parseFloat((totalAreaInSqM * weightPerSqM).toFixed(2)));
        const chargedWeightKg = Math.max(1.0, estimatedWeightKg);
        const newShippingCharge = Math.round(newRate * chargedWeightKg);

        const pcbBasePrice = item.price - (item.shippingCharge || 0);
        const newTotalPrice = Math.max(pcbBasePrice, 0) + newShippingCharge;

        return {
            ...item,
            shippingOption: newOption,
            shippingOptionKey: newOptionKey,
            shippingCharge: newShippingCharge,
            price: newTotalPrice
        };
    });

    const grandTotal = effectiveCartItems.reduce((acc, item) => {
        const val = typeof item.price === "number" ? item.price : parseFloat(String(item.price).replace(/^0+(?=\d)/, "")) || 0;
        return acc + val;
    }, 0);

    // Requirement 4: Button is enabled ONLY when BOTH shipping & billing addresses are validly selected
    const isReadyToPay = Boolean(selectedShippingAddressId) && (billingOption === "same" || Boolean(selectedBillingAddressId));

    const handlePayNowWithRazorpay = async () => {
        if (!isReadyToPay || !selectedShippingAddress) {
            setErrorMessage("Please complete and select your shipping and billing addresses.");
            return;
        }

        setErrorMessage("");
        setIsProcessingPayment(true);

        try {
            // 1. Create Razorpay Order via Backend Proxy
            const orderRes = await fetch("/api/checkout/create-razorpay-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: grandTotal,
                    currency: "INR",
                    user_id: user?.id
                }),
            });

            const orderData = await orderRes.json();

            if (!orderData.status || !orderData.order_id) {
                throw new Error(orderData.message || "Failed to initialize payment gateway.");
            }

            // 2. Configure Razorpay Checkout Modal
            const companyName = orderData.company_name || "Megabyte Circuit";
            const logoUrl = orderData.company_logo || (typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "");

            const options = {
                key: orderData.key || "rzp_test_SQxqJOMmeLZK9n",
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: companyName,
                description: `Payment for ${cartItems.length} PCB / Stencil items`,
                image: logoUrl,
                order_id: orderData.order_id,
                prefill: {
                    name: `${selectedShippingAddress.first_name} ${selectedShippingAddress.last_name}`,
                    email: user?.email || "",
                    contact: selectedShippingAddress.mobile
                },
                theme: {
                    color: "#006838"
                },
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch("/api/checkout/verify-payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                shipping_address_id: selectedShippingAddress.id,
                                billing_address_id: selectedBillingAddress?.id || selectedShippingAddress.id,
                                items: effectiveCartItems,
                                total_amount: grandTotal,
                                user_id: user?.id,
                                email: user?.email
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyData.status) {
                            // Remove ONLY the purchased items from full cart
                            const savedCartStr = localStorage.getItem("megabyte_cart");
                            if (savedCartStr) {
                                const fullCartItems: CartItem[] = JSON.parse(savedCartStr);
                                const purchasedIds = new Set(cartItems.map((item) => item.id));
                                const remainingItems = fullCartItems.filter((item) => !purchasedIds.has(item.id));

                                localStorage.setItem("megabyte_cart", JSON.stringify(remainingItems));
                                await saveCartToBackend(remainingItems);
                            } else {
                                localStorage.removeItem("megabyte_cart");
                                await saveCartToBackend([]);
                            }
                            localStorage.removeItem("megabyte_checkout_items");
                            window.dispatchEvent(new Event("megabyte_cart_updated"));

                            // Save order numbers for Thank You page
                            sessionStorage.setItem("latest_orders", JSON.stringify(verifyData.orders || []));
                            sessionStorage.setItem("latest_txn", verifyData.transaction_number || response.razorpay_payment_id);

                            router.push("/thank-you");
                        } else {
                            setErrorMessage(verifyData.message || "Payment verification failed.");
                        }
                    } catch (err) {
                        console.error("Verification error:", err);
                        setErrorMessage("Order processing failed after payment. Please contact support.");
                    } finally {
                        setIsProcessingPayment(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false);
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on("payment.failed", function (response: any) {
                console.error("Payment failed:", response.error);
                setErrorMessage(`Payment Failed: ${response.error.description || "Transaction cancelled"}`);
                setIsProcessingPayment(false);
            });
            rzp.open();

        } catch (err: any) {
            console.error("Checkout initiation error:", err);
            setErrorMessage(err.message || "Failed to start payment checkout.");
            setIsProcessingPayment(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f4f6f9]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#030712] text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row font-sans transition-colors">
            {/* Razorpay Script */}
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            {/* Left Sidebar when logged in */}
            {isLoggedIn && <DashboardSidebar />}

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                {/* Theme Header */}
                <Header />

                {/* Main Content Area */}
                <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                    {/* Page Title & Back to Cart Button */}
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-sm sm:text-base font-bold text-gray-700 dark:text-zinc-300 tracking-wider uppercase">
                            CHECKOUT
                        </h1>
                        <Link
                            href="/cart"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary hover:text-white font-bold text-xs sm:text-sm transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Cart</span>
                        </Link>
                    </div>

                    {errorMessage && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-7 shadow-2xs">
                            {activeFormType !== "none" ? (
                                <form onSubmit={handleSaveNewAddress} className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
                                        <h3 className="text-sm font-extrabold text-gray-900">
                                            {activeFormType === "billing" ? "Add New Billing Address" : "Add New Shipping Address"}
                                        </h3>
                                        {(savedAddresses.length > 0) && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveFormType("none")}
                                                className="text-xs font-bold text-gray-500 hover:text-gray-700 underline cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mb-2">
                                        <label
                                            onClick={() => setCustomerType("company")}
                                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${customerType === "company"
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="customerType"
                                                checked={customerType === "company"}
                                                onChange={() => setCustomerType("company")}
                                                className="accent-primary"
                                            />
                                            <span>Company</span>
                                        </label>

                                        <label
                                            onClick={() => setCustomerType("individual")}
                                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${customerType === "individual"
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="customerType"
                                                checked={customerType === "individual"}
                                                onChange={() => setCustomerType("individual")}
                                                className="accent-primary"
                                            />
                                            <span>Individual Customer</span>
                                        </label>
                                    </div>

                                    {customerType === "company" && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Company Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                placeholder="Company Name"
                                                className="w-full h-10 px-3.5 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                * First Name
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="First Name"
                                                className="w-full h-10 px-3.5 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                * Last Name
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Last Name"
                                                className="w-full h-10 px-3.5 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                * Country / Region
                                            </label>
                                            <select
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                className="w-full h-10 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none bg-white transition-all text-gray-700 cursor-default"
                                            >
                                                <option value="India">India</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                * State
                                            </label>
                                            <select
                                                required
                                                value={state}
                                                onChange={(e) => setState(e.target.value)}
                                                className="w-full h-10 px-3 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none bg-white transition-all text-gray-700"
                                            >
                                                <option value="">Select State</option>
                                                {statesList.map((st) => (
                                                    <option key={st.code} value={st.name}>
                                                        {st.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                * City
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="City"
                                                className="w-full h-10 px-3.5 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                * Street Address
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={streetAddress}
                                                onChange={(e) => setStreetAddress(e.target.value)}
                                                placeholder="Street Address"
                                                className="w-full h-10 px-3.5 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Building/House No
                                            </label>
                                            <input
                                                type="text"
                                                value={buildingNo}
                                                onChange={(e) => setBuildingNo(e.target.value)}
                                                placeholder="Building/House No"
                                                className="w-full h-10 px-3.5 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Postal Code & Mobile Number */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                * Postal Code
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={postalCode}
                                                onChange={(e) => setPostalCode(e.target.value)}
                                                placeholder="Postal Code"
                                                className="w-full h-10 px-3.5 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                * Cell/Mobile number
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                value={mobile}
                                                onChange={(e) => setMobile(e.target.value)}
                                                placeholder="Cell/Mobile number"
                                                className="w-full h-10 px-3.5 text-xs border border-gray-300 rounded-xl focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSavingAddress}
                                            className="px-6 py-2.5 rounded-full bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                                        >
                                            {isSavingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                            <span>Save Address</span>
                                        </button>

                                        {savedAddresses.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveFormType("none")}
                                                className="px-4 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-extrabold text-gray-900">
                                            Shipping Information
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                fetchStates();
                                                setActiveFormType("shipping");
                                            }}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Add new shipping address</span>
                                        </button>
                                    </div>

                                    {/* Saved Shipping Address Radio List */}
                                    {shippingAddresses.length > 0 ? (
                                        <div className="space-y-3">
                                            {shippingAddresses.map((addr) => {
                                                const isSelected = selectedShippingAddressId === addr.id;
                                                const fullAddr = `${addr.first_name} ${addr.last_name} / ${addr.building_no ? addr.building_no + ', ' : ''}${addr.street_address}, ${addr.city}, ${addr.state}, ${addr.postal_code}, ${addr.country.toUpperCase()}, ${addr.mobile}`;

                                                return (
                                                    <label
                                                        key={addr.id}
                                                        onClick={() => setSelectedShippingAddressId(addr.id)}
                                                        className={`flex items-start justify-between gap-3 p-4 rounded-xl border text-xs cursor-pointer transition-all ${isSelected
                                                            ? "border-primary bg-primary/5 shadow-2xs"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <input
                                                                type="radio"
                                                                name="shippingAddress"
                                                                checked={isSelected}
                                                                onChange={() => setSelectedShippingAddressId(addr.id)}
                                                                className="mt-0.5 accent-primary shrink-0 cursor-pointer"
                                                            />
                                                            <span className="font-semibold text-gray-800 leading-relaxed">
                                                                {fullAddr}
                                                            </span>
                                                        </div>

                                                        {Boolean(addr.is_default) && (
                                                            <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-500 text-[10px] font-extrabold uppercase shrink-0">
                                                                DEFAULT
                                                            </span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                                            <span>No shipping address stored.</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    fetchStates();
                                                    setActiveFormType("shipping");
                                                }}
                                                className="text-primary font-bold hover:underline cursor-pointer"
                                            >
                                                + Add Shipping Address
                                            </button>
                                        </div>
                                    )}

                                    {/* Billing Information Section */}
                                    <div className="pt-4 border-t border-gray-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-extrabold text-gray-900">
                                                Billing Information
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    fetchStates();
                                                    setActiveFormType("billing");
                                                }}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Add new billing address</span>
                                            </button>
                                        </div>

                                        <div className="space-y-3 text-xs font-semibold text-gray-700">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="radio"
                                                    name="billingOption"
                                                    checked={billingOption === "same"}
                                                    onChange={() => setBillingOption("same")}
                                                    className="accent-primary cursor-pointer"
                                                />
                                                <span>Same as shipping address</span>
                                            </label>

                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="radio"
                                                    name="billingOption"
                                                    checked={billingOption === "choose"}
                                                    onChange={handleSelectChooseBilling}
                                                    className="accent-primary cursor-pointer"
                                                />
                                                <span>Choose Billing Address</span>
                                            </label>
                                        </div>

                                        {/* Billing Address Radio Selection List when "Choose Billing Address" is active */}
                                        {billingOption === "choose" && (
                                            billingAddresses.length > 0 ? (
                                                <div className="space-y-3 pt-2">
                                                    {billingAddresses.map((bAddr) => {
                                                        const isBSelected = selectedBillingAddressId === bAddr.id;
                                                        const fullBAddr = `${bAddr.first_name} ${bAddr.last_name} / ${bAddr.building_no ? bAddr.building_no + ', ' : ''}${bAddr.street_address}, ${bAddr.city}, ${bAddr.state}, ${bAddr.postal_code}, ${bAddr.country.toUpperCase()}, ${bAddr.mobile}`;

                                                        return (
                                                            <label
                                                                key={bAddr.id}
                                                                onClick={() => setSelectedBillingAddressId(bAddr.id)}
                                                                className={`flex items-start justify-between gap-3 p-4 rounded-xl border text-xs cursor-pointer transition-all ${isBSelected
                                                                    ? "border-primary bg-primary/5 shadow-2xs"
                                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                                                    }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <input
                                                                        type="radio"
                                                                        name="billingAddressRadio"
                                                                        checked={isBSelected}
                                                                        onChange={() => setSelectedBillingAddressId(bAddr.id)}
                                                                        className="mt-0.5 accent-primary shrink-0 cursor-pointer"
                                                                    />
                                                                    <span className="font-semibold text-gray-800 leading-relaxed">
                                                                        {fullBAddr}
                                                                    </span>
                                                                </div>
                                                                {Boolean(bAddr.is_default) && (
                                                                    <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-500 text-[10px] font-extrabold uppercase shrink-0">
                                                                        DEFAULT
                                                                    </span>
                                                                )}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 flex justify-between items-center mt-2">
                                                    <span>No billing address stored.</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            fetchStates();
                                                            setActiveFormType("billing");
                                                        }}
                                                        className="text-primary font-bold hover:underline cursor-pointer"
                                                    >
                                                        + Add Billing Address
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: SUMMARY Sidebar */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 space-y-5 sticky top-20 shadow-xs">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                                    SUMMARY
                                </h2>
                                <span className="text-xs font-semibold text-primary">
                                    {cartItems.length} items
                                </span>
                            </div>

                            {/* Product Breakdown with Exact Part Image / Gerber Preview & Delivery Details */}
                            <div className="space-y-3 border-b border-gray-100 pb-4">
                                <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                                    PRODUCT BREAKDOWN
                                </h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                                    {effectiveCartItems.map((item, idx) => (
                                        <div key={item.id || idx} className="space-y-1.5 border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                                            <div className="flex items-start gap-3 text-xs">
                                                {/* Image Box matching Cart Page */}
                                                <div className="w-12 h-12 bg-white rounded-lg border border-gray-200/90 flex items-center justify-center p-1 overflow-hidden shrink-0 relative">
                                                    {item.productType === "part" ? (
                                                        <img
                                                            src={item.photoUrl || "https://mm.digikey.com/Volume0/opasdata/d220001/medias/images/7182/MFG_RMCF_series.jpg"}
                                                            alt={item.boardName || item.partNumber || "Part"}
                                                            className="w-full h-full object-contain"
                                                            onError={(e) => {
                                                                (e.target as HTMLElement).setAttribute(
                                                                    "src",
                                                                    "https://mm.digikey.com/Volume0/opasdata/d220001/medias/images/7182/MFG_RMCF_series.jpg"
                                                                );
                                                            }}
                                                        />
                                                    ) : (
                                                        <GerberBoardPreview
                                                            previewData={item.gerberPreview}
                                                            boardName={item.gerberFileName || item.boardName}
                                                            pcbColor={item.pcbColor}
                                                            layers={item.layers}
                                                        />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-1">
                                                        <p className="font-extrabold text-gray-800 leading-snug truncate max-w-[130px]">
                                                            {item.boardName || item.partNumber || item.gerberFileName || (item.productType === "stencil" ? "SMT Stencil" : "Standard PCB")}
                                                        </p>
                                                        <span className="font-extrabold text-gray-900 shrink-0">
                                                            {formatPrice(item.price)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                                        Qty: {item.qty} {item.productType === "part" ? "| Part" : `| ${item.layers || '2'} Layer | ${item.pcbColor || "Green"}`}
                                                    </p>
                                                    {item.shippingOption && (
                                                        <div className="mt-1 bg-blue-50/80 border border-blue-100/80 rounded p-1 text-[10px] text-blue-900 leading-tight">
                                                            <div className="font-bold flex items-center justify-between">
                                                                <span>🚚 {item.shippingOption}</span>
                                                                <span className="font-extrabold text-primary">{formatPrice(item.shippingCharge || 0)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Requirement 6: Removed Merchandise Total line, directly display Grand Total */}
                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between text-base font-black text-gray-900">
                                    <span>Grand Total</span>
                                    <span className="text-primary text-xl font-extrabold">
                                        {formatPrice(grandTotal)}
                                    </span>
                                </div>
                            </div>

                            {/* Requirement 4 & 5: Continue to Payment Button */}
                            <div>
                                <button
                                    type="button"
                                    onClick={handlePayNowWithRazorpay}
                                    disabled={!isReadyToPay || isProcessingPayment}
                                    className={`w-full py-3.5 rounded-full font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${isReadyToPay && !isProcessingPayment
                                        ? "bg-primary hover:bg-secondary text-white active:scale-98"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                                        }`}
                                >
                                    {isProcessingPayment ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>
                                                {isReadyToPay
                                                    ? "Continue to Payment"
                                                    : !selectedShippingAddressId
                                                        ? "Select Shipping Address"
                                                        : "Select Billing Address"}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="pt-2 text-[10px] text-gray-400 text-center font-medium space-y-1">
                                <p>Secured by <strong>Razorpay</strong></p>
                                <p>Orders will be split per item with individual tracking IDs.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Theme Footer */}
            <Footer />
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
