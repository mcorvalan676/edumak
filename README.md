# EduMap Cloud — GitHub + Cloudflare + Supabase

Versión web de EduMap preparada para publicarse sin un servidor PHP/MySQL local.

## Arquitectura

- **GitHub:** código y control de versiones.
- **Cloudflare Pages:** publica el frontend y la Function `/api/health`.
- **Supabase:** PostgreSQL + autenticación + Row Level Security.
- **Leaflet + OpenStreetMap:** mapa.
- **Dijkstra en JavaScript:** cálculo de rutas en el navegador.

Cloudflare Pages puede conectarse a GitHub y desplegar automáticamente cada push.
Las Pages Functions permiten ejecutar código del lado servidor sin mantener un servidor propio.

## 1. Crear Supabase

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor**.
3. Ejecuta primero `supabase/schema.sql`.
4. Ejecuta después `supabase/seed.sql`.
5. En **Project Settings > API** copia:
   - Project URL
   - Publishable/anon public key

NO uses `service_role` en `config.js`.

## 2. Configurar el proyecto

Copia:

```text
config.example.js -> config.js
```

Edita `config.js`:

```js
window.EDUMAP_CONFIG = {
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  supabaseAnonKey: "TU_ANON_PUBLIC_KEY"
};
```

`config.js` está incluido en `.gitignore` para que no se suba por accidente.

## 3. Probar localmente

Con Python instalado:

```powershell
python -m http.server 5500
```

Abre:

```text
http://localhost:5500
```

No abras `index.html` directamente con doble clic porque algunos navegadores bloquean peticiones de módulos/orígenes.

## 4. Subir a GitHub

Desde la carpeta del proyecto:

```powershell
git init
git add .
git commit -m "EduMap Cloud inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/EduMap.git
git push -u origin main
```

No subas `config.js` si contiene datos que no quieres compartir. Para una versión pública, es preferible usar la anon/public key de Supabase con RLS bien configurado.

## 5. Publicar con Cloudflare Pages

En Cloudflare:

1. Workers & Pages.
2. Create application.
3. Pages.
4. Import an existing Git repository.
5. Selecciona el repositorio EduMap.
6. Branch: `main`.
7. Build command: `exit 0`.
8. Build output directory: `/`.
9. Deploy.

Cloudflare generará una URL tipo:

```text
https://edumap.pages.dev
```

Cada push posterior a `main` puede generar un nuevo despliegue automáticamente.

## 6. Configuración recomendada de Supabase Auth

Para comenzar puedes desactivar la confirmación de correo durante las pruebas.

En producción, activa confirmación de correo y configura las URLs de redirección con tu dominio de Cloudflare.

## 7. Crear un administrador

Por seguridad, el registro normal crea usuarios con rol `user`.

Para convertir un usuario en administrador, desde Supabase SQL Editor puedes ejecutar:

```sql
update public.profiles
set role = 'admin'
where id = 'UUID_DEL_USUARIO';
```

No publiques el UUID ni credenciales de administrador.

## 8. Qué funciona en esta versión

- Mapa Leaflet.
- Lectura de espacios desde Supabase.
- Búsqueda.
- Nodos y conexiones.
- Dijkstra.
- Rutas accesibles.
- Registro/inicio de sesión con Supabase Auth.
- Favoritos por usuario.
- Perfil/rol.
- Function `/api/health`.
- Diseño responsive para PC y celular.

## 9. Importante

Esta versión reemplaza el backend PHP + MySQL + llamada a Python de la versión local.

La ruta se calcula en JavaScript para que Cloudflare pueda publicar el proyecto como una aplicación web sin ejecutar Python.

El GPS del navegador puede entregar la posición exterior del usuario. Para saber exactamente en qué sala se encuentra una persona se necesita una solución adicional de posicionamiento interior.

## Estructura

```text
EduMap/
├─ index.html
├─ app.js
├─ styles.css
├─ config.example.js
├─ config.js
├─ _redirects
├─ .gitignore
├─ functions/
│  └─ api/
│     └─ health.js
└─ supabase/
   ├─ schema.sql
   └─ seed.sql
```
