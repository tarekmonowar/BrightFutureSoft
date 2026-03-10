import z from "zod";

// ─── Validation schema
export const sendMessageSchema = z.object({
  to: z
    .string({ required_error: "to is required" })
    .trim()
    .regex(
      /^\d{7,15}$/,
      "to must be 7–15 digits (country code included, no leading +)",
    ),

  message: z
    .string({ required_error: "message is required" })
    .trim()
    .min(1, "message cannot be empty")
    .max(4096, "message exceeds the 4096-character limit"),
});
