import { Request, Response } from 'express';
import { loginValidateSchema, registerValidateSchema } from '../validations/authValidators';
import { aj } from '../utils/arcjetConfig';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import { blacklistToken, genJwt } from '../utils/utils';
import { baseError } from '../utils/Errorhandler';
import { isRateLimiterRes, limiterConsecutiveFailsByEmailAndIp, limiterSlowBruteByIp, maxWrongAttemptsByIpParDay } from '../utils/flexRateLimiter';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../lib/prisma';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const registerInput = registerValidateSchema.parse(req.body);

  const decision = await aj.protect(req, {
    email: registerInput.email,
  });

  if (decision.isDenied()) {
    let message;

    if (decision.reason.type?.includes('DISPOSABLE')) {
      message = 'We do not allow disposable email addresses.';
    } else if (decision.reason.type?.includes('FREE')) {
      message = 'We do not allow free email addresses, please use a business address.';
    } else if (decision.reason.type?.includes('NO_MX_RECORDS')) {
      message = 'Your email domain does not have an MX record. Is there a typo?';
    } else if (decision.reason.type?.includes('NO_GRAVATAR')) {
      message = 'We require a Gravatar profile to sign up.';
    } else {
      message = 'Invalid email.';
    }

    return res.status(StatusCodes.FORBIDDEN).json({
      name: getReasonPhrase(StatusCodes.FORBIDDEN),
      message,
    });
  }

  const user = await prisma.users.findUnique({ where: { email: registerInput.email }, select: { email: true } });

  if (user) {
    return res.status(StatusCodes.CONFLICT).json({
      name: getReasonPhrase(StatusCodes.CONFLICT),
      message: 'The email is already registered. Use a different email or reset your password.',
    });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashPass = bcrypt.hashSync(registerInput.password, salt);

  const newUser = await prisma.users.create({ data: { ...registerInput, password: hashPass }, select: { id: true } });

  const token = await genJwt({ id: newUser.id, role: registerInput.role });

  res.status(StatusCodes.OK).json({
    name: getReasonPhrase(StatusCodes.CREATED),
    message: 'User Sign up successfully',
    data: {
      user: {
        id: newUser.id,
        name: registerInput.name,
        email: registerInput.email,
        role: registerInput.role,
        phone: registerInput.phone,
        licenseNumber: registerInput.licenseNumber,
      },
      token,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const ipAddress = req.ip;

  const { email, password } = loginValidateSchema.parse(req.body);

  if (!ipAddress) {
    throw new baseError(getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST, 'IP address is required', true);
  }

  const [resEmailAndIp, resSlowByIp] = await Promise.all([
    limiterConsecutiveFailsByEmailAndIp.get(`${ipAddress}_${email}`),
    limiterSlowBruteByIp.get(ipAddress),
  ]);

  let retrySecs = 0;

  if (resSlowByIp !== null && resSlowByIp.consumedPoints > maxWrongAttemptsByIpParDay) {
    retrySecs = Math.round(resSlowByIp.msBeforeNext / 1000) || 1;

    res.set('Retry-After', String(retrySecs));
  }

  if (retrySecs > 0) {
    return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      message: 'Too many requests. Please try again later.',
      name: getReasonPhrase(StatusCodes.TOO_MANY_REQUESTS),
    });
  }

  const user = await prisma.users.findUnique({ where: { email }, select: { password: true, id: true, role: true } });

  if (!user) {
    try {
      await limiterSlowBruteByIp.consume(ipAddress);
    } catch (error) {
      if (typeof error === 'object' && error !== null) {
        if (isRateLimiterRes(error)) {
          res.set('Retry-After', String(Math.round(error.msBeforeNext / 1000)) || '1');
          return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
            message: 'Too many requests. Please try again later.',
            name: getReasonPhrase(StatusCodes.TOO_MANY_REQUESTS),
          });
        }
      }
      throw error;
    }
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Invalid credentials. Please check your email and password.',
      name: getReasonPhrase(StatusCodes.BAD_REQUEST),
    });
  }

  const decodeHashPass = bcrypt.compareSync(password, user.password);

  if (!decodeHashPass) {
    try {
      await Promise.all([limiterSlowBruteByIp.consume(ipAddress), limiterConsecutiveFailsByEmailAndIp.consume(`${ipAddress}_${email}`)]);
    } catch (error) {
      if (typeof error === 'object' && error !== null) {
        if (isRateLimiterRes(error)) {
          res.set('Retry-After', String(Math.round(error.msBeforeNext / 1000)) || '1');
          return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
            message: 'Too many requests. Please try again later.',
            name: getReasonPhrase(StatusCodes.TOO_MANY_REQUESTS),
          });
        }
      }
      throw error;
    }
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'Invalid credentials. Please check your email and password.',
      name: getReasonPhrase(StatusCodes.UNAUTHORIZED),
    });
  }

  if (resEmailAndIp !== null && resEmailAndIp.consumedPoints > 0) {
    await limiterConsecutiveFailsByEmailAndIp.delete(`${ipAddress}_${email}`);
  }

  const token = await genJwt({ id: user.id, role: user.role });

  res.status(StatusCodes.CREATED).json({
    name: getReasonPhrase(StatusCodes.CREATED),
    message: 'User Sign in successfully',
    data: {
      token,
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'Please authenticate using a valid token',
      name: getReasonPhrase(StatusCodes.UNAUTHORIZED),
    });
  }

  const token = authHeader.split(' ')[1];

  await blacklistToken(token);

  res.status(StatusCodes.OK).json({
    name: getReasonPhrase(StatusCodes.OK),
    message: 'Logged out successfully',
  });
});
