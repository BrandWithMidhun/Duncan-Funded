import * as newsletterService from '../services/newsletterService.js';
import * as contactService from '../services/contactService.js';
import { asyncHandler } from '../lib/helpers.js';
import { subscriberSchema, contactSchema, validate } from '../lib/validation.js';

// ----- Newsletter -----

export const subscribe = asyncHandler(async (req, res) => {
  const input = validate(subscriberSchema, req.body);
  const result = await newsletterService.subscribe(input);
  res.status(result.alreadySubscribed ? 200 : 201).json({
    message: result.alreadySubscribed
      ? "You're already on the Duncan roll."
      : 'Welcome to the clan — your place on the roll is secured.',
    data: result,
  });
});

export const unsubscribe = asyncHandler(async (req, res) => {
  res.json({
    message: 'You have been unsubscribed.',
    data: await newsletterService.unsubscribe(req.params.token),
  });
});

export const listSubscribers = asyncHandler(async (req, res) => {
  res.json(await newsletterService.listSubscribers({ status: req.query.status }));
});

// ----- Contact -----

export const submitContact = asyncHandler(async (req, res) => {
  const input = validate(contactSchema, req.body);
  res.status(201).json({
    message: 'Message received — a member of the Duncan clan will reply shortly.',
    data: await contactService.createMessage(input),
  });
});

export const listMessages = asyncHandler(async (_req, res) => {
  res.json(await contactService.listMessages());
});
