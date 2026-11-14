import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

/** Modèle de conditions à faire valider par un juriste avant la mise en ligne. */
export default async function TermsPage() {
  const s = await getSettings();
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Conditions d&apos;utilisation</h1>
      <p className="mt-2 text-sm text-ink-500">Document de travail — à compléter et faire valider avant la mise en production.</p>
      <div className="mt-8 space-y-6 leading-relaxed text-ink-700">
        <section>
          <h2 className="text-lg font-bold text-ink-900">1. Objet</h2>
          <p className="mt-2">Reelance met en relation des entreprises (clients) et des monteurs vidéo indépendants (freelances), via l&apos;achat de services à prix fixe ou la publication de missions.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink-900">2. Paiement sécurisé (séquestre)</h2>
          <p className="mt-2">
            Le client règle la commande via FedaPay. Les fonds sont conservés par Reelance jusqu&apos;à la validation de la livraison par le client. Sans réponse du client {s.autoCompleteDays} jours après une livraison, celle-ci est réputée validée.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink-900">3. Commission</h2>
          <p className="mt-2">Reelance retient une commission de {s.commissionRateBps / 100} % sur le montant reversé au freelance. Le client paie le prix affiché, sans frais supplémentaires.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink-900">4. Litiges</h2>
          <p className="mt-2">En cas de désaccord, le client ou le freelance peut ouvrir un litige. L&apos;équipe Reelance examine la commande et décide de reverser les fonds au freelance ou de rembourser le client.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-ink-900">5. Devises</h2>
          <p className="mt-2">Les prix sont fixés en francs CFA (XOF). Les montants affichés dans une autre devise sont indicatifs ; le paiement est débité en FCFA.</p>
        </section>
      </div>
    </div>
  );
}
