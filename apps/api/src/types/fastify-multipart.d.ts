declare module "@fastify/multipart" {
  import type { FastifyPluginAsync } from "fastify";

  export interface MultipartOptions {
    limits?: { fileSize?: number };
  }

  const multipart: FastifyPluginAsync<MultipartOptions>;
  export default multipart;
}
