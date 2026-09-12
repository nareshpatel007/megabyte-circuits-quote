export interface PublicHoliday {
    id: number;
    date: string; // YYYY-MM-DD
    name: string;
    day_of_week: string;
    description: string | null;
}

export async function fetchPublicHolidays(startDate?: string, endDate?: string): Promise<PublicHoliday[]> {
    try {
        const query = new URLSearchParams();
        if (startDate) query.append("start_date", startDate);
        if (endDate) query.append("end_date", endDate);

        const res = await fetch(`/api/delivery/holidays?${query.toString()}`);
        if (!res.ok) return [];

        const data = await res.json();
        if (data.success && Array.isArray(data.holidays)) {
            return data.holidays;
        }
        return [];
    } catch (err) {
        console.error("Failed to fetch public holidays:", err);
        return [];
    }
}
