import z from 'zod';

export const registerValidateSchema = z
  .object({
    name: z
      .string({ message: 'Name is required' })
      .min(3, { message: 'Name must be at least 3 characters long' })
      .max(16, { message: 'Name must be fewer than 16 characters' }),

    email: z.string({ message: 'Email is required' }).email({ message: 'Enter a valid email address' }),

    password: z.string({ message: 'Password is required' }).min(8, { message: 'Password must be at least 8 characters long' }),

    role: z.enum(['USER', 'AGENT', 'ADMIN'], { message: 'Role is needed' }).default('USER'),

    phone: z
      .string({ message: 'Phone number is required' })
      .regex(/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/, { message: 'Invalid phone number' }),

    licenseNumber: z.string({ message: 'License number is required' }),
  })
  .superRefine(({ password }, check_pass_complexity) => {
    const contain_uppercase = (ch: string) => /[A-Z]/.test(ch);
    const contain_lowercase = (ch: string) => /[a-z]/.test(ch);
    const contain_spacial_char = (ch: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(ch);

    let count_of_uppercase = 0,
      count_of_lowercase = 0,
      count_of_number = 0,
      count_of_spacial_char = 0;

    for (const ch of password) {
      if (!isNaN(+ch)) count_of_number++;
      else if (contain_uppercase(ch)) count_of_uppercase++;
      else if (contain_lowercase(ch)) count_of_lowercase++;
      else if (contain_spacial_char(ch)) count_of_spacial_char++;
    }
    if (count_of_uppercase < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'Password must contain at least one uppercase letter',
      });
    }

    if (count_of_lowercase < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'Password must contain at least one lowercase letter',
      });
    }

    if (count_of_spacial_char < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'Password must contain at least one special character',
      });
    }

    if (count_of_number < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'Password must contain at least one number',
      });
    }
  });

export const loginValidateSchema = z.object({
  email: z.string({ message: 'Email is required' }).email({ message: 'Enter a valid email address' }),

  password: z.string({ message: 'Password is required' }),
});
