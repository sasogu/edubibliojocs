export const firebaseSettings = {
  // Cambia a true cuando completes firebaseConfig con valores reales.
  enabled: false,
  // Opcional: activa boton de login Google (requiere proveedor Google habilitado en Firebase Auth).
  googleAuthEnabled: false,
  // Email del administrador: ve el filtro "No funciona" y los reports de usuarios.
  adminEmail: "",
};

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
