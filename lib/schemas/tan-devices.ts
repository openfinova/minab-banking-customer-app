import { z } from "zod";

export const tanDeviceConfirmSchema = z.object({
  confirmationCode: z
    .string()
    .length(8, "Enter the 8-digit code from your TAN app")
    .regex(/^\d{8}$/, "Code must be 8 digits"),
});

export type TanDeviceConfirmInput = z.infer<typeof tanDeviceConfirmSchema>;
