export async function executeRepeatOrder(
    ordId: number | string,
    router: any,
    setLoadingId?: (id: number | null) => void
) {
    try {
        const numId = Number(ordId);
        if (setLoadingId) setLoadingId(numId);

        const savedUser = typeof window !== "undefined" ? localStorage.getItem("megabyte_user") : null;
        const token = typeof window !== "undefined" ? localStorage.getItem("megabyte_user_token") : null;
        const userObj = savedUser ? JSON.parse(savedUser) : null;

        if (!userObj?.id) {
            router.push(`/login?redirect=/orders`);
            return;
        }

        // 1. Call backend API /api/orders/${ordId}/repeat
        const res = await fetch(`/api/orders/${ordId}/repeat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                user_id: userObj.id,
                order_id: ordId
            })
        });

        const data = await res.json();

        if (!res.ok || !data.success || !data.cart_item) {
            const errMsg = data.message || "The Gerber file for this order is no longer available. Please upload the Gerber file again.";
            alert(errMsg);
            return;
        }

        const newCartItem = data.cart_item;

        // 2. Load current local cart & add new reorder item
        const savedCart = localStorage.getItem("megabyte_cart");
        let cartItems = savedCart ? JSON.parse(savedCart) : [];

        // Check if item with same ID already in cart or append
        const existingIndex = cartItems.findIndex((c: any) => c.id === newCartItem.id);
        if (existingIndex >= 0) {
            cartItems[existingIndex] = newCartItem;
        } else {
            cartItems.push(newCartItem);
        }

        // 3. Save updated cart to localStorage & sync with backend /api/cart/save
        localStorage.setItem("megabyte_cart", JSON.stringify(cartItems));
        localStorage.setItem("selectedCartItemIds", JSON.stringify([newCartItem.id]));

        let sessionId = localStorage.getItem("megabyte_session_id");
        if (!sessionId) {
            sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem("megabyte_session_id", sessionId);
        }

        try {
            await fetch("/api/cart/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    items: cartItems
                })
            });
        } catch (e) {
            // Ignore background sync error
        }

        // 4. Dispatch cart update event & redirect to Cart
        window.dispatchEvent(new Event("megabyte_cart_updated"));
        router.push("/cart");

    } catch (err: any) {
        console.error("Repeat order error:", err);
        alert("Unable to repeat this order: " + (err.message || "Server Error"));
    } finally {
        if (setLoadingId) setLoadingId(null);
    }
}
