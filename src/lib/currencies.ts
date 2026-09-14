// Plain data — safe to import from both server actions and client
// components. (A "use server" module can only export functions; a client
// component importing a plain constant from one gets a broken stub.)
export const SIGNUP_CURRENCIES = ["SAR", "AED", "KWD", "QAR", "BHD", "OMR", "EGP", "JOD", "IQD", "USD", "EUR"] as const;
