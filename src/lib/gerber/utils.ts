/**
 * Serializes a HAST (HTML/XML Abstract Syntax Tree) node to raw string.
 * This allows us to convert tracespace rendered SVGs into standard strings.
 */
export function hastToString(node: any): string {
    if (!node) return "";
    if (node.type === "text") {
        return node.value || "";
    }
    if (node.type === "element") {
        const tagName = node.tagName;
        const properties = node.properties || {};
        const attrs = Object.entries(properties)
            .map(([key, val]) => {
                if (Array.isArray(val)) return `${key}="${val.join(" ")}"`;
                if (typeof val === "boolean") return val ? key : "";
                return `${key}="${val}"`;
            })
            .filter(Boolean)
            .join(" ");
        const childrenStr = (node.children || []).map(hastToString).join("");
        const attrStr = attrs ? " " + attrs : "";
        return `<${tagName}${attrStr}>${childrenStr}</${tagName}>`;
    }
    if (node.children) {
        return (node.children || []).map(hastToString).join("");
    }
    return "";
}

/**
 * Normalizes a value to millimeters based on files units.
 */
export function toMM(val: number, units: "mm" | "in"): number {
    if (val === Infinity || val === -Infinity || isNaN(val)) return 0;
    return units === "in" ? val * 25.4 : val;
}
