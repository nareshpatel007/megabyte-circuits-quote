const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Use Next.js API route as proxy to backend
const NEXTJS_API_URL = '/api';

export interface OrderFormData {
    // Basic PCB Specifications
    base_material: string;
    layers: string;
    width: string;
    height: string;
    unit: string;
    qty: string;
    product_type: string;
    different_design: string;

    // PCB Specifications
    thickness: string;
    pcb_color: string;
    silkscreen: string;
    material_type: string;
    surface_finish: string;

    // High-spec Options
    copper_weight: string;
    via_covering: string;
    via_plating: string;
    min_hole: string;
    tolerance: string;
    confirm_file: string;
    mark_on_pcb: string;
    elec_test: string;
    gold_fingers: string;
    castellated: string;
    edge_plating: string;
    blind_slots: string;
    ul_marking: string;
    humidity: string;

    // Advanced Options
    kelvin_test: string;
    paper_between: string;
    appearance_quality: string;
    silkscreen_tech: string;
    inspection_report: string;
    pcb_remark: string;

    // Additional Options
    assembly_on: boolean;
    stencil_on: boolean;
    build_time: string;

    // Customer Information
    board_name: string;
    user_mobile: string;
    user_email: string;
    gst_number: string;
    customer_name: string;
    billing_address: string;
    shipping_address: string;

    // Pricing Information
    lead_time_days: number;
    unit_price: string;
    order_value: string;
    delivery_date: string;
    total_area_sqm: number;

    // File Upload
    gerber_file?: File;
}

export interface OrderResponse {
    success: boolean;
    message: string;
    data?: {
        order_id: number;
        order_number: string;
        status: string;
        total_value: string;
        delivery_date: string;
    };
    errors?: Record<string, string[]>;
}

export async function submitOrder(formData: OrderFormData): Promise<OrderResponse> {
    try {
        // Create FormData for file upload
        const formDataToSend = new FormData();

        // Add all form fields
        Object.keys(formData).forEach(key => {
            const value = formData[key as keyof OrderFormData];
            if (key === 'gerber_file' && value instanceof File) {
                formDataToSend.append('gerber_file', value);
            } else if (key === 'assembly_on' || key === 'stencil_on') {
                // Always send boolean fields as '1' or '0'
                formDataToSend.append(key, String(value === true ? '1' : '0'));
            } else if (value !== undefined && value !== null && value !== '') {
                formDataToSend.append(key, String(value));
            }
        });

        // Call Next.js API route (which proxies to Laravel backend)
        const response = await fetch(`${NEXTJS_API_URL}/orders/submit`, {
            method: 'POST',
            body: formDataToSend,
            // Don't set Content-Type header when using FormData - browser sets it automatically with boundary
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: data.message || 'Failed to submit order',
                errors: data.errors
            };
        }

        return data;
    } catch (error) {
        return {
            success: false,
            message: 'Network error occurred while submitting order',
            errors: undefined
        };
    }
}
