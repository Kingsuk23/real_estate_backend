import arcjet, { validateEmail } from '@arcjet/next';
import env from './envConfig';

export const aj = arcjet({
  key: env.ARCJET_KEY as string,
  rules: [
    validateEmail({
      mode: 'LIVE',
      deny: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'],
    }),
  ],
});
