# Susurro · diseño de la landing

Documento de trabajo del rediseño (proceso del skill `/awwwards`). Las decisiones de aquí mandan sobre el código: si algo cambia, se cambia aquí primero.

## Brief

- **Qué es:** Susurro, dictado por voz para Mac. Mantén fn, habla y suelta; el texto pulido aparece donde está el cursor. Todo corre en el equipo. Gratis.
- **Para quién:** gente que escribe todo el día en Mac (correo, chats, documentos, código), hispanohablante, con Apple Silicon y macOS 26.
- **Trabajo del sitio:** que entiendan el gesto en 3 segundos, que lo prueben ahí mismo y que descarguen el DMG.
- **Restricciones:** HTML, CSS y JS estáticos sin build (GitHub Pages bajo `/susurro/`, rutas relativas). Sin competidores. Umami sigue midiendo descargas (`data-umami-event`). La paleta de luz es la de la píldora de la app (0.1.7) y no se cambia aquí.
- **Supuestos:** ninguno inventado. Todos los números salen de `--selftest` (README de la app). Las capturas del Hub salen de `susurro --render`.

## Concepto

| | Idea | Ancla | Firma | O / F / Fe / P |
|---|---|---|---|---|
| A. Nombre | *Susurro*: todo el sitio en voz baja; el tipo crece de peso conforme «subes la voz» | el nombre | el peso del titular sigue al volumen | 3 / 3 / 4 / 3 |
| B. Material | **El sitio se usa con el gesto de la app.** La píldora vive abajo al centro, como en tu Mac; la mantienes presionada y lo que dices es luz que sube del borde; al soltar se vuelve tinta en la app | el gesto real (mantener, hablar, soltar) y la píldora real con su luz | mantener la píldora: la luz sube del borde inferior de la pantalla y la frase cae pulida en la ventana | 4 / 5 / 4 / 1 |
| C. Formal | Toda la página es una sola transcripción que se corrige con el scroll | la limpieza del texto | las muletillas caen al bajar | 3 / 4 / 3 / 3 |

**Elegido: B.** Es el producto mismo y no se puede mover a otra marca: nadie más tiene esta píldora ni este gesto. De C tomo el capítulo «Lo dicho, lo escrito» (el scroll pasa de luz a tinta).

```
Idea:        Lo que dices es luz; lo que se escribe es tinta. El sitio se maneja como la app: mantén, habla, suelta.
Metáfora:    la pantalla de tu Mac con la píldora abajo al centro.
Firma:       mantener la píldora (o ⌥ derecha): la luz sube del borde inferior del viewport, tus palabras aparecen
             en la píldora y al soltar caen pulidas en la ventana de la sección. Sin ventana a la vista, avisa,
             como la app.
Emoción:     «ah, así se siente». Calma, oscuridad de pantalla, y luz solo cuando hablas.
Verbo:       sube como luz, se asienta como tinta.
Screenshot:  el titular con «Habla.» encendido en luz, la ventana de Mail con el texto escrito y la píldora abajo
             con la luz subiendo.
```

## Sistema

### Paleta

| Rol | Valor | Uso |
|---|---|---|
| ground | `#0F0F11` | el negro de la cápsula de la píldora (`rgba(0.059, 0.059, 0.067)`). Todo el sitio |
| ground-2 | `#18181B` | superficies elevadas, ventanas oscuras |
| ink | `#F3F1F5` | texto sobre ground |
| muted | `#A6A3AD` | texto secundario (7.6:1 sobre ground) |
| line | `rgb(243 241 245 / .12)` | filetes |
| paper / paper-ink | `#FFFFFF` / `#141317` | las ventanas de apps: ahí vive la tinta |
| accent | `#FF3D99` | foco, selección, marcas. Es el rosa de la luz |
| luz (voz) | `#FF7866 #FF3D99 #C74DF2 #806BFF`, núcleo `#FFDBED` | solo como luz que sube del borde, nunca como fondo |
| luz (comando) | `#FFC740 #FF9E1C #FF6633 #FF4D80`, núcleo `#FFEDCC` | modo comando |

Default evitado a propósito: el degradado rosa-violeta es un cliché de IA. Aquí se justifica porque es literalmente la luz de la píldora de la app, y se usa con una regla estricta: solo existe pegada a un borde inferior y solo con la intensidad de la voz. En reposo queda un filete.

### Tipo

- **Display: Bricolage Grotesque** (variable, `wght` 200–800, `opsz`). Habla en dos pesos: lo dicho en 300 y en luz; lo escrito en 700 y en tinta. Tracking −0.045em en mega, −0.03em en xl.
- **Texto e interfaz: la fuente del sistema** (SF Pro en Mac). Es la letra en la que macOS escribe tu dictado, así que el texto «escrito» del sitio se ve como en tus apps.
- Escala fluida en `styles.css` (`--t-mega` a `--t-xs`). Cuerpo 17 a 18 px, interlínea 1.5.

### Retícula y ritmo

12 columnas, margen = gutter. Tres líneas fuertes: col 1, col 7, col 9. Ritmos: hero a pantalla completa, capítulo pegajoso (400svh), secciones aireadas (28u), FAQ ajustada (16u).

### Forma

Lo que se presiona es cápsula (radio 999px), igual que la píldora. Las ventanas usan 14px, como macOS. No hay otro radio.

### Movimiento

- Eases: `expo.out` para asentarse, `power3.out` para respuestas, `power2.inOut` para el capítulo.
- **Revelado de texto:** las líneas suben de su máscara y pasan de color luz a tinta (y de peso 300 al suyo en los titulares). Es el verbo.
- **Botones primarios:** la luz sube desde el borde inferior del botón (las mismas manchas de la píldora, en miniatura).
- **Navegación:** un filete con el degradado del borde de la píldora se dibuja desde el centro.
- **Pestañas de apps:** el marcador se desliza.
- **Reposo:** la píldora respira con un nivel de voz mínimo y la luz del borde sigue un poco al puntero en horizontal. Bajo movimiento reducido todo queda quieto y la píldora sigue funcionando.

### Composición

```
HERO (pantalla)                            CÓMO (póster)
[s susurro]        nav ... (Descargar)     1  Mantén  ▢fn         texto
Habla.                    ┌ Mail ─────┐    2  Habla   (en luz)    texto
Lo demás se               │ Para Laura│    3  Suelta. (en tinta)  texto
escribe solo.             │ ...       │
lede · CTA                └───────────┘    LO DICHO, LO ESCRITO (pegajoso)
          ╭─ píldora ─╮                    índice │ frase en luz → ventana en tinta
▁▁▁▁▁▁ luz del borde ▁▁▁▁▁▁

TONOS (lista índice)     COMANDO (par asimétrico)    FUNCIONES (captura real + índice)
Dijiste: ...             texto     ┌ ventana ┐       [Hub 7 col]  dl en 2 col
Casual   | salida                  │ selección│
Formal   | salida                  └ ámbar ───┘
Trabajo  | salida
Código   | salida

PRIVACIDAD (pantalla a sangre)       VELOCIDAD (datos)        PREGUNTAS     FINAL
┌───────────────────────────┐       80 a 200 ms  ...          h2 │ details   Dilo.
│ Tu voz no sale de tu Mac. │       < 2 ms                                   (Descargar)
│ ▁▁ la luz choca en el borde│      0.3 a 1.1 s                              pie
└───────────────────────────┘
```

### Prueba de lo genérico

- «Hero oscuro con un blob rosa-violeta» es lo que haría cualquiera. Cambio: no hay blob en reposo; la luz solo sube cuando mantienes la píldora y nace del borde inferior, como en la app.
- «Tres tarjetas de beneficios» en privacidad: son cuatro hechos en una lista con filetes, dentro de la pantalla dibujada.
- «Antes y después» en dos columnas: ahora es un capítulo con scroll donde la luz se vuelve tinta palabra por palabra.

### Decisiones

- **Sin loader ni WebGL.** Es una landing de producto: la teatralidad está en la píldora. La luz es CSS (`transform` y `opacity`).
- **Scroll suave con Lenis** sobre el reloj de GSAP. Con movimiento reducido, scroll nativo y nada animado.
- **Teclas reales:** además de la píldora, mantener ⌥, ⌘, ⌃ o ⇧ derechas dicta, igual que en la app. fn no llega al navegador.
- **Sin ventana a la vista,** soltar copia la frase al portapapeles y la píldora lo dice, como la app.
- `robots.txt` vive en la raíz de gomflo.dev, no en este repo.

### Lo que cambió con la QA

- **La píldora reposa en pequeño** fuera de las secciones con ventana (hero, comando, cierre, 404) para no tapar texto. Crece con el puntero, el foco o al mantenerla; su zona de toque sigue siendo amplia.
- **«Habla.» se ve desde el primer cuadro.** Es el LCP; solo se asienta, no aparece.
- **Sin View Transitions entre la 404 y el inicio.** Chrome lanzaba un error interno al navegar rápido; no vale un error de consola.
- **En reposo, la luz del borde respira apenas** y sigue al puntero en horizontal. En la 404 y en el cierre queda más encendida.
- El aviso `skipLinkFirst` de `shoot.mjs` es un falso positivo: busca «skip» en inglés. El primer foco es «Saltar al contenido».
- `robots.txt` y el sitemap de la raíz son de gomflo.dev; este repo publica `sitemap.xml` bajo `/susurro/`.

### Marca

La «s» blanca (SF Rounded Heavy) sobre el negro de la píldora, con la luz de la voz subiendo del borde inferior. Retícula de 64: la letra mide 31 de alto con su centro en y = 29; las manchas nacen en y = 66. El mismo dibujo vive en `favicon.svg`, el símbolo `#mark` de las páginas, `scripts/make_icon.swift` (ícono de la app) y `LogoMark` en `bridge/Hub.swift`. Si cambia uno, cambian los cuatro.
