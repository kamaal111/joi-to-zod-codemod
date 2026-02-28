import Joi from 'joi';

export const userSchema = Joi.object().keys({
  name: Joi.string().min(2).max(50).required(),
  age: Joi.number().integer().min(0).max(150),
  email: Joi.string().required(),
});
