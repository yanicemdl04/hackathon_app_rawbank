import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const PAGES = {
  'presse': {
    tag: 'Presse',
    title: <>L'actualité <em>Rawbank</em> dans les médias.</>,
    intro: "Communiqués officiels, kit média et contacts presse de la première banque de la RDC.",
    items: [
      { h: 'Rawbank franchit les 2 millions de clients', p: "Kinshasa, 2024 — Une étape historique pour l'inclusion financière en République Démocratique du Congo." },
      { h: "Lancement de la détection de fraude par IA", p: "Le nouveau moteur d'analyse en temps réel protège chaque transaction en moins de 150 millisecondes." },
      { h: 'Rawbank élue « Banque de l\'année RDC »', p: 'The Banker récompense la stratégie digitale et la solidité financière du groupe.' },
    ],
    cta: { label: 'Contacter le service presse', to: '/contact' },
  },
  'carrieres': {
    tag: 'Carrières',
    title: <>Construisez l'avenir de la <em>banque africaine</em>.</>,
    intro: "Plus de 2 000 collaborateurs façonnent chaque jour la finance de demain. Rejoignez-les.",
    items: [
      { h: 'Ingénieur Machine Learning — Kinshasa', p: 'Renforcez notre moteur de détection de fraude temps réel. CDI, hybride.' },
      { h: 'Chargé de clientèle Premium — Lubumbashi', p: 'Accompagnez nos clients à haute valeur dans leurs projets. CDI.' },
      { h: 'Product Designer — Digital Banking', p: "Dessinez l'expérience bancaire mobile de 2 millions de clients. CDI, Kinshasa." },
    ],
    cta: { label: 'Envoyer une candidature', to: '/contact' },
  },
  'partenaires': {
    tag: 'Partenaires',
    title: <>Un écosystème <em>mondial</em> de confiance.</>,
    intro: 'Rawbank collabore avec les plus grands réseaux financiers pour connecter la RDC au monde.',
    items: [
      { h: 'Visa & Mastercard', p: 'Émission de cartes internationales acceptées dans plus de 200 pays.' },
      { h: 'SWIFT', p: 'Transferts internationaux sécurisés vers plus de 11 000 institutions.' },
      { h: 'Mobile Money — M-Pesa, Orange Money, Airtel', p: 'Interopérabilité totale avec les portefeuilles mobiles de la région.' },
    ],
    cta: { label: 'Devenir partenaire', to: '/contact' },
  },
  'investisseurs': {
    tag: 'Investisseurs',
    title: <>Une croissance <em>solide et durable</em>.</>,
    intro: 'Résultats financiers, rapports annuels et gouvernance de Rawbank S.A.',
    items: [
      { h: '$8 milliards d\'actifs sous gestion', p: 'Un bilan en croissance continue depuis 25 ans, leader du marché congolais.' },
      { h: 'Notation et conformité', p: 'Supervisée par la Banque Centrale du Congo, conforme aux standards Bâle II.' },
      { h: 'Rapport annuel 2024', p: 'Performance record portée par la banque digitale et le segment entreprises.' },
    ],
    cta: { label: 'Contacter les relations investisseurs', to: '/contact' },
  },
  'securite': {
    tag: 'Sécurité',
    title: <>Votre argent, protégé <em>24h/24</em>.</>,
    intro: 'Chiffrement de niveau bancaire, IA anti-fraude et authentification forte sur chaque opération.',
    items: [
      { h: 'Détection de fraude par IA', p: 'Chaque transaction est analysée en temps réel : montant, localisation, appareil, fréquence. Score de risque en moins de 150 ms.' },
      { h: 'Authentification OTP', p: 'Toute opération sensible est confirmée par un code à usage unique envoyé sur votre téléphone.' },
      { h: 'Gel préventif du compte', p: 'En cas de signalement de fraude, votre compte est immédiatement protégé le temps de l\'enquête.' },
    ],
    cta: { label: 'Tester la détection de fraude', to: '/nouvelle-transaction' },
  },
  'ussd': {
    tag: 'USSD *334#',
    title: <>La banque sans <em>internet</em>.</>,
    intro: 'Composez *334# depuis n\'importe quel téléphone pour accéder à vos comptes, sans connexion.',
    items: [
      { h: 'Consulter votre solde', p: 'Tapez *334*1# — disponible 24h/24 sur tous les réseaux congolais.' },
      { h: 'Transférer de l\'argent', p: 'Tapez *334*2# et suivez les instructions. Transfert instantané et sécurisé par code PIN.' },
      { h: 'Recharger du crédit', p: 'Tapez *334*3# pour recharger votre téléphone directement depuis votre compte.' },
    ],
    cta: { label: 'Besoin d\'aide ?', to: '/contact' },
  },
  'agences': {
    tag: 'Agences',
    title: <>Plus de <em>500 points</em> de contact.</>,
    intro: 'Agences, guichets et distributeurs automatiques dans toutes les provinces de la RDC.',
    items: [
      { h: 'Kinshasa — Siège social', p: '3487, Boulevard du 30 Juin, Gombe. Lun–Ven 8h00–16h00, Sam 8h30–12h00.' },
      { h: 'Lubumbashi, Goma, Matadi, Kisangani…', p: 'Un réseau national en expansion continue, au plus proche de nos clients.' },
      { h: 'Distributeurs automatiques', p: 'Retraits en USD et CDF, dépôts et consultation de solde, 24h/24.' },
    ],
    cta: { label: 'Voir la carte interactive', to: '/carte' },
  },
  'application-mobile': {
    tag: 'Application mobile',
    title: <>Rawbank dans votre <em>poche</em>.</>,
    intro: 'Notée 4.9/5 — l\'application bancaire la plus complète de la RDC, sur iOS et Android.',
    items: [
      { h: 'Transferts instantanés', p: 'Envoyez de l\'argent en RDC et à l\'international en quelques secondes.' },
      { h: 'Notifications temps réel', p: 'Chaque mouvement sur votre compte vous est notifié instantanément, avec score de risque IA.' },
      { h: 'Gestion de cartes', p: 'Bloquez, débloquez et paramétrez vos plafonds de carte en un geste.' },
    ],
    cta: { label: 'Ouvrir un compte', to: '/connexion' },
  },
  'api': {
    tag: 'Documentation API',
    title: <>Construisez avec <em>l'API Rawbank</em>.</>,
    intro: 'Une API REST moderne pour intégrer paiements, comptes et scoring anti-fraude à vos applications.',
    items: [
      { h: 'POST /transactions', p: 'Créez une transaction et recevez son score de risque IA en temps réel (< 150 ms).' },
      { h: 'GET /transactions/:id/trace', p: 'Traçabilité complète : adresse IP, empreinte appareil, historique utilisateur.' },
      { h: 'Webhooks temps réel', p: 'transaction:scored, account:frozen, dispute:opened — abonnez-vous aux événements de votre compte.' },
    ],
    cta: { label: 'Demander un accès développeur', to: '/contact' },
  },
  'actualites': {
    tag: 'Actualités',
    title: <>Ce qui bouge chez <em>Rawbank</em>.</>,
    intro: 'Produits, innovation et engagement : toute l\'actualité de la banque.',
    items: [
      { h: 'Nouveau : déclaration de voyage', p: 'Déclarez vos déplacements à l\'étranger pour éviter tout blocage de vos transactions internationales.' },
      { h: 'Le dashboard IA ouvre ses portes', p: 'Suivez en direct les performances du modèle de détection de fraude : scores, blocages, faux positifs.' },
      { h: 'Signalement de fraude en 1 clic', p: 'Une transaction suspecte ? Signalez-la depuis son détail, votre compte est protégé immédiatement.' },
    ],
    cta: { label: 'Découvrir nos solutions', to: '/solutions' },
  },
  'confidentialite': {
    tag: 'Confidentialité',
    title: <>Vos données vous <em>appartiennent</em>.</>,
    intro: 'Politique de confidentialité de Rawbank S.A. — dernière mise à jour : janvier 2024.',
    items: [
      { h: 'Collecte des données', p: 'Nous collectons uniquement les données nécessaires à la fourniture de nos services bancaires : identité, coordonnées, historique de transactions.' },
      { h: 'Utilisation', p: 'Vos données servent à sécuriser vos opérations (détection de fraude), respecter nos obligations légales et améliorer nos services. Jamais de revente à des tiers.' },
      { h: 'Vos droits', p: 'Accès, rectification, suppression : exercez vos droits à tout moment auprès de notre délégué à la protection des données.' },
    ],
    cta: { label: 'Exercer mes droits', to: '/contact' },
  },
  'conditions': {
    tag: 'Conditions générales',
    title: <>Nos engagements, <em>en toute clarté</em>.</>,
    intro: 'Conditions générales d\'utilisation des services Rawbank — version en vigueur.',
    items: [
      { h: 'Ouverture de compte', p: 'Accessible à toute personne majeure munie d\'une pièce d\'identité valide. Ouverture gratuite en agence ou en ligne.' },
      { h: 'Tarification', p: 'Les frais applicables sont détaillés dans la brochure tarifaire, disponible en agence et sur demande.' },
      { h: 'Résiliation', p: 'Vous pouvez clôturer votre compte à tout moment, sans frais, sur simple demande écrite.' },
    ],
    cta: { label: 'Une question ?', to: '/contact' },
  },
  'cookies': {
    tag: 'Cookies',
    title: <>Une navigation <em>transparente</em>.</>,
    intro: 'Comment et pourquoi nous utilisons des cookies sur nos services digitaux.',
    items: [
      { h: 'Cookies essentiels', p: 'Indispensables au fonctionnement du site : session, sécurité, authentification. Toujours actifs.' },
      { h: 'Cookies de mesure', p: 'Statistiques anonymes de fréquentation pour améliorer l\'expérience. Désactivables à tout moment.' },
      { h: 'Aucun cookie publicitaire', p: 'Rawbank ne pratique aucun ciblage publicitaire sur ses plateformes bancaires.' },
    ],
    cta: { label: 'En savoir plus', to: '/infos/confidentialite' },
  },
  'conformite': {
    tag: 'Conformité',
    title: <>Régulée, auditée, <em>certifiée</em>.</>,
    intro: 'Rawbank opère sous la supervision de la Banque Centrale du Congo et des standards internationaux.',
    items: [
      { h: 'Lutte anti-blanchiment (LAB/FT)', p: 'Dispositif complet de connaissance client (KYC) et de surveillance des transactions conformes aux normes GAFI.' },
      { h: 'Supervision BCC', p: 'Licence bancaire complète délivrée et contrôlée par la Banque Centrale du Congo.' },
      { h: 'Audits indépendants', p: 'États financiers audités annuellement par des cabinets internationaux de premier plan.' },
    ],
    cta: { label: 'Contacter la conformité', to: '/contact' },
  },
}

const FALLBACK = {
  tag: 'Rawbank',
  title: <>Page en <em>construction</em>.</>,
  intro: 'Ce contenu arrive bientôt. En attendant, notre équipe reste à votre disposition.',
  items: [],
  cta: { label: 'Retour à l\'accueil', to: '/' },
}

export default function Info() {
  const { slug } = useParams()
  const page = PAGES[slug] || FALLBACK

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.registerPlugin(ScrollTrigger)
      document.querySelectorAll('.reveal').forEach(el => {
        gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
      })
    })
    return () => ctx.revert()
  }, [slug])

  return (
    <>
      <section className="page-hero">
        <div className="mesh-bg">
          <div className="mesh-orb" style={{width:600,height:600,background:'rgba(238,146,33,.1)',top:'-30%',right:'-15%'}}></div>
          <div className="mesh-orb" style={{width:400,height:400,background:'rgba(28,63,113,.06)',bottom:'-20%',left:'-10%'}}></div>
        </div>
        <div style={{position:'relative',zIndex:1,maxWidth:700,margin:'0 auto'}}>
          <span className="section-tag">{page.tag}</span>
          <h1 className="section-h2" style={{fontSize:'clamp(2.2rem,4vw,3.8rem)',marginBottom:20}}>{page.title}</h1>
          <p className="section-sub" style={{margin:'0 auto'}}>{page.intro}</p>
        </div>
      </section>

      {page.items.length > 0 && (
        <section style={{padding:'90px 0',background:'#F7F8FF'}}>
          <div className="section-inner reveal" style={{maxWidth:820}}>
            <div style={{display:'flex',flexDirection:'column',gap:20}}>
              {page.items.map((item, i) => (
                <div key={i} className="info-card" style={{padding:'26px 28px'}}>
                  <div className="glass-icon" style={{width:44,height:44,borderRadius:12}}>
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <div className="info-card-title" style={{fontSize:'1rem',marginBottom:6}}>{item.h}</div>
                    <div className="info-card-text" style={{fontSize:'.88rem',lineHeight:1.7}}>{item.p}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section style={{padding:'90px 0',background:'var(--beige)'}}>
        <div className="section-inner reveal" style={{textAlign:'center'}}>
          <h2 className="section-h2" style={{fontSize:'clamp(1.6rem,2.6vw,2.4rem)'}}>Nous sommes là pour <em>vous</em>.</h2>
          <p className="section-sub" style={{margin:'0 auto 36px'}}>Une question sur ce sujet ? Notre équipe vous répond en moins de 24 heures.</p>
          <Link to={page.cta.to} className="btn-primary" style={{display:'inline-block',textDecoration:'none',fontSize:'.85rem',padding:'14px 36px'}}>
            {page.cta.label}
          </Link>
        </div>
      </section>
    </>
  )
}
