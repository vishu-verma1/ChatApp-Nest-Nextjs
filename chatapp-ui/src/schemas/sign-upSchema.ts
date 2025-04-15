import { z } from "zod";

export const UsernameValidation = z
  .string()
  .min(2, "Username must be atleast 2 characters long")
  .max(24, "Username must not be more than 24 characters ")
  .regex(/^[a-zA-Z0-9_]+$/, "Username must not contain any special characters");

export const signUpShema = z.object({
  username: UsernameValidation,
  email: z.string().email({ message: "invalid email address" }),
  password: z
    .string()
    .min(6, { message: "password must be atleast 6 character long" }),
});
