# WebWindows 7

Simulación web de un ordenador con Windows 7 (estilo Aero), hecha solo con HTML, CSS y JavaScript. **Es una simulación**: no es Windows, no ejecuta programas reales y no toca tu ordenador.

## Cómo ejecutarlo
Abre `index.html` en el navegador. Sin servidor, sin dependencias. La contraseña inicial está vacía: pulsa "Log on".

## Qué es virtual
- **RAM**: 8192 MB simulados por `ProcessManager` (`PM`). Cada ventana abierta reserva RAM; al cerrarla se libera. Si no cabe, se muestra "Your computer is low on memory".
- **CPU**: Intel Core i5-2500 ficticio. El uso por proceso fluctúa cada segundo.
- **Disco C:** 500 GB virtuales (`FS`): un árbol de objetos JS guardado en `localStorage`. No se crea ningún archivo grande. La Papelera sigue ocupando espacio hasta vaciarla.
- **Persistencia**: archivos, carpetas, apps instaladas, fondo, usuario, contraseña e historial sobreviven a recargar la página.

## Arquitectura (`script.js`)
`FS` (almacenamiento), `PM` (procesos), `WM` (ventanas), `APPS`/`launch`/`installer`/`unins` (aplicaciones), y el objeto `VirtualOS` expuesto en las DevTools para depuración. El estado del sistema es `BOOTING`, `LOGIN`, `RUNNING`, `LOCKED`, `SHUTTING_DOWN` o `RESTARTING`.

## Aplicaciones incluidas
Windows Explorer (con Papelera), Notepad, Calculator (estándar), Paint, Command Prompt, Internet Explorer, Control Panel (programas, personalización, cuenta, sistema), Task Manager (Applications, Processes, Performance) y WebSoft Store (descarga e instalación simuladas).

## Seguridad y límites
- Nada se ejecuta fuera de la simulación; `cmd` solo opera sobre el sistema de archivos virtual.
- Internet Explorer usa la conexión de tu navegador real.
- Sonidos: `sounds/windows-7-startup.mp3` suena al iniciar sesión y `sounds/windows-7-shutdown.mp3` al apagar o reiniciar (el navegador solo permite audio tras un clic). `windows-7-notification.mp3` suena con las notificaciones y `windows-7-error.mp3` con los errores. Se silencian con el altavoz de la bandeja o en Control Panel > Sound, que también tiene volumen y un test de cada sonido.
- Internet Explorer carga las páginas dentro de la ventana mediante `iframe`, con pestañas, atrás/adelante, favoritos (incluye Friv Classic y otras webs de juegos de navegador) e historial. Muchos sitios (Google incluido) prohíben ser mostrados dentro de otra página; en ese caso usa "Open in browser tab".
- Pantalla completa: se activa al iniciar sesión (botón ⛶ de la bandeja o clic derecho en el escritorio para alternar).
- Microsoft Word (simulado) y Media Player Plus se instalan desde la WebSoft Store y dejan un acceso directo en el escritorio. Word edita y guarda `.docx` virtuales en Documents (y exporta `.doc`). Media Player Plus reproduce música y graba audio con el micrófono (el navegador pide permiso); todo se guarda en la carpeta Music. Los audios van a IndexedDB; el resto, a localStorage.
- YouTube: youtube.com no se puede mostrar dentro de otra página, así que se abre en una pestaña real; pegando el enlace de un vídeo en Internet Explorer se reproduce dentro de la ventana (puede requerir abrir el proyecto desde un servidor local, p. ej. `python -m http.server`, no desde `file://`).
- No incluidas todavía: copiar/pegar en el Explorer, calculadora científica, gadgets, registro, Windows Update, pantalla azul, resolución virtual y calendario.