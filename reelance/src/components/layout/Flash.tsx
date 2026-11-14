import { readFlash } from "@/lib/flash";
import { FlashToast } from "@/components/layout/FlashToast";

export async function Flash() {
  const flash = await readFlash();
  if (!flash) return null;
  return <FlashToast key={`${flash.type}:${flash.message}`} type={flash.type} message={flash.message} />;
}
