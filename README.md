# PixelRuler 📏

Una extensión de Chrome para medir dimensiones de elementos web con información detallada de tipografía y espaciado.

## 🚀 Características

- **Medición de dimensiones**: Ancho, alto y posición de elementos
- **Información de tipografía**: Tamaño de fuente, familia, peso, altura de línea y color (en hexadecimal)
- **Información de espaciado**: Márgenes, relleno y bordes
- **Box model visual**: Padding, borde y margen resaltados con colores al hacer hover
- **Distancia entre elementos**: Mantén Alt para medir los px entre dos elementos, como en Figma
- **Atajo de teclado**: `Ctrl+Shift+X` activa y desactiva la medición sin abrir el popup
- **Interfaz intuitiva**: Hover para vista previa, clic para información detallada
- **Tooltip persistente**: La información permanece visible hasta el siguiente clic
- **Posicionamiento inteligente**: El tooltip aparece al costado sin tapar el elemento
- **Multiidioma**: Soporte para español e inglés
- **Colores personalizables**: Cambia el color del overlay
- **Copia rápida**: Clic derecho en el tooltip para copiar toda la información

## 📦 Instalación

### Desde el código fuente:

1. **Descarga o clona este repositorio**
   ```bash
   git clone https://github.com/jraversbcn21/PixelRuler.git
   ```

2. **Abre Chrome y ve a las extensiones**
   - Escribe `chrome://extensions/` en la barra de direcciones
   - O ve a Menú → Más herramientas → Extensiones

3. **Activa el modo desarrollador**
   - Activa el interruptor "Modo de desarrollador" en la esquina superior derecha

4. **Carga la extensión**
   - Haz clic en "Cargar extensión sin empaquetar"
   - Selecciona la carpeta donde descargaste PixelRuler

## 🎯 Cómo usar

1. **Activa la extensión**
   - Pulsa `Ctrl+Shift+X`, o
   - Haz clic en el icono de PixelRuler en la barra de herramientas y presiona "Activar Medición"

2. **Navega y mide**
   - Mueve el cursor sobre cualquier elemento para ver sus dimensiones y su box model (padding en morado, borde en amarillo, margen en naranja)
   - Haz clic en un elemento para ver información detallada

3. **Mide distancias entre elementos**
   - Pon el cursor sobre un elemento y mantén pulsado **Alt**: queda fijado con un contorno rojo
   - Sin soltar Alt, pasa el cursor sobre otro elemento para ver la distancia en px
   - Suelta Alt para volver al modo normal

4. **Información disponible**
   - **Dimensiones**: Ancho, alto, posición X/Y
   - **Tipografía**: Tamaño, familia, peso, altura de línea, color
   - **Espaciado**: Márgenes, relleno, bordes

5. **Copia información**
   - Haz clic derecho en el tooltip para copiar toda la información

6. **Desactiva**
   - Pulsa `Ctrl+Shift+X`, presiona ESC o haz clic en "Desactivar Medición"

## ⚙️ Configuración

- **Idioma**: Cambia entre español e inglés
- **Color del overlay**: Personaliza el color de resaltado
- **Reiniciar color**: Vuelve al color por defecto
- **Atajo de teclado**: Si `Ctrl+Shift+X` no responde, asígnalo (o cámbialo) en `chrome://extensions/shortcuts`

## 🛠️ Tecnologías

- **Manifest V3**: Última versión de extensiones de Chrome
- **JavaScript vanilla**: Sin dependencias externas
- **CSS3**: Estilos modernos y responsivos
- **Chrome APIs**: Storage, Scripting, Tabs, Commands

## 📁 Estructura del proyecto

```
PixelRuler/
├── manifest.json          # Configuración de la extensión
├── popup.html             # Interfaz del popup
├── popup.js               # Lógica del popup
├── popup.css              # Estilos del popup
├── content.js             # Script de contenido principal
├── content.css            # Estilos para el overlay y tooltips
├── measure.js             # Geometría de distancias entre elementos
├── measure.test.js        # Test de la geometría (node measure.test.js)
├── background.js          # Atajo de teclado
├── privacy-policy.html    # Política de privacidad
├── icons/                 # Iconos de la extensión
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # Este archivo
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🐛 Reportar bugs

Si encuentras algún bug, por favor [abre un issue](https://github.com/jraversbcn21/PixelRuler/issues) con:
- Descripción del problema
- Pasos para reproducirlo
- Versión de Chrome
- Sistema operativo

## 📈 Roadmap

- [ ] Soporte para más unidades de medida (em, rem, %)
- [ ] Exportar mediciones a CSV/JSON
- [ ] Modo de comparación entre elementos
- [ ] Soporte para elementos responsive
- [ ] Integración con herramientas de diseño

## 👨‍💻 Autor

**SidMaierLabs** - [@jraversbcn21](https://github.com/jraversbcn21)

## 🙏 Agradecimientos

- Inspirado en herramientas de medición para diseñadores
- Comunidad de desarrolladores de extensiones de Chrome
- Usuarios que proporcionaron feedback y sugerencias

---

⭐ **¡Si te gusta este proyecto, dale una estrella!** ⭐
