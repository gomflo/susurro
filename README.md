# Susurro

Dictado por voz para Mac, 100 % en tu equipo. Mantén **fn**, habla y suelta: el texto aparece pulido en la app donde está tu cursor.

**[Descargar para Mac](https://github.com/gomflo/susurro/releases/latest/download/Susurro.dmg)** · [gomflo.dev/susurro](https://gomflo.dev/susurro/)

- **Sin nube.** La voz se transcribe con el modelo de Apple en el dispositivo y se pule con Apple Intelligence, también en tu Mac.
- **Sin cuentas ni suscripción.** Es gratis; lo abres y empiezas a hablar.
- **Escribe como escribes.** Quita muletillas, respeta tus correcciones («el martes, no, mejor el jueves» → «el jueves») y ajusta el tono a cada app.
- **Rápido.** Transcribe mientras hablas: 5 s de voz en 80–200 ms.

Requiere macOS 26 o posterior y Apple Silicon.

## Instalar

1. Abre `Susurro.dmg` y arrastra Susurro a Aplicaciones.
2. La primera vez, macOS avisa que no puede verificar la app: ve a Configuración del Sistema › Privacidad y seguridad y elige «Abrir de todos modos».
3. Da permiso de Micrófono y Accesibilidad. La bienvenida te guía.

## Este repo

Es la landing: HTML, CSS y JS estáticos, sin build. GitHub Pages publica la rama `main` desde la raíz.

- El instalador no vive aquí: es el archivo `Susurro.dmg` del último [release](https://github.com/gomflo/susurro/releases), que es a donde apuntan los botones.
- Las rutas son relativas porque el sitio vive bajo `/susurro/`.
