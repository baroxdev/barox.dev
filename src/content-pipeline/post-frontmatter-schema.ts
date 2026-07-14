import { z } from 'zod'

export const postFrontmatterSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
  title: z.string().min(1, 'title must not be empty'),
  date: z.coerce.date({ error: 'date must be a valid date' }),
  tags: z.array(z.string().min(1, 'tags must not contain empty strings')),
  published: z.boolean(),
})

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>
