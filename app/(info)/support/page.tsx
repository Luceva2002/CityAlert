import type { Metadata } from 'next';
import { Mail, MessageCircleQuestion, Siren } from 'lucide-react';

import { InfoPageShell, InfoSection } from '@/components/InfoPageShell';

export const metadata: Metadata = {
  title: 'Assistenza — CityAlert',
};

export default function SupportPage() {
  return (
    <InfoPageShell
      titleKey="profile.account.menu.support"
      subtitle="Siamo qui per aiutarti. Rispondiamo di solito entro 48 ore."
    >
      <a
        href="mailto:supporto@cityalert.app?subject=Richiesta%20assistenza%20CityAlert"
        className="glass-heavy rounded-3xl px-6 py-5 flex items-center gap-4 hover:bg-white/90 active:scale-[0.99] transition-all"
      >
        <span className="w-12 h-12 rounded-2xl bg-linear-to-b from-gold-400 to-gold-600 flex items-center justify-center shrink-0 shadow-[0_6px_18px_rgba(245,179,1,0.35)]">
          <Mail className="w-6 h-6 text-(--on-gold)" />
        </span>
        <span>
          <span
            className="block text-base font-bold text-hi"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Scrivici una email
          </span>
          <span className="block text-sm text-mid mt-0.5">
            supporto@cityalert.app
          </span>
        </span>
      </a>

      <div className="glass rounded-3xl px-6 py-5 flex items-start gap-4 border-l-4 border-l-danger">
        <Siren className="w-6 h-6 text-danger shrink-0 mt-0.5" />
        <p className="text-sm leading-relaxed text-mid">
          <strong className="text-hi">Emergenze:</strong> CityAlert non sostituisce
          i servizi di soccorso. In caso di pericolo immediato chiama il{' '}
          <strong className="text-hi">112</strong>.
        </p>
      </div>

      <InfoSection title="Domande frequenti">
        <div className="space-y-4">
          <div>
            <p className="font-bold text-hi flex items-center gap-2">
              <MessageCircleQuestion className="w-4 h-4 text-gold-600" />
              La mia segnalazione non appare sulla mappa
            </p>
            <p className="mt-1">
              Verifica la connessione e ricarica la pagina: le segnalazioni compaiono in tempo
              reale appena salvate.
            </p>
          </div>
          <div>
            <p className="font-bold text-hi flex items-center gap-2">
              <MessageCircleQuestion className="w-4 h-4 text-gold-600" />
              Il GPS non trova la mia posizione
            </p>
            <p className="mt-1">
              Controlla che il browser abbia il permesso di accedere alla posizione nelle
              impostazioni del telefono e che il GPS sia attivo.
            </p>
          </div>
          <div>
            <p className="font-bold text-hi flex items-center gap-2">
              <MessageCircleQuestion className="w-4 h-4 text-gold-600" />
              Come cambio username o password?
            </p>
            <p className="mt-1">
              Vai su Profilo → Impostazioni account: da lì puoi modificare username e password.
            </p>
          </div>
          <div>
            <p className="font-bold text-hi flex items-center gap-2">
              <MessageCircleQuestion className="w-4 h-4 text-gold-600" />
              Come vengono assegnati XP e monete?
            </p>
            <p className="mt-1">
              Ogni segnalazione valida assegna XP e monete. Salendo di livello sblocchi nuovi
              traguardi nel profilo.
            </p>
          </div>
        </div>
      </InfoSection>
    </InfoPageShell>
  );
}
