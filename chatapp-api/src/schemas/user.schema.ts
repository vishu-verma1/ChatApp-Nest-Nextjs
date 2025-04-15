import { z } from 'zod';

export const UsernameValidation = z
  .string()
  .min(2, 'Username must be atleast 2 characters long')
  .max(24, 'Username must not be more than 24 characters ')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username must not contain any special characters');

export const createUserSchema = z.object({
  username: UsernameValidation,
  email: z.string().email({ message: 'invalid email address' }),
  password: z
    .string()
    .min(6, { message: 'password must be atleast 6 character long' }),
});

// signIn
export const signInSchema = z.object({
  email: z.string().email({ message: 'invalid email address' }),
  password: z
    .string()
    .min(6, { message: 'password must be atleast 6 character long' }),
});

export const updateUserSchema = z.object({
  username: UsernameValidation.optional(),
  email: z.string().email({ message: 'invalid email address' }).optional(),
  password: z
    .string()
    .min(6, { message: 'password must be atleast 6 character long' })
    .optional(),
});


export const UsernameQueryShema = z.object({
  //must for validating schema with zod (making schema of query)
  username: UsernameValidation,
});