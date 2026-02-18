import { z } from "zod";

export const uploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().regex(/^image\//),
});

export type UploadRequest = z.infer<typeof uploadSchema>;
