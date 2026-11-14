import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isCloudinaryConfigured } from "@/lib/config";
import { signUpload } from "@/lib/cloudinary";

const FOLDERS = ["avatars", "covers", "logos", "thumbnails"];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!isCloudinaryConfigured()) return NextResponse.json({ error: "Cloudinary non configuré" }, { status: 501 });
  const folder = request.nextUrl.searchParams.get("dossier") ?? "";
  if (!FOLDERS.includes(folder)) return NextResponse.json({ error: "Dossier invalide" }, { status: 400 });
  return NextResponse.json(signUpload(`${folder}/${user.id}`));
}
