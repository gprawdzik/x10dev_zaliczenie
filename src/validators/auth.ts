import { z } from 'zod';

/**
 * Schemat walidacji formularza rejestracji.
 * Wymusza silne hasła, zgodnie z wymaganiami bezpieczeństwa.
 */
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email jest wymagany')
      .email('Nieprawidłowy format email'),
    password: z
      .string()
      .min(10, 'Hasło musi mieć minimum 10 znaków')
      .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
      .regex(/[a-z]/, 'Hasło musi zawierać przynajmniej jedną małą literę')
      .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę'),
    confirmPassword: z.string().min(1, 'Potwierdzenie hasła jest wymagane'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Hasła muszą być identyczne',
    path: ['confirmPassword'],
  });

/**
 * Schemat walidacji formularza logowania.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

/**
 * Schemat walidacji formularza odzyskiwania konta (reset hasła).
 */
export const passwordRecoverySchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordRecoveryInput = z.infer<typeof passwordRecoverySchema>;

