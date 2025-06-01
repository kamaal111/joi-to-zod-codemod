import Joi from 'joi';

const MINIMUM_YEAR = 1970;

enum Job {
  Developer = 'developer',
  DevOps = 'devops',
  Designer = 'designer',
}

export const employee = Joi.object().keys({
  name: Joi.string().alphanum().min(3).max(30).required(),
  birthyear: Joi.number().integer().min(MINIMUM_YEAR).max(2013),
  job: Joi.string().valid(...Object.values(Job)),
  nickname: Joi.string()
    .required()
    .min(3)
    .max(20)
    .description('Nickname')
    .regex(/^[a-z]+$/, { name: 'alpha', invert: true }),
});
