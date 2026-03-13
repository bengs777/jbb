import { route, type Router } from "@better-upload/server";
import { toRouteHandler } from "@better-upload/server/adapters/next";
import { cloudflare } from "@better-upload/server/clients";

/**
 * Better Upload configuration with Cloudflare R2
 * Environment variables are injected by Yapi at runtime
 */
const router: Router = {
  client: cloudflare({
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  }),
  bucketName: "yapi-app",
  routes: {
    // Image uploads route
    images: route({
      fileTypes: ["image/*"],
      multipleFiles: true,
      maxFiles: 10,
      maxFileSize: 1024 * 1024 * 5, // 5MB per file
      onBeforeUpload: async () => {
        // Generate unique key prefix for this project
        const uploadId = crypto.randomUUID();
        return {
          generateObjectInfo: ({ file }) => ({
            key: `projects/01nNCdEf8Jn25xrx_H_1r/uploads/${uploadId}-${file.name}`,
          }),
        };
      },
    }),
    // Single avatar/profile image route
    avatar: route({
      fileTypes: ["image/*"],
      maxFileSize: 1024 * 1024 * 2, // 2MB max for avatars
      onBeforeUpload: async () => {
        const uploadId = crypto.randomUUID();
        return {
          generateObjectInfo: ({ file }) => ({
            key: `projects/01nNCdEf8Jn25xrx_H_1r/avatars/${uploadId}-${file.name}`,
          }),
        };
      },
    }),
    // Documents route (PDFs, etc.)
    documents: route({
      fileTypes: ["application/pdf", "image/*"],
      multipleFiles: true,
      maxFiles: 5,
      maxFileSize: 1024 * 1024 * 10, // 10MB per document
      onBeforeUpload: async () => {
        const uploadId = crypto.randomUUID();
        return {
          generateObjectInfo: ({ file }) => ({
            key: `projects/01nNCdEf8Jn25xrx_H_1r/documents/${uploadId}-${file.name}`,
          }),
        };
      },
    }),
  },
};

export const { POST } = toRouteHandler(router);
