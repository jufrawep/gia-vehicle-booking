/**
 * @file  i18n/index.ts
 * @desc  Lightweight i18n system (FR / EN) avec Context React.
 *
 * IMPORTANT: le changement de langue est instantané sur TOUS les composants
 * car `lang` est stocké dans un Context global et non dans un état local.
 *
 * Setup (une seule fois dans App.tsx) :
 *   <LangProvider><App /></LangProvider>
 *
 * Usage dans n'importe quel composant :
 *   const { t, lang, setLang } = useTranslation();
 */

import {
  createContext, useContext, useState, useCallback,
  ReactNode, useMemo,
} from 'react';

export type Lang = 'fr' | 'en';

// ─── Translations ─────────────────────────────────────────────────────────────

const translations = {
  fr: {
    // Navigation
    'nav.vehicles':   'Véhicules',
    'nav.dashboard':  'Tableau de bord',
    'nav.login':      'Connexion',
    'nav.register':   'S\'inscrire',
    'nav.logout':     'Déconnexion',
    'nav.admin':      'Administrateur',

    // Auth — Login
    'auth.login.title':         'Connexion',
    'auth.login.subtitle':      'Accédez à votre compte',
    'auth.login.email':         'Adresse email',
    'auth.login.password':      'Mot de passe',
    'auth.login.submit':        'Se connecter',
    'auth.login.loading':       'Connexion...',
    'auth.login.forgot':        'Mot de passe oublié ?',
    'auth.login.no_account':    'Pas encore de compte ?',
    'auth.login.register_link': 'S\'inscrire',
    'auth.login.test_title':    'Comptes de test',

    // Auth — Register
    'auth.register.title':          'Inscription',
    'auth.register.subtitle':       'Créez votre compte gratuitement',
    'auth.register.firstname':      'Prénom',
    'auth.register.lastname':       'Nom',
    'auth.register.email':          'Adresse email',
    'auth.register.phone':          'Téléphone (optionnel)',
    'auth.register.password':       'Mot de passe',
    'auth.register.confirm':        'Confirmer le mot de passe',
    'auth.register.submit':         'S\'inscrire',
    'auth.register.loading':        'Inscription...',
    'auth.register.has_account':    'Vous avez déjà un compte ?',
    'auth.register.login_link':     'Se connecter',

    // Auth — Forgot Password
    'auth.forgot.title':          'Mot de passe oublié',
    'auth.forgot.subtitle':       'Entrez votre email pour recevoir un lien de réinitialisation',
    'auth.forgot.email':          'Adresse email',
    'auth.forgot.submit':         'Envoyer le lien',
    'auth.forgot.loading':        'Envoi...',
    'auth.forgot.back':           'Retour à la connexion',
    'auth.forgot.success.title':  'Email envoyé !',
    'auth.forgot.success.body':   'Vérifiez votre boîte de réception et vos spams.',

    // Auth — Reset Password
    'auth.reset.title':           'Réinitialiser le mot de passe',
    'auth.reset.subtitle':        'Choisissez un nouveau mot de passe sécurisé',
    'auth.reset.new':             'Nouveau mot de passe',
    'auth.reset.confirm':         'Confirmer',
    'auth.reset.submit':          'Réinitialiser',
    'auth.reset.loading':         'Réinitialisation...',
    'auth.reset.invalid.title':   'Lien invalide',
    'auth.reset.invalid.body':    'Ce lien est invalide ou a expiré (validité : 1 heure).',
    'auth.reset.invalid.cta':     'Demander un nouveau lien',
    'auth.reset.back':            'Retour à la connexion',

    // Vehicles
    'vehicles.title':             'Notre Flotte',
    'vehicles.subtitle':          'Choisissez parmi nos véhicules disponibles',
    'vehicles.filter.title':      'Affiner la recherche',
    'vehicles.filter.category':   'Catégorie',
    'vehicles.filter.gearbox':    'Boîte',
    'vehicles.filter.fuel':       'Carburant',
    'vehicles.filter.min_price':  'Prix Min',
    'vehicles.filter.max_price':  'Prix Max',
    'vehicles.filter.all_cat':    'Toutes',
    'vehicles.filter.all_trans':  'Toutes',
    'vehicles.filter.all_fuel':   'Tous',
    'vehicles.filter.all':        'Toutes catégories',
    'vehicles.filter.apply':      'Appliquer',
    'vehicles.filter.reset':      'Réinitialiser',
    'vehicles.no_results':        'Aucun véhicule trouvé',
    'vehicles.no_results.cta':    'Voir tout le catalogue',
    'vehicles.per_day':           '/ jour',
    'vehicles.book':              'Réserver',
    'vehicles.details':           'Voir les détails',
    'vehicles.available':         'Disponible',
    'vehicles.unavailable':       'Indisponible',
    'vehicles.results.singular':  'résultat trouvé',
    'vehicles.results.plural':    'résultats trouvés',
    'vehicles.cat.economy':       'Économique',
    'vehicles.cat.comfort':       'Confort',
    'vehicles.cat.luxury':        'Luxe',
    'vehicles.trans.automatic':   'Automatique',
    'vehicles.trans.manual':      'Manuelle',
    'vehicles.fuel.petrol':       'Essence',
    'vehicles.fuel.diesel':       'Diesel',
    'vehicles.fuel.electric':     'Électrique',
    'vehicles.fuel.hybrid':       'Hybride',

    // VehicleDetails
    'vehicle.not_found':          'Véhicule introuvable',
    'vehicle.year':               'Année',
    'vehicle.seats':              'Places',
    'vehicle.seats.label':        'Sièges',
    'vehicle.gearbox':            'Boîte',
    'vehicle.fuel':               'Énergie',
    'vehicle.plate':              'Immat.',
    'vehicle.features':           'Caractéristiques',
    'vehicle.pick_date':          'Choisir une date',
    'vehicle.note':               'Un permis de conduire valide et un dépôt de garantie sont requis lors du retrait.',
    'vehicle.status.AVAILABLE':   'Disponible',
    'vehicle.status.RENTED':      'Loué',
    'vehicle.status.MAINTENANCE': 'Maintenance',
    'vehicle.status.UNAVAILABLE': 'Indisponible',

    // Booking
    'booking.title':              'Réserver ce véhicule',
    'booking.start':              'Date de départ',
    'booking.end':                'Date de retour',
    'booking.notes':              'Notes (optionnel)',
    'booking.notes.placeholder':  'Besoin d\'un chauffeur ? Un siège bébé ?',
    'booking.duration':           'Durée',
    'booking.days':               'jours',
    'booking.rate':               'Tarif / Jour',
    'booking.total':              'Total estimé',
    'booking.submit':             'Confirmer la réservation',
    'booking.loading':            'Réservation...',
    'booking.login_required':     'Connectez-vous pour continuer votre réservation',
    'booking.select_dates':       'Sélectionnez des dates valides',
    'booking.status.PENDING':     'En attente',
    'booking.status.CONFIRMED':   'Confirmée',
    'booking.status.CANCELLED':   'Annulée',
    'booking.status.COMPLETED':   'Terminée',
    'booking.cancel':             'Annuler',
    'booking.pay':                'Payer',
    'booking.ticket':             'Ticket',
    'booking.confirm_cancel':     'Êtes-vous sûr de vouloir annuler cette réservation ?',

    //payment
    'payment.status.COMPLETED': 'Complété',
    'payment.status.PENDING': 'En attente',
    'payment.status.FAILED': 'Échoué',
    'payment.status.REFUNDED': 'Remboursé',
    'payment.transaction': 'Transaction',
    'payment.amount': 'Montant',
    'payment.date': 'Date',

    // Dashboard
    'dashboard.title':            'Mes Réservations',
    'dashboard.subtitle':         'Gérez vos réservations et consultez votre historique',
    'dashboard.welcome':          'Bienvenue',
    'dashboard.no_bookings':      'Aucune réservation pour l\'instant',
    'dashboard.book_now':         'Réserver un véhicule',
    'dashboard.table.vehicle':    'Véhicule',
    'dashboard.table.dates':      'Dates',
    'dashboard.table.price':      'Prix Total',
    'dashboard.table.status':     'Statut',
    'dashboard.table.actions':    'Actions',
    'dashboard.date_to':          'au',
    'dashboard.new_booking':      'Nouvelle réservation',
    'dashboard.bookings_tab':     'Réservations',
    'dashboard.payments_tab':     'Paiements',
    'dashboard.no_payments':      'Aucun paiement trouvé',


    // Admin
    'admin.title':                'Administration',
    'admin.subtitle':             'Vue d\'ensemble de l\'activité',
    'admin.users':                'Utilisateurs',
    'admin.vehicles':             'Véhicules',
    'admin.bookings':             'Réservations',
    'admin.stats.total':          'Total réservations',
    'admin.stats.pending':        'En attente',
    'admin.stats.revenue':        'Revenus',
    'admin.stats.fleet':          'Flotte',
    'admin.stats.available':      'disponibles',
    'admin.table.client':         'Client',
    'admin.table.vehicle':        'Véhicule',
    'admin.table.dates':          'Dates',
    'admin.table.price':          'Prix',
    'admin.table.status':         'Statut',
    'admin.table.actions':        'Actions',
    'admin.vehicle.category':     'Catégorie',
    'admin.vehicle.price_day':    'Prix/Jour',
    'admin.vehicle.status':       'Statut',
    'admin.confirm.delete_vehicle': 'Êtes-vous sûr de vouloir supprimer ce véhicule ?',

    // Home
    'home.hero.title':            'Louez le véhicule parfait pour votre voyage',
    'home.hero.subtitle':         'Des véhicules de qualité, des prix compétitifs et un service client exceptionnel au Cameroun.',
    'home.hero.cta_browse':       'Voir les véhicules',
    'home.hero.cta_register':     'Créer un compte',
    'home.features.title':        'Pourquoi choisir GIA Vehicle Booking ?',
    'home.features.choice.title': 'Large choix de véhicules',
    'home.features.choice.desc':  'Des véhicules économiques aux modèles de luxe, trouvez celui qui vous convient.',
    'home.features.secure.title': 'Réservation sécurisée',
    'home.features.secure.desc':  'Vos données sont protégées et vos réservations sont garanties.',
    'home.features.support.desc': 'Notre équipe est disponible pour répondre à toutes vos questions.',
    'home.cta.title':             'Prêt à réserver votre véhicule ?',
    'home.cta.subtitle':          'Rejoignez des centaines de clients satisfaits',
    'home.cta.btn':               'Commencer maintenant',
    'home.stats.vehicles':        'Véhicules disponibles',
    'home.stats.customers':       'Clients satisfaits',
    'home.stats.support':         'Support client',
    'home.stats.rating':          'Note moyenne',

    // Footer
    'footer.about.desc':          'Votre partenaire de confiance pour la location de véhicules premium au Cameroun.',
    'footer.contact.title':       'Nous contacter',
    'footer.social.title':        'Suivez-nous',
    'footer.newsletter.placeholder': 'Votre email',
    'footer.legal.rights':        'Tous droits réservés.',
    'footer.legal.privacy':       'Confidentialité',
    'footer.legal.terms':         'Conditions d\'utilisation',
    'footer.legal.cookies':       'Cookies',

    // NotFound
    'notfound.title':             'Page introuvable',
    'notfound.subtitle':          'La page que vous recherchez n\'existe pas ou a été déplacée.',
    'notfound.back_home':         'Retour à l\'accueil',
    'notfound.browse':            'Voir les véhicules',

    // Common
    'common.loading':             'Chargement...',
    'common.error':               'Une erreur est survenue',
    'common.save':                'Enregistrer',
    'common.cancel':              'Annuler',
    'common.delete':              'Supprimer',
    'common.edit':                'Modifier',
    'common.confirm':             'Confirmer',
    'common.close':               'Fermer',
    'common.search':              'Rechercher',
    'common.filter':              'Filtrer',
    'common.actions':             'Actions',
    'common.yes':                 'Oui',
    'common.no':                  'Non',
    'common.back':                'Retour',
    'common.processing':          'Traitement...',

    // Toast
    'toast.login_success':        'Connexion réussie !',
    'toast.logout_success':       'Déconnexion réussie',
    'toast.register_success':     'Compte créé avec succès !',
    'toast.booking_success':      'Réservation créée avec succès !',
    'toast.booking_cancelled':    'Réservation annulée',
    'toast.booking_updated':      'Réservation mise à jour',
    'toast.vehicle_deleted':      'Véhicule supprimé',
    'toast.status_updated':       'Statut mis à jour',
    'toast.newsletter_success':   'Inscription réussie ! Vérifiez votre email.',
    'toast.reset_success':        'Mot de passe réinitialisé avec succès !',
    'toast.reset_sent':           'Email de réinitialisation envoyé !',
    'toast.error_generic':        'Une erreur est survenue. Réessayez.',
    'toast.error_load':           'Erreur lors du chargement des données',

    // Validation
    'validation.email':           'Adresse email invalide',
    'validation.phone':           'Numéro invalide (ex: +237 6XX XXX XXX)',
    'validation.password_min':    'Minimum 8 caractères',
    'validation.password_case':   'Doit contenir majuscules et minuscules',
    'validation.password_num':    'Doit contenir au moins un chiffre',
    'validation.password_spec':   'Doit contenir un caractère spécial',
    'validation.password_match':  'Les mots de passe ne correspondent pas',
    'validation.dates':           'Sélectionnez des dates valides',
  },

  en: {
    // Navigation
    'nav.vehicles':   'Vehicles',
    'nav.dashboard':  'Dashboard',
    'nav.login':      'Login',
    'nav.register':   'Register',
    'nav.logout':     'Sign Out',
    'nav.admin':      'Admin',

    // Auth — Login
    'auth.login.title':         'Sign In',
    'auth.login.subtitle':      'Access your account',
    'auth.login.email':         'Email address',
    'auth.login.password':      'Password',
    'auth.login.submit':        'Sign In',
    'auth.login.loading':       'Signing in...',
    'auth.login.forgot':        'Forgot password?',
    'auth.login.no_account':    'Don\'t have an account?',
    'auth.login.register_link': 'Register',
    'auth.login.test_title':    'Test accounts',

    // Auth — Register
    'auth.register.title':          'Create Account',
    'auth.register.subtitle':       'Sign up for free',
    'auth.register.firstname':      'First Name',
    'auth.register.lastname':       'Last Name',
    'auth.register.email':          'Email address',
    'auth.register.phone':          'Phone (optional)',
    'auth.register.password':       'Password',
    'auth.register.confirm':        'Confirm Password',
    'auth.register.submit':         'Create Account',
    'auth.register.loading':        'Creating account...',
    'auth.register.has_account':    'Already have an account?',
    'auth.register.login_link':     'Sign In',

    // Auth — Forgot Password
    'auth.forgot.title':          'Forgot Password',
    'auth.forgot.subtitle':       'Enter your email to receive a reset link',
    'auth.forgot.email':          'Email address',
    'auth.forgot.submit':         'Send Reset Link',
    'auth.forgot.loading':        'Sending...',
    'auth.forgot.back':           'Back to Login',
    'auth.forgot.success.title':  'Email sent!',
    'auth.forgot.success.body':   'Check your inbox and spam folder.',

    // Auth — Reset Password
    'auth.reset.title':           'Reset Password',
    'auth.reset.subtitle':        'Choose a new secure password',
    'auth.reset.new':             'New Password',
    'auth.reset.confirm':         'Confirm',
    'auth.reset.submit':          'Reset Password',
    'auth.reset.loading':         'Resetting...',
    'auth.reset.invalid.title':   'Invalid link',
    'auth.reset.invalid.body':    'This reset link is invalid or has expired (valid for 1 hour).',
    'auth.reset.invalid.cta':     'Request a new link',
    'auth.reset.back':            'Back to login',

    // Vehicles
    'vehicles.title':             'Our Fleet',
    'vehicles.subtitle':          'Choose from our available vehicles',
    'vehicles.filter.title':      'Filter vehicles',
    'vehicles.filter.category':   'Category',
    'vehicles.filter.gearbox':    'Gearbox',
    'vehicles.filter.fuel':       'Fuel',
    'vehicles.filter.min_price':  'Min Price',
    'vehicles.filter.max_price':  'Max Price',
    'vehicles.filter.all_cat':    'All',
    'vehicles.filter.all_trans':  'All',
    'vehicles.filter.all_fuel':   'All',
    'vehicles.filter.all':        'All categories',
    'vehicles.filter.apply':      'Apply',
    'vehicles.filter.reset':      'Reset',
    'vehicles.no_results':        'No vehicles found',
    'vehicles.no_results.cta':    'View all vehicles',
    'vehicles.per_day':           '/ day',
    'vehicles.book':              'Book Now',
    'vehicles.details':           'View Details',
    'vehicles.available':         'Available',
    'vehicles.unavailable':       'Unavailable',
    'vehicles.results.singular':  'vehicle found',
    'vehicles.results.plural':    'vehicles found',
    'vehicles.cat.economy':       'Economy',
    'vehicles.cat.comfort':       'Comfort',
    'vehicles.cat.luxury':        'Luxury',
    'vehicles.trans.automatic':   'Automatic',
    'vehicles.trans.manual':      'Manual',
    'vehicles.fuel.petrol':       'Petrol',
    'vehicles.fuel.diesel':       'Diesel',
    'vehicles.fuel.electric':     'Electric',
    'vehicles.fuel.hybrid':       'Hybrid',

    // VehicleDetails
    'vehicle.not_found':          'Vehicle not found',
    'vehicle.year':               'Year',
    'vehicle.seats':              'Seats',
    'vehicle.seats.label':        'Seats',
    'vehicle.gearbox':            'Gearbox',
    'vehicle.fuel':               'Fuel',
    'vehicle.plate':              'Plate',
    'vehicle.features':           'Features',
    'vehicle.pick_date':          'Pick a date',
    'vehicle.note':               'A valid driving licence and security deposit are required at pick-up.',
    'vehicle.status.AVAILABLE':   'Available',
    'vehicle.status.RENTED':      'Rented',
    'vehicle.status.MAINTENANCE': 'Maintenance',
    'vehicle.status.UNAVAILABLE': 'Unavailable',

    // Booking
    'booking.title':              'Book this vehicle',
    'booking.start':              'Pick-up date',
    'booking.end':                'Return date',
    'booking.notes':              'Notes (optional)',
    'booking.notes.placeholder':  'Need a driver? A baby seat?',
    'booking.duration':           'Duration',
    'booking.days':               'days',
    'booking.rate':               'Rate / Day',
    'booking.total':              'Estimated total',
    'booking.submit':             'Confirm Booking',
    'booking.loading':            'Booking...',
    'booking.login_required':     'Please log in to continue your booking',
    'booking.select_dates':       'Please select valid dates',
    'booking.status.PENDING':     'Pending',
    'booking.status.CONFIRMED':   'Confirmed',
    'booking.status.CANCELLED':   'Cancelled',
    'booking.status.COMPLETED':   'Completed',
    'booking.cancel':             'Cancel',
    'booking.pay':                'Pay',
    'booking.ticket':             'Ticket',
    'booking.confirm_cancel':     'Are you sure you want to cancel this booking?',

    //payment
    'payment.status.COMPLETED': 'Completed',
    'payment.status.PENDING': 'Pending',
    'payment.status.FAILED': 'Failed',
    'payment.status.REFUNDED': 'Refunded',
    'payment.transaction': 'Transaction',
    'payment.amount': 'Amount',
    'payment.date': 'Date',

    // Dashboard
    'dashboard.title':            'My Bookings',
    'dashboard.subtitle':         'Manage your bookings and view your history',
    'dashboard.welcome':          'Welcome',
    'dashboard.no_bookings':      'No bookings yet',
    'dashboard.book_now':         'Book a vehicle',
    'dashboard.table.vehicle':    'Vehicle',
    'dashboard.table.dates':      'Dates',
    'dashboard.table.price':      'Total Price',
    'dashboard.table.status':     'Status',
    'dashboard.table.actions':    'Actions',
    'dashboard.date_to':          'to',
    'dashboard.new_booking': 'New booking',
    'dashboard.bookings_tab': 'Bookings',
    'dashboard.payments_tab': 'Payments',
    'dashboard.no_payments': 'No payments found',

    // Admin
    'admin.title':                'Administration',
    'admin.subtitle':             'Activity overview',
    'admin.users':                'Users',
    'admin.vehicles':             'Vehicles',
    'admin.bookings':             'Bookings',
    'admin.stats.total':          'Total bookings',
    'admin.stats.pending':        'Pending',
    'admin.stats.revenue':        'Revenue',
    'admin.stats.fleet':          'Fleet',
    'admin.stats.available':      'available',
    'admin.table.client':         'Client',
    'admin.table.vehicle':        'Vehicle',
    'admin.table.dates':          'Dates',
    'admin.table.price':          'Price',
    'admin.table.status':         'Status',
    'admin.table.actions':        'Actions',
    'admin.vehicle.category':     'Category',
    'admin.vehicle.price_day':    'Price/Day',
    'admin.vehicle.status':       'Status',
    'admin.confirm.delete_vehicle': 'Are you sure you want to delete this vehicle?',

    // Home
    'home.hero.title':            'Rent the perfect vehicle for your journey',
    'home.hero.subtitle':         'Quality vehicles, competitive prices, and exceptional customer service in Cameroon.',
    'home.hero.cta_browse':       'Browse vehicles',
    'home.hero.cta_register':     'Create account',
    'home.features.title':        'Why choose GIA Vehicle Booking?',
    'home.features.choice.title': 'Wide vehicle selection',
    'home.features.choice.desc':  'From economy cars to luxury models, find the one that suits you.',
    'home.features.secure.title': 'Secure booking',
    'home.features.secure.desc':  'Your data is protected and your bookings are guaranteed.',
    'home.features.support.desc': 'Our team is available to answer all your questions.',
    'home.cta.title':             'Ready to book your vehicle?',
    'home.cta.subtitle':          'Join hundreds of satisfied customers',
    'home.cta.btn':               'Get started',
    'home.stats.vehicles':        'Available vehicles',
    'home.stats.customers':       'Satisfied customers',
    'home.stats.support':         'Customer support',
    'home.stats.rating':          'Average rating',

    // Footer
    'footer.about.desc':          'Your trusted partner for premium vehicle rentals in Cameroon.',
    'footer.contact.title':       'Contact Us',
    'footer.social.title':        'Follow Us',
    'footer.newsletter.placeholder': 'Your email',
    'footer.legal.rights':        'All rights reserved.',
    'footer.legal.privacy':       'Privacy Policy',
    'footer.legal.terms':         'Terms of Service',
    'footer.legal.cookies':       'Cookie Policy',

    // NotFound
    'notfound.title':             'Page not found',
    'notfound.subtitle':          'The page you are looking for does not exist or has been moved.',
    'notfound.back_home':         'Back to home',
    'notfound.browse':            'Browse vehicles',

    // Common
    'common.loading':             'Loading...',
    'common.error':               'An error occurred',
    'common.save':                'Save',
    'common.cancel':              'Cancel',
    'common.delete':              'Delete',
    'common.edit':                'Edit',
    'common.confirm':             'Confirm',
    'common.close':               'Close',
    'common.search':              'Search',
    'common.filter':              'Filter',
    'common.actions':             'Actions',
    'common.yes':                 'Yes',
    'common.no':                  'No',
    'common.back':                'Back',
    'common.processing':          'Processing...',

    // Toast
    'toast.login_success':        'Login successful!',
    'toast.logout_success':       'Logged out',
    'toast.register_success':     'Account created successfully!',
    'toast.booking_success':      'Booking created successfully!',
    'toast.booking_cancelled':    'Booking cancelled',
    'toast.booking_updated':      'Booking updated',
    'toast.vehicle_deleted':      'Vehicle deleted',
    'toast.status_updated':       'Status updated',
    'toast.newsletter_success':   'Subscription successful! Check your email.',
    'toast.reset_success':        'Password reset successfully!',
    'toast.reset_sent':           'Reset email sent!',
    'toast.error_generic':        'Something went wrong. Please try again.',
    'toast.error_load':           'Error loading data',

    // Validation
    'validation.email':           'Invalid email address',
    'validation.phone':           'Invalid number (e.g. +237 6XX XXX XXX)',
    'validation.password_min':    'Minimum 8 characters',
    'validation.password_case':   'Must contain upper and lowercase letters',
    'validation.password_num':    'Must contain at least one number',
    'validation.password_spec':   'Must contain a special character',
    'validation.password_match':  'Passwords do not match',
    'validation.dates':           'Please select valid dates',
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;

// ─── Context ──────────────────────────────────────────────────────────────────

interface LangContextType {
  lang:    Lang;
  setLang: (l: Lang) => void;
  t:       (key: TranslationKey, fallback?: string) => string;
}

const LangContext = createContext<LangContextType | null>(null);

// ─── Provider — à placer UNE SEULE FOIS dans App.tsx ─────────────────────────

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('lang') as Lang | null) ?? 'fr'
  );

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem('lang', l);
    setLangState(l);           // ← met à jour le Context → tous les composants se re-rendent
  }, []);

  const t = useCallback(
    (key: TranslationKey, fallback?: string): string =>
      (translations[lang] as any)[key] ?? fallback ?? key,
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook retournant la fonction de traduction et le sélecteur de langue.
 * Doit être utilisé à l'intérieur de <LangProvider>.
 */
export function useTranslation(): LangContextType {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useTranslation must be used inside <LangProvider>');
  return ctx;
}

// ─── Standalone helper (hors React) ──────────────────────────────────────────

export function translate(key: TranslationKey, lang: Lang = 'fr'): string {
  return (translations[lang] as any)[key] ?? key;
}