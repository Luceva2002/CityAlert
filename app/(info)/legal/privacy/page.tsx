import type { Metadata } from 'next';

import { InfoPageShell, InfoSection } from '@/components/InfoPageShell';

export const metadata: Metadata = {
  title: 'Privacy — CityAlert',
};

export default function PrivacyPage() {
  return (
    <InfoPageShell titleKey="profile.account.menu.privacy" subtitle="Ultimo aggiornamento: luglio 2026">
      <InfoSection title="Quali dati raccogliamo">
        <p>
          <strong className="text-hi">Account:</strong> email e username, necessari
          per l&apos;autenticazione.
        </p>
        <p>
          <strong className="text-hi">Segnalazioni:</strong> categoria, descrizione,
          foto (facoltativa) e posizione GPS del problema segnalato.
        </p>
        <p>
          <strong className="text-hi">Posizione:</strong> usata solo al momento
          della segnalazione o per centrare la mappa. Non tracciamo i tuoi spostamenti.
        </p>
      </InfoSection>

      <InfoSection title="Come li usiamo">
        <p>
          I dati servono esclusivamente a far funzionare il servizio: mostrare le segnalazioni
          sulla mappa, attribuirle al tuo profilo e calcolare XP e livelli.
        </p>
        <p>Non vendiamo i tuoi dati né li condividiamo con terze parti per fini pubblicitari.</p>
      </InfoSection>

      <InfoSection title="Dove sono conservati">
        <p>
          I dati sono conservati su Supabase (infrastruttura UE dove disponibile) e protetti da
          row-level security: solo tu puoi modificare i tuoi dati.
        </p>
        <p>Le foto delle segnalazioni sono pubbliche, come la posizione del problema segnalato.</p>
      </InfoSection>

      <InfoSection title="I tuoi diritti">
        <p>
          Ai sensi del GDPR puoi chiedere in qualsiasi momento accesso, rettifica o cancellazione
          dei tuoi dati scrivendo dalla pagina Assistenza. La cancellazione dell&apos;account
          rimuove profilo e dati personali; le segnalazioni possono essere anonimizzate per
          mantenere lo storico civico.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
