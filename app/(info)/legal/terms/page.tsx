import type { Metadata } from 'next';

import { InfoPageShell, InfoSection } from '@/components/InfoPageShell';

export const metadata: Metadata = {
  title: 'Termini e condizioni — CityAlert',
};

export default function TermsPage() {
  return (
    <InfoPageShell titleKey="profile.account.menu.terms" subtitle="Ultimo aggiornamento: luglio 2026">
      <InfoSection title="1. Il servizio">
        <p>
          CityAlert è una piattaforma di segnalazione civica che permette ai cittadini di
          comunicare in tempo reale problemi urbani — buche, fontanelle guaste, erba alta,
          lampioni spenti, incendi e altro — al proprio comune e alla comunità.
        </p>
        <p>
          Le segnalazioni inviate sono visibili pubblicamente sulla mappa a tutti gli utenti
          della piattaforma.
        </p>
      </InfoSection>

      <InfoSection title="2. Account e responsabilità">
        <p>
          Per inviare segnalazioni è necessario un account. Sei responsabile della correttezza
          delle informazioni che pubblichi: segnalazioni false, offensive o ingannevoli possono
          comportare la sospensione dell&apos;account.
        </p>
        <p>
          Le foto caricate non devono ritrarre persone riconoscibili, targhe o dati personali di
          terzi.
        </p>
      </InfoSection>

      <InfoSection title="3. Uso corretto">
        <p>
          CityAlert non sostituisce i numeri di emergenza. Per situazioni di pericolo immediato
          contatta sempre il 112.
        </p>
        <p>
          È vietato usare la piattaforma per scopi diversi dalla segnalazione civica, inclusi
          spam, pubblicità o contenuti illeciti.
        </p>
      </InfoSection>

      <InfoSection title="4. Punti e ricompense">
        <p>
          XP, monete e livelli sono elementi di gamification senza valore monetario. Possono
          essere modificati o azzerati in qualsiasi momento per esigenze tecniche o di
          correttezza.
        </p>
      </InfoSection>

      <InfoSection title="5. Limitazione di responsabilità">
        <p>
          Il servizio è fornito &quot;così com&apos;è&quot;. Non garantiamo che ogni segnalazione
          venga presa in carico dall&apos;amministrazione competente né tempi certi di
          risoluzione.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
