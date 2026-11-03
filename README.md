# Finanzas Familiares — PWA

Esta es una base funcional de aplicación web instalable con:
- Inicio de sesión con Google (Firebase Authentication).
- Hogar compartido por direcciones Gmail.
- Movimientos compartidos (todos los miembros autorizados ven todos).
- Dashboard mensual, categorías y alertas básicas.
- Instalación como PWA en Android.
- Datos sincronizados en Cloud Firestore.

## Importante
Ya está conectada al proyecto Firebase `finanzas-familiar-7f26c`, pero todavía no está publicada. Para que sincronice entre celulares hay que crear/configurar un proyecto Firebase y alojar estos archivos en un hosting HTTPS. No compartas contraseñas ni claves privadas en el chat. La configuración web de Firebase se coloca en `app.js`; la API key web de Firebase identifica el proyecto, pero las reglas de Firestore son las que protegen los datos.

## Configuración
1. Entrá a https://console.firebase.google.com/ y creá un proyecto.
2. La configuración web de este proyecto ya está incorporada en `app.js`.
3. En Authentication > Sign-in method, habilitá Google.
4. En Firestore Database, creá la base de datos y publicá el contenido de `firestore.rules` en la pestaña Rules.
5. Publicá la carpeta en un hosting HTTPS (por ejemplo Firebase Hosting).
6. Abrí la URL publicada en Android Chrome. Iniciá sesión con tu Gmail.
7. En Acceso familiar, agregá el Gmail de tu pareja. Luego ella abre la misma URL e inicia sesión con esa cuenta.
8. En Chrome: menú ⋮ > Añadir a pantalla de inicio / Instalar aplicación.

## Límites de esta primera versión
- La aplicación requiere conexión para sincronizar y autenticar; el service worker conserva recursos de interfaz, no habilita escritura offline.
- Las alertas son reglas automáticas simples, no asesoramiento financiero profesional.
- La primera persona que entra crea el hogar. El administrador agrega el Gmail del segundo integrante antes de que esa persona inicie sesión.
- Esta versión registra movimientos, categorías y alertas. Las pantallas avanzadas de tarjetas, préstamos, inversiones, presupuestos y patrimonio son una siguiente iteración.
- Para una aplicación productiva conviene agregar validación adicional, recuperación de cuenta, exportación CSV/Excel, edición/borrado auditado y pruebas de seguridad.
