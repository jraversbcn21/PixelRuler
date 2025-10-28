# PixelRuler 📏

Una extensión de Chrome para medir dimensiones de elementos web con información detallada de tipografía y espaciado.

## 🚀 Características

- **Medición de dimensiones**: Ancho, alto y posición de elementos
- **Información de tipografía**: Tamaño de fuente, familia, peso, altura de línea y color (en hexadecimal)
- **Información de espaciado**: Márgenes, relleno y bordes
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
   git clone https://github.com/tu-usuario/PixelRuler.git
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
   - Haz clic en el icono de PixelRuler en la barra de herramientas
   - Presiona "Activar Medición"

2. **Navega y mide**
   - Mueve el cursor sobre cualquier elemento para ver dimensiones básicas
   - Haz clic en un elemento para ver información detallada

3. **Información disponible**
   - **Dimensiones**: Ancho, alto, posición X/Y
   - **Tipografía**: Tamaño, familia, peso, altura de línea, color
   - **Espaciado**: Márgenes, relleno, bordes

4. **Copia información**
   - Haz clic derecho en el tooltip para copiar toda la información

5. **Desactiva**
   - Presiona ESC o haz clic en "Desactivar Medición"

## ⚙️ Configuración

- **Idioma**: Cambia entre español e inglés
- **Color del overlay**: Personaliza el color de resaltado
- **Reiniciar color**: Vuelve al color por defecto

## 🛠️ Tecnologías

- **Manifest V3**: Última versión de extensiones de Chrome
- **JavaScript vanilla**: Sin dependencias externas
- **CSS3**: Estilos modernos y responsivos
- **Chrome APIs**: Storage, Scripting, Tabs

## 📁 Estructura del proyecto

```
PixelRuler/
├── manifest.json          # Configuración de la extensión
├── popup.html             # Interfaz del popup
├── popup.js               # Lógica del popup
├── popup.css              # Estilos del popup
├── content.js             # Script de contenido principal
├── content.css            # Estilos para el overlay y tooltips
├── icons/                 # Iconos de la extensión
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # Este archivo
```

## 🎨 Capturas de pantalla

### Medición básica
![Medición básica](screenshots/basic-measurement.png)

### Información detallada
![Información detallada](screenshots/detailed-info.png)

### Configuración
![Configuración](screenshots/settings.png)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🐛 Reportar bugs

Si encuentras algún bug, por favor [abre un issue](https://github.com/tu-usuario/PixelRuler/issues) con:
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

**Tu Nombre** - [@tu-usuario](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- Inspirado en herramientas de medición para diseñadores
- Comunidad de desarrolladores de extensiones de Chrome
- Usuarios que proporcionaron feedback y sugerencias

---

⭐ **¡Si te gusta este proyecto, dale una estrella!** ⭐