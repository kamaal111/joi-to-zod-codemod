import z from "zod";

import { MAX_YEAR } from './other-source';

const MINIMUM_YEAR = 1970;

enum Job {
  Developer = 'developer',
  DevOps = 'devops',
  Designer = 'designer',
}

export const employee = z.object({
  name: z.string().regex(/^[a-z0-9]+$/).min(3).max(30),
  birthyear: z.number().int().min(MINIMUM_YEAR).max(MAX_YEAR).optional(),
  job: z.enum([...Object.values(Job) as [string, ...Array<string>]]).optional(),
  nickname: z.string()
    .min(3)
    .max(20)
    .describe('Nickname')
    .regex(/^[a-z]+$/),
}).strict();
