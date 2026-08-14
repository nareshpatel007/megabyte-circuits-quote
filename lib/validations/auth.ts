import { z } from "zod";

export const signInSchema = z.object({
    usernameOrEmail: z.string().trim().min(1, "Username or Email is required"),
    password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
    username: z
        .string()
        .trim()
        .min(1, "Username is required")
        .min(2, "Username must be at least 2 characters"),
    email: z
        .string()
        .trim()
        .min(1, "Email is required")
        .email("Please enter a valid email address"),
    password: z
        .string()
        .min(1, "Password is required")
        .min(6, "Password must be at least 6 characters"),
    accountType: z.enum(["personal", "company"]),
    country: z.string().min(1, "Country is required"),
    gstNumber: z.string().trim().optional(),
    agreeTerms: z.boolean().refine((val) => val === true, {
        message: "You must accept the Terms of Use and Privacy Policy",
    }),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
