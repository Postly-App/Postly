import {
  createUploadthing,
  type FileRouter,
  UTFiles,
} from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  classifyUploadKindFromClientMeta,
  logUploadValidationFailure,
  MediaValidationError,
  normalizeUploadFilename,
  throwUploadThingValidation,
  validateUploadFileInit,
  verifyRemoteUploadMagicBytes,
} from "@/lib/uploads/validation";
import { checkCanUpload } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

const f = createUploadthing({
  errorFormatter: (err) => ({
    message: err.message,
    code: err.code,
  }),
});

export const ourFileRouter = {
  mediaUploader: f({
    // Limites UploadThing (puissances de 2). Quotas métier stricts : 10 Mo image / 100 Mo vidéo
    // dans `src/lib/uploads/validation.ts`.
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    video: { maxFileSize: "128MB", maxFileCount: 5 },
  })
    .middleware(async ({ files }) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new UploadThingError("UNAUTHORIZED");
      }

      const totalIncomingBytes = files.reduce((sum, f) => sum + (f.size ?? 0), 0);
      const quotaCheck = await checkCanUpload(session.user.id, totalIncomingBytes);
      if (!quotaCheck.allowed) {
        logUploadValidationFailure("middleware", quotaCheck.reason);
        throw new UploadThingError({
          code: "BAD_REQUEST",
          message: quotaCheck.reason,
        });
      }

      const mapped = files.map((file) => {
        const name = normalizeUploadFilename(file.name);
        try {
          validateUploadFileInit({
            name,
            size: file.size,
            type: file.type,
          });
        } catch (e) {
          if (e instanceof MediaValidationError) {
            logUploadValidationFailure("middleware", e.message);
            throwUploadThingValidation(e.message);
          }
          throw e;
        }
        return { ...file, name };
      });

      return {
        userId: session.user.id,
        [UTFiles]: mapped,
      };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const name = normalizeUploadFilename(file.name);
      try {
        const kind = classifyUploadKindFromClientMeta({
          name,
          size: file.size,
          type: file.type,
        });
        await verifyRemoteUploadMagicBytes(file.ufsUrl, kind);

        // Incrémente le compteur de stockage (best-effort, ne bloque pas l'upload)
        if (metadata?.userId && file.size) {
          await prisma.user
            .update({
              where: { id: metadata.userId },
              data: { storageBytes: { increment: BigInt(file.size) } },
            })
            .catch(() => {
              /* observabilité optionnelle, l'upload reste valide */
            });
        }
      } catch (e) {
        if (e instanceof MediaValidationError) {
          logUploadValidationFailure("onUploadComplete", e.message);
          throw new UploadThingError({
            code: "BAD_REQUEST",
            message: e.message,
          });
        }
        logUploadValidationFailure("onUploadComplete", "erreur interne");
        throw new UploadThingError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Vérification du fichier après upload impossible.",
        });
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
