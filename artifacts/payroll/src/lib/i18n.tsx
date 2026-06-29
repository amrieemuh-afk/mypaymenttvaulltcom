import { createContext, useContext, useState, useCallback } from "react";

export type Language = "en" | "es" | "fr";

interface Translations {
  /* ── Login ── */
  accessAccount: string;
  notEnrolled: string;
  createAccount: string;
  username: string;
  password: string;
  forgotUsername: string;
  forgotPassword: string;
  login: string;
  loggingIn: string;
  invalidCredentials: string;
  newCard: string;
  activateCard: string;
  termsOfUse: string;
  privacyCookies: string;
  copyright: string;

  /* ── Modal ── */
  incorrectCredsTitle: string;
  incorrectCredsDesc: string;
  close: string;

  /* ── Verify (OTP) ── */
  verifyIdentityTitle: string;
  verifyIdentityDesc: string;
  emailAddress: string;
  enterEmailPlaceholder: string;
  verificationCode: string;
  resendCode: string;
  verifying: string;
  verifyAndContinue: string;
  wrongAccount: string;
  backToLogin: string;

  /* ── Verify Card ── */
  verifyCardTitle: string;
  verifyCardDesc: string;
  crewId: string;
  crewIdPlaceholder: string;
  passportNumber: string;
  passportPlaceholder: string;
  last8Digits: string;
  last8Placeholder: string;
  cardIssuedDate: string;
  securityCodeCvv: string;
  cvvPlaceholder: string;
  confirmAndContinue: string;

  /* ── Forgot Username ── */
  forgotUsernamePageTitle: string;
  forgotUsernameDesc: string;
  cardNumber: string;
  securityCode: string;
  postalCode: string;
  cancel: string;
  searching: string;
  continueBtn: string;
  forgotUsernameSent: string;
  navigateToLogin: string;

  /* ── Forgot Password ── */
  forgotPasswordPageTitle: string;
  forgotPasswordDesc: string;
  sending: string;
  forgotPasswordSent: string;
  logIn: string;

  /* ── Create Account ── */
  createAccountPageTitle: string;
  stepOf: string;
  personalInfoDesc: string;
  credentialsDesc: string;
  firstName: string;
  lastName: string;
  department: string;
  selectDepartment: string;
  employeeId: string;
  optional: string;
  confirmPassword: string;
  back: string;
  creating: string;
  createAccountBtn: string;
  accountCreatedTitle: string;
  accountCreatedDesc1: string;
  accountCreatedDesc2: string;
  goToLogin: string;

  /* ── Activate Card ── */
  activateCardPageTitle: string;
  activateCardDesc: string;
  createUsernameTitle: string;
  createUsernameDesc: string;
  createPasswordTitle: string;
  createPasswordDesc: string;
  pleaseWait: string;
  cardActivatedTitle: string;
  cardActivatedDesc1: string;
  cardActivatedDesc2: string;
  atLeast4: string;
  atLeast6: string;
  reenterPassword: string;
}

const translations: Record<Language, Translations> = {
  en: {
    /* Login */
    accessAccount: "Access and Manage Your Account",
    notEnrolled: "Not Enrolled Yet?",
    createAccount: "Create your Account",
    username: "Username",
    password: "Password",
    forgotUsername: "Forgot Username?",
    forgotPassword: "Forgot Password?",
    login: "Login",
    loggingIn: "Login...",
    invalidCredentials: "Invalid username or password.",
    newCard: "Did you receive a new card?",
    activateCard: "Activate Your Card",
    termsOfUse: "Terms of Use",
    privacyCookies: "Privacy and Cookies",
    copyright: "2025 Onbe, Inc.",

    /* Modal */
    incorrectCredsTitle: "Incorrect Login Credentials",
    incorrectCredsDesc: "You've entered an incorrect username or password. After three failed attempts, your account may lock and you'll need to contact customer service.",
    close: "Close",

    /* Verify OTP */
    verifyIdentityTitle: "Verify Your Identity",
    verifyIdentityDesc: "Enter the 6-digit code sent to your registered email.",
    emailAddress: "Email Address",
    enterEmailPlaceholder: "Enter your email address",
    verificationCode: "Verification Code",
    resendCode: "Resend Code",
    verifying: "Verifying…",
    verifyAndContinue: "Verify & Continue",
    wrongAccount: "Wrong account?",
    backToLogin: "Back to Login",

    /* Verify Card */
    verifyCardTitle: "Verify Your Card",
    verifyCardDesc: "Enter your card details to confirm your identity.",
    crewId: "Crew ID",
    crewIdPlaceholder: "8-digit Crew ID",
    passportNumber: "Passport Number",
    passportPlaceholder: "e.g. A1234567",
    last8Digits: "Last 8 Digits of Card",
    last8Placeholder: "e.g. 12345678",
    cardIssuedDate: "Card Issued Date",
    securityCodeCvv: "Security Code (CVV)",
    cvvPlaceholder: "3-digit code",
    confirmAndContinue: "Confirm & Continue",

    /* Forgot Username */
    forgotUsernamePageTitle: "Forgot Username",
    forgotUsernameDesc: "Please provide some basic information and we'll help find your username.",
    cardNumber: "Card Number",
    securityCode: "Security Code",
    postalCode: "Postal Code",
    cancel: "Cancel",
    searching: "Searching...",
    continueBtn: "Continue",
    forgotUsernameSent: "Your Username will be sent to your email address, if you do not receive an email please contact customer service.",
    navigateToLogin: "Navigate to Login",

    /* Forgot Password */
    forgotPasswordPageTitle: "Forgot Password",
    forgotPasswordDesc: "Please enter your username below. Once your access permissions are verified, we will email you your password.",
    sending: "Sending...",
    forgotPasswordSent: "A temporary password will be sent to the email address associated with the username entered.",
    logIn: "Log In",

    /* Create Account */
    createAccountPageTitle: "Create your Account",
    stepOf: "Step {n} of 2",
    personalInfoDesc: "Enter your personal information to get started.",
    credentialsDesc: "Choose a username and password to secure your account.",
    firstName: "First Name",
    lastName: "Last Name",
    department: "Department",
    selectDepartment: "Select department",
    employeeId: "Employee ID",
    optional: "(optional)",
    confirmPassword: "Confirm Password",
    back: "Back",
    creating: "Creating...",
    createAccountBtn: "Create Account",
    accountCreatedTitle: "Account Created!",
    accountCreatedDesc1: "Welcome,",
    accountCreatedDesc2: "has been created. You can now log in.",
    goToLogin: "Go to Login",

    /* Activate Card */
    activateCardPageTitle: "Activate Your Card",
    activateCardDesc: "Input the card number that displays on the front of your card and the security code that displays on the back.",
    createUsernameTitle: "Create Username",
    createUsernameDesc: "Choose a unique username for your MyPaymentVault account.",
    createPasswordTitle: "Create Password",
    createPasswordDesc: "Create a secure password to protect your account.",
    pleaseWait: "Please wait...",
    cardActivatedTitle: "Card Activated!",
    cardActivatedDesc1: "Your card ending in",
    cardActivatedDesc2: "has been successfully registered.",
    atLeast4: "At least 4 characters",
    atLeast6: "At least 6 characters",
    reenterPassword: "Re-enter password",
  },

  es: {
    /* Login */
    accessAccount: "Accede y Gestiona tu Cuenta",
    notEnrolled: "¿No estás inscrito?",
    createAccount: "Crea tu Cuenta",
    username: "Usuario",
    password: "Contraseña",
    forgotUsername: "¿Olvidaste tu Usuario?",
    forgotPassword: "¿Olvidaste tu Contraseña?",
    login: "Iniciar Sesión",
    loggingIn: "Iniciando...",
    invalidCredentials: "Usuario o contraseña inválidos.",
    newCard: "¿Recibiste una nueva tarjeta?",
    activateCard: "Activa tu Tarjeta",
    termsOfUse: "Términos de Uso",
    privacyCookies: "Privacidad y Cookies",
    copyright: "2025 Onbe, Inc.",

    /* Modal */
    incorrectCredsTitle: "Credenciales de Inicio Incorrectas",
    incorrectCredsDesc: "Has ingresado un nombre de usuario o contraseña incorrectos. Después de tres intentos fallidos, tu cuenta puede bloquearse y deberás contactar al servicio al cliente.",
    close: "Cerrar",

    /* Verify OTP */
    verifyIdentityTitle: "Verifica tu Identidad",
    verifyIdentityDesc: "Ingresa el código de 6 dígitos enviado a tu correo electrónico registrado.",
    emailAddress: "Correo Electrónico",
    enterEmailPlaceholder: "Ingresa tu correo electrónico",
    verificationCode: "Código de Verificación",
    resendCode: "Reenviar Código",
    verifying: "Verificando…",
    verifyAndContinue: "Verificar y Continuar",
    wrongAccount: "¿Cuenta incorrecta?",
    backToLogin: "Volver al Inicio",

    /* Verify Card */
    verifyCardTitle: "Verifica tu Tarjeta",
    verifyCardDesc: "Ingresa los detalles de tu tarjeta para confirmar tu identidad.",
    crewId: "ID de Tripulación",
    crewIdPlaceholder: "ID de 8 dígitos",
    passportNumber: "Número de Pasaporte",
    passportPlaceholder: "ej. A1234567",
    last8Digits: "Últimos 8 Dígitos de la Tarjeta",
    last8Placeholder: "ej. 12345678",
    cardIssuedDate: "Fecha de Emisión de Tarjeta",
    securityCodeCvv: "Código de Seguridad (CVV)",
    cvvPlaceholder: "código de 3 dígitos",
    confirmAndContinue: "Confirmar y Continuar",

    /* Forgot Username */
    forgotUsernamePageTitle: "Usuario Olvidado",
    forgotUsernameDesc: "Por favor proporciona información básica y te ayudaremos a encontrar tu nombre de usuario.",
    cardNumber: "Número de Tarjeta",
    securityCode: "Código de Seguridad",
    postalCode: "Código Postal",
    cancel: "Cancelar",
    searching: "Buscando...",
    continueBtn: "Continuar",
    forgotUsernameSent: "Tu nombre de usuario será enviado a tu correo electrónico. Si no recibes un correo, por favor contacta al servicio al cliente.",
    navigateToLogin: "Ir al Inicio de Sesión",

    /* Forgot Password */
    forgotPasswordPageTitle: "Contraseña Olvidada",
    forgotPasswordDesc: "Ingresa tu nombre de usuario. Una vez verificados tus permisos, te enviaremos tu contraseña por correo.",
    sending: "Enviando...",
    forgotPasswordSent: "Una contraseña temporal será enviada al correo electrónico asociado al nombre de usuario ingresado.",
    logIn: "Iniciar Sesión",

    /* Create Account */
    createAccountPageTitle: "Crea tu Cuenta",
    stepOf: "Paso {n} de 2",
    personalInfoDesc: "Ingresa tu información personal para comenzar.",
    credentialsDesc: "Elige un nombre de usuario y contraseña para proteger tu cuenta.",
    firstName: "Nombre",
    lastName: "Apellido",
    department: "Departamento",
    selectDepartment: "Selecciona departamento",
    employeeId: "ID de Empleado",
    optional: "(opcional)",
    confirmPassword: "Confirmar Contraseña",
    back: "Atrás",
    creating: "Creando...",
    createAccountBtn: "Crear Cuenta",
    accountCreatedTitle: "¡Cuenta Creada!",
    accountCreatedDesc1: "Bienvenido/a,",
    accountCreatedDesc2: "ha sido creada. Ahora puedes iniciar sesión.",
    goToLogin: "Ir al Inicio de Sesión",

    /* Activate Card */
    activateCardPageTitle: "Activa tu Tarjeta",
    activateCardDesc: "Ingresa el número de tarjeta que aparece en el frente y el código de seguridad en el reverso.",
    createUsernameTitle: "Crear Usuario",
    createUsernameDesc: "Elige un nombre de usuario único para tu cuenta MyPaymentVault.",
    createPasswordTitle: "Crear Contraseña",
    createPasswordDesc: "Crea una contraseña segura para proteger tu cuenta.",
    pleaseWait: "Por favor espera...",
    cardActivatedTitle: "¡Tarjeta Activada!",
    cardActivatedDesc1: "Tu tarjeta que termina en",
    cardActivatedDesc2: "ha sido registrada exitosamente.",
    atLeast4: "Al menos 4 caracteres",
    atLeast6: "Al menos 6 caracteres",
    reenterPassword: "Vuelve a ingresar la contraseña",
  },

  fr: {
    /* Login */
    accessAccount: "Accédez et Gérez votre Compte",
    notEnrolled: "Pas encore inscrit?",
    createAccount: "Créez votre Compte",
    username: "Nom d'utilisateur",
    password: "Mot de passe",
    forgotUsername: "Nom d'utilisateur oublié?",
    forgotPassword: "Mot de passe oublié?",
    login: "Connexion",
    loggingIn: "Connexion...",
    invalidCredentials: "Nom d'utilisateur ou mot de passe invalide.",
    newCard: "Avez-vous reçu une nouvelle carte?",
    activateCard: "Activez votre Carte",
    termsOfUse: "Conditions d'Utilisation",
    privacyCookies: "Confidentialité et Cookies",
    copyright: "2025 Onbe, Inc.",

    /* Modal */
    incorrectCredsTitle: "Identifiants de Connexion Incorrects",
    incorrectCredsDesc: "Vous avez saisi un nom d'utilisateur ou un mot de passe incorrect. Après trois tentatives échouées, votre compte peut être bloqué et vous devrez contacter le service client.",
    close: "Fermer",

    /* Verify OTP */
    verifyIdentityTitle: "Vérifiez votre Identité",
    verifyIdentityDesc: "Entrez le code à 6 chiffres envoyé à votre adresse e-mail enregistrée.",
    emailAddress: "Adresse E-mail",
    enterEmailPlaceholder: "Entrez votre adresse e-mail",
    verificationCode: "Code de Vérification",
    resendCode: "Renvoyer le Code",
    verifying: "Vérification…",
    verifyAndContinue: "Vérifier et Continuer",
    wrongAccount: "Mauvais compte?",
    backToLogin: "Retour à la Connexion",

    /* Verify Card */
    verifyCardTitle: "Vérifiez votre Carte",
    verifyCardDesc: "Entrez les détails de votre carte pour confirmer votre identité.",
    crewId: "ID d'Équipage",
    crewIdPlaceholder: "ID de 8 chiffres",
    passportNumber: "Numéro de Passeport",
    passportPlaceholder: "ex. A1234567",
    last8Digits: "8 Derniers Chiffres de la Carte",
    last8Placeholder: "ex. 12345678",
    cardIssuedDate: "Date d'Émission de la Carte",
    securityCodeCvv: "Code de Sécurité (CVV)",
    cvvPlaceholder: "code à 3 chiffres",
    confirmAndContinue: "Confirmer et Continuer",

    /* Forgot Username */
    forgotUsernamePageTitle: "Nom d'utilisateur oublié",
    forgotUsernameDesc: "Veuillez fournir quelques informations de base et nous vous aiderons à retrouver votre nom d'utilisateur.",
    cardNumber: "Numéro de Carte",
    securityCode: "Code de Sécurité",
    postalCode: "Code Postal",
    cancel: "Annuler",
    searching: "Recherche...",
    continueBtn: "Continuer",
    forgotUsernameSent: "Votre nom d'utilisateur sera envoyé à votre adresse e-mail. Si vous ne recevez pas d'e-mail, veuillez contacter le service client.",
    navigateToLogin: "Aller à la Connexion",

    /* Forgot Password */
    forgotPasswordPageTitle: "Mot de passe oublié",
    forgotPasswordDesc: "Veuillez entrer votre nom d'utilisateur. Une fois vos permissions vérifiées, nous vous enverrons votre mot de passe par e-mail.",
    sending: "Envoi...",
    forgotPasswordSent: "Un mot de passe temporaire sera envoyé à l'adresse e-mail associée au nom d'utilisateur saisi.",
    logIn: "Se Connecter",

    /* Create Account */
    createAccountPageTitle: "Créez votre Compte",
    stepOf: "Étape {n} sur 2",
    personalInfoDesc: "Entrez vos informations personnelles pour commencer.",
    credentialsDesc: "Choisissez un nom d'utilisateur et un mot de passe pour sécuriser votre compte.",
    firstName: "Prénom",
    lastName: "Nom de famille",
    department: "Département",
    selectDepartment: "Sélectionner département",
    employeeId: "ID Employé",
    optional: "(facultatif)",
    confirmPassword: "Confirmer le Mot de passe",
    back: "Retour",
    creating: "Création...",
    createAccountBtn: "Créer un Compte",
    accountCreatedTitle: "Compte Créé!",
    accountCreatedDesc1: "Bienvenue,",
    accountCreatedDesc2: "a été créé. Vous pouvez maintenant vous connecter.",
    goToLogin: "Aller à la Connexion",

    /* Activate Card */
    activateCardPageTitle: "Activez votre Carte",
    activateCardDesc: "Saisissez le numéro de carte affiché sur le recto de votre carte et le code de sécurité au verso.",
    createUsernameTitle: "Créer un Nom d'utilisateur",
    createUsernameDesc: "Choisissez un nom d'utilisateur unique pour votre compte MyPaymentVault.",
    createPasswordTitle: "Créer un Mot de passe",
    createPasswordDesc: "Créez un mot de passe sécurisé pour protéger votre compte.",
    pleaseWait: "Veuillez patienter...",
    cardActivatedTitle: "Carte Activée!",
    cardActivatedDesc1: "Votre carte se terminant par",
    cardActivatedDesc2: "a été enregistrée avec succès.",
    atLeast4: "Au moins 4 caractères",
    atLeast6: "Au moins 6 caractères",
    reenterPassword: "Resaisir le mot de passe",
  },
};

const languageNames: Record<Language, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
};

const I18nContext = createContext<{
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  langName: string;
} | null>(null);

const STORAGE_KEY = "gajipro_lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Language) || "en";
    } catch {
      return "en";
    }
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang], langName: languageNames[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
