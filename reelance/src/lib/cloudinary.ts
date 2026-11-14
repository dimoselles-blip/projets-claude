import "server-only";
import { createHash } from "node:crypto";
import { config } from "@/lib/config";

/**
 * Signature d'upload Cloudinary (upload direct depuis le navigateur, sans faire transiter le fichier par le serveur).
 * https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
 */
export function signUpload(subfolder: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `${config.cloudinary.folder}/${subfolder}`.replace(/\/+/g, "/");
  const params = { folder, timestamp: String(timestamp) };
  const toSign = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + config.cloudinary.apiSecret).digest("hex");
  return {
    cloudName: config.cloudinary.cloudName,
    apiKey: config.cloudinary.apiKey,
    folder,
    timestamp,
    signature,
  };
}
