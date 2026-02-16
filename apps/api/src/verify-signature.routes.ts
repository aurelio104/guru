/**
 * Verificación de firma / integridad: validar hash de datos.
 * POST /api/verify-signature con body { data, expectedHash, algorithm? }
 */
import type { FastifyInstance } from "fastify";
import { createHash } from "crypto";

export async function registerVerifySignatureRoutes(app: FastifyInstance): Promise<void> {
  app.post<{
    Body: { data?: string; expectedHash?: string; algorithm?: string };
  }>("/api/verify-signature", async (request, reply) => {
    const { data, expectedHash, algorithm = "sha256" } = request.body ?? {};
    if (typeof data !== "string" || typeof expectedHash !== "string") {
      return reply.status(400).send({
        ok: false,
        error: "Body requiere: data (string), expectedHash (string). Opcional: algorithm (sha256, sha384, sha512).",
      });
    }
    const algo = algorithm.toLowerCase();
    if (!["sha256", "sha384", "sha512"].includes(algo)) {
      return reply.status(400).send({
        ok: false,
        error: "algorithm debe ser sha256, sha384 o sha512.",
      });
    }
    const hash = createHash(algo).update(data, "utf8").digest("hex");
    const valid = hash.toLowerCase() === expectedHash.toLowerCase();
    return reply.status(200).send({
      ok: true,
      valid,
      computedHash: hash,
    });
  });
}
