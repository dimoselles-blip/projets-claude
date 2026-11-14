import {
  Briefcase,
  Clapperboard,
  Film,
  Heart,
  Megaphone,
  MonitorPlay,
  Music,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";

/** Icônes disponibles pour les catégories (champ `icon` de la table Category). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  youtube: MonitorPlay,
  corporate: Briefcase,
  social: Megaphone,
  wedding: Heart,
  music: Music,
  motion: Sparkles,
  film: Film,
  video: Video,
};

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && CATEGORY_ICONS[name]) || Clapperboard;
  return <Icon className={className} aria-hidden />;
}
