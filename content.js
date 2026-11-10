// Inject content.css
const link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = chrome.runtime.getURL('content.css');
document.head.appendChild(link);

// Translations
const translations = {
  en: {
    width: 'Width',
    height: 'Height',
    position: 'Position',
    fontSize: 'Font Size',
    fontFamily: 'Font Family',
    fontWeight: 'Font Weight',
    lineHeight: 'Line Height',
    color: 'Color',
    margin: 'Margin',
    padding: 'Padding',
    border: 'Border',
    copied: 'Copied to clipboard!',
    clickToCopy: 'Right-click to copy'
  },
  es: {
    width: 'Ancho',
    height: 'Alto',
    position: 'Posición',
    fontSize: 'Tamaño de Fuente',
    fontFamily: 'Familia de Fuente',
    fontWeight: 'Peso de Fuente',
    lineHeight: 'Altura de Línea',
    color: 'Color',
    margin: 'Margen',
    padding: 'Relleno',
    border: 'Borde',
    copied: '¡Copiado al portapapeles!',
    clickToCopy: 'Clic derecho para copiar'
  }
};

let isActive = false;
let overlay = null;
let infoBox = null;
let selectedElement = null;
let currentTooltips = [];
let currentLang = 'es';
let overlayColor = '#4285f4';

// Box model overlays: padding/margin rings as 4 strips each (top, right, bottom, left)
let paddingEdges = [];
let marginEdges = [];
let borderOverlay = null;

// Distance measurement: holding Alt anchors the hovered element, hovering others measures to it
let anchorElement = null;
let anchorOutline = null;
let distanceLines = [];
let distanceLabels = [];
let altDown = false;

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(['language', 'overlayColor'], (result) => {
    currentLang = result.language || 'es';
    overlayColor = result.overlayColor || '#4285f4';
    updateOverlayColor();
  });
}

// Update overlay color
function updateOverlayColor() {
  if (overlay) {
    overlay.style.borderColor = overlayColor;
    overlay.style.backgroundColor = hexToRgba(overlayColor, 0.1);
  }
}

// Convert hex to rgba
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Convert RGB color to hexadecimal
function rgbToHex(rgb) {
  // Handle different RGB formats
  if (rgb.startsWith('rgb(')) {
    const values = rgb.match(/\d+/g);
    if (values && values.length >= 3) {
      const r = parseInt(values[0]);
      const g = parseInt(values[1]);
      const b = parseInt(values[2]);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    }
  } else if (rgb.startsWith('rgba(')) {
    const values = rgb.match(/\d+/g);
    if (values && values.length >= 3) {
      const r = parseInt(values[0]);
      const g = parseInt(values[1]);
      const b = parseInt(values[2]);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    }
  }
  // If already hex or other format, return as is
  return rgb;
}

// Get typography information from element
function getTypographyInfo(element) {
  const computedStyle = window.getComputedStyle(element);
  
  const fontSize = computedStyle.fontSize;
  const fontFamily = computedStyle.fontFamily;
  const fontWeight = computedStyle.fontWeight;
  const lineHeight = computedStyle.lineHeight;
  const color = computedStyle.color;
  
  // Convert color to hex format
  const colorHex = rgbToHex(color);
  
  return {
    fontSize: fontSize,
    fontFamily: fontFamily,
    fontWeight: fontWeight,
    lineHeight: lineHeight,
    color: colorHex
  };
}

// Get spacing information from element
function getSpacingInfo(element) {
  const computedStyle = window.getComputedStyle(element);
  
  const margin = computedStyle.margin;
  const padding = computedStyle.padding;
  const borderWidth = computedStyle.borderWidth;
  const borderStyle = computedStyle.borderStyle;
  const borderColor = computedStyle.borderColor;
  
  // Convert border color to hex format
  const borderColorHex = rgbToHex(borderColor);
  
  // Format border info with hex color
  const border = `${borderWidth} ${borderStyle} ${borderColorHex}`;
  
  return {
    margin: margin,
    padding: padding,
    border: border
  };
}

// Function to create the overlay
function createOverlay() {
  overlay = document.createElement('div');
  overlay.id = 'pixelruler-overlay';
  document.body.appendChild(overlay);

  // Create info box that follows the cursor
  infoBox = document.createElement('div');
  infoBox.id = 'pixelruler-infobox';
  infoBox.style.display = 'none';
  document.body.appendChild(infoBox);

  // Create box model overlays
  createBoxModelOverlays();
}

// Function to create box model overlays
function createBoxModelOverlays() {
  const make = (className) => {
    const el = document.createElement('div');
    el.className = className;
    document.body.appendChild(el);
    return el;
  };
  paddingEdges = [0, 1, 2, 3].map(() => make('pixelruler-padding-edge'));
  marginEdges = [0, 1, 2, 3].map(() => make('pixelruler-margin-edge'));
  borderOverlay = make('pixelruler-border-overlay');

  // Distance overlays: anchor outline + up to 4 lines with labels
  anchorOutline = make('pixelruler-anchor');
  distanceLines = [0, 1, 2, 3].map(() => make('pixelruler-distance-line'));
  distanceLabels = [0, 1, 2, 3].map(() => make('pixelruler-distance-label'));
}

function allBoxModelOverlays() {
  return [borderOverlay, ...paddingEdges, ...marginEdges].filter(Boolean);
}

function allDistanceOverlays() {
  return [...distanceLines, ...distanceLabels];
}

// Function to remove the overlay
function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
  if (infoBox) {
    infoBox.remove();
    infoBox = null;
  }
  
  // Remove box model overlays
  allBoxModelOverlays().forEach(el => el.remove());
  paddingEdges = [];
  marginEdges = [];
  borderOverlay = null;

  // Remove distance overlays
  [anchorOutline, ...allDistanceOverlays()].forEach(el => el && el.remove());
  anchorOutline = null;
  distanceLines = [];
  distanceLabels = [];
  anchorElement = null;
  altDown = false;

  // Clean up any remaining tooltips more thoroughly
  currentTooltips.forEach(tooltip => {
    if (tooltip && tooltip.parentNode) {
      tooltip.remove();
    }
  });
  currentTooltips = [];
  
  // Also clean any existing tooltips in the DOM
  const existingTooltips = document.querySelectorAll('.pixelruler-tooltip');
  existingTooltips.forEach(tooltip => tooltip.remove());
}

// Function to copy to clipboard
function copyToClipboard(text) {
  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCopyNotification();
    }).catch(err => {
      fallbackCopyToClipboard(text);
    });
  } else {
    // Use fallback method
    fallbackCopyToClipboard(text);
  }
}

// Fallback copy method using document.execCommand
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';
  document.body.appendChild(textArea);
  
  try {
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    
    if (successful) {
      showCopyNotification();
    } else {
      showCopyError();
    }
  } catch (err) {
    showCopyError();
  } finally {
    document.body.removeChild(textArea);
  }
}

// Show copy notification
function showCopyNotification() {
  const notification = document.createElement('div');
  notification.className = 'pixelruler-notification pixelruler-success';
  notification.textContent = translations[currentLang].copied;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2000);
}

// Show copy error notification
function showCopyError() {
  const notification = document.createElement('div');
  notification.className = 'pixelruler-notification pixelruler-error';
  notification.textContent = 'Error al copiar. Intenta seleccionar y copiar manualmente.';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Function to show dimensions
function showDimensions(element) {
  const rect = element.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  const top = Math.round(rect.top + window.scrollY);
  const left = Math.round(rect.left + window.scrollX);

  // Get typography and spacing information
  const typography = getTypographyInfo(element);
  const spacing = getSpacingInfo(element);

  const copyText = `${width}px × ${height}px (X: ${left}px, Y: ${top}px) | Font: ${typography.fontSize} ${typography.fontFamily} ${typography.fontWeight} | Line-height: ${typography.lineHeight} | Color: ${typography.color} | Margin: ${spacing.margin} | Padding: ${spacing.padding} | Border: ${spacing.border}`;

  // Clean previous tooltips more thoroughly
  currentTooltips.forEach(tooltip => {
    if (tooltip && tooltip.parentNode) {
      tooltip.remove();
    }
  });
  currentTooltips = [];
  
  // Also clean any existing tooltips in the DOM
  const existingTooltips = document.querySelectorAll('.pixelruler-tooltip');
  existingTooltips.forEach(tooltip => tooltip.remove());

  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'pixelruler-tooltip';
  tooltip.innerHTML = `
    <div><strong>${translations[currentLang].width}:</strong> ${width}px</div>
    <div><strong>${translations[currentLang].height}:</strong> ${height}px</div>
    <div><strong>${translations[currentLang].position}:</strong> X: ${left}px, Y: ${top}px</div>
    <div class="pixelruler-divider"></div>
    <div><strong>${translations[currentLang].fontSize}:</strong> ${typography.fontSize}</div>
    <div class="pixelruler-font-family">
      <strong>${translations[currentLang].fontFamily}:</strong><br>
      <span class="pixelruler-font-family-value">${typography.fontFamily}</span>
    </div>
    <div><strong>${translations[currentLang].fontWeight}:</strong> ${typography.fontWeight}</div>
    <div><strong>${translations[currentLang].lineHeight}:</strong> ${typography.lineHeight}</div>
    <div><strong>${translations[currentLang].color}:</strong> ${typography.color}</div>
    <div class="pixelruler-divider"></div>
    <div><strong>${translations[currentLang].margin}:</strong> ${spacing.margin}</div>
    <div><strong>${translations[currentLang].padding}:</strong> ${spacing.padding}</div>
    <div><strong>${translations[currentLang].border}:</strong> ${spacing.border}</div>
    <div class="pixelruler-copy-hint">${translations[currentLang].clickToCopy}</div>
  `;

  // Set styles first
  tooltip.style.cursor = 'pointer';
  tooltip.style.transition = 'transform 0.2s ease';
  tooltip.style.pointerEvents = 'auto';

  // Add to DOM first
  document.body.appendChild(tooltip);

  // Only right-click to copy (most reliable method)
  tooltip.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    copyToClipboard(copyText);
  });

  // Add visual feedback on hover
  tooltip.addEventListener('mouseenter', () => {
    tooltip.style.transform = 'scale(1.02)';
  });

  tooltip.addEventListener('mouseleave', () => {
    tooltip.style.transform = 'scale(1)';
  });


  // Smart positioning - show tooltip to the side of the element
  const tooltipWidth = 280; // Estimated tooltip width
  const tooltipHeight = 300; // Estimated tooltip height
  const margin = 15; // Margin from element
  
  let tooltipTop = rect.top + window.scrollY;
  let tooltipLeft = rect.right + window.scrollX + margin; // Default: right side
  
  // Check if tooltip fits on the right side
  if (tooltipLeft + tooltipWidth > window.innerWidth + window.scrollX) {
    // Try left side
    tooltipLeft = rect.left + window.scrollX - tooltipWidth - margin;
    
    // If doesn't fit on left either, position it centered below
    if (tooltipLeft < window.scrollX) {
      tooltipLeft = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
      tooltipTop = rect.bottom + window.scrollY + margin;
      
      // If tooltip goes off screen horizontally when centered, adjust
      if (tooltipLeft < window.scrollX) {
        tooltipLeft = window.scrollX + 10;
      } else if (tooltipLeft + tooltipWidth > window.innerWidth + window.scrollX) {
        tooltipLeft = window.innerWidth + window.scrollX - tooltipWidth - 10;
      }
    }
  }
  
  // Adjust vertical position if tooltip goes off screen
  if (tooltipTop + tooltipHeight > window.innerHeight + window.scrollY) {
    tooltipTop = window.innerHeight + window.scrollY - tooltipHeight - 10;
  }
  if (tooltipTop < window.scrollY) {
    tooltipTop = window.scrollY + 10;
  }

  tooltip.style.top = `${tooltipTop}px`;
  tooltip.style.left = `${tooltipLeft}px`;
  
  // Tooltip is already added to DOM above
  currentTooltips.push(tooltip);

  // Keep tooltip persistent until next click outside
  // Remove the auto-timeout, tooltip will persist until next click
}

// Position an overlay, or hide it when it has no area
function placeBox(el, left, top, width, height) {
  if (width > 0 && height > 0) {
    Object.assign(el.style, {
      left: `${left}px`, top: `${top}px`,
      width: `${width}px`, height: `${height}px`,
      display: 'block'
    });
  } else {
    el.style.display = 'none';
  }
}

// Function to show box model overlays
function showBoxModelOverlays(element) {
  if (!borderOverlay) return;
  const cs = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const px = (prop) => parseFloat(cs[prop]) || 0;
  const sides = (prefix, suffix = '') =>
    ['Top', 'Right', 'Bottom', 'Left'].map(s => px(prefix + s + suffix));

  const [mt, mr, mb, ml] = sides('margin');
  const [pt, pr, pb, pl] = sides('padding');
  const [bt, br, bb, bl] = sides('border', 'Width');

  // Border box, in page coordinates
  const left = rect.left + window.scrollX;
  const top = rect.top + window.scrollY;
  const w = rect.width;
  const h = rect.height;

  // Border (only when the element has one)
  placeBox(borderOverlay, left, top, (bt || br || bb || bl) ? w : 0, h);

  // Padding ring, inside the border
  const il = left + bl, it = top + bt, iw = w - bl - br, ih = h - bt - bb;
  placeBox(paddingEdges[0], il, it, iw, pt);
  placeBox(paddingEdges[1], il + iw - pr, it, pr, ih);
  placeBox(paddingEdges[2], il, it + ih - pb, iw, pb);
  placeBox(paddingEdges[3], il, it, pl, ih);

  // Margin ring, outside the border box (negative margins are skipped)
  placeBox(marginEdges[0], left, top - mt, w, mt);
  placeBox(marginEdges[1], left + w, top, mr, h);
  placeBox(marginEdges[2], left, top + h, w, mb);
  placeBox(marginEdges[3], left - ml, top, ml, h);
}

// Function to hide box model overlays
function hideBoxModelOverlays() {
  allBoxModelOverlays().forEach(el => { el.style.display = 'none'; });
}

// Outline the anchor element, or hide the outline when there is none
function placeAnchorOutline() {
  if (!anchorOutline) return;
  if (!anchorElement) {
    anchorOutline.style.display = 'none';
    return;
  }
  const r = anchorElement.getBoundingClientRect();
  placeBox(anchorOutline, r.left + window.scrollX, r.top + window.scrollY, r.width, r.height);
}

// With Alt held over another element, draw distance lines to the anchor;
// otherwise show the hovered element's box model
function updateDistances() {
  const target = selectedElement;
  const segs = altDown && anchorElement && target && target !== anchorElement
    ? measureGap(anchorElement.getBoundingClientRect(), target.getBoundingClientRect())
    : [];

  distanceLines.forEach((line, i) => {
    const s = segs[i];
    const label = distanceLabels[i];
    if (!s) {
      line.style.display = 'none';
      label.style.display = 'none';
      return;
    }
    const horizontal = s.y1 === s.y2;
    const x = Math.min(s.x1, s.x2) + window.scrollX;
    const y = Math.min(s.y1, s.y2) + window.scrollY;
    placeBox(line, x, y, horizontal ? s.length : 1, horizontal ? 1 : s.length);
    label.textContent = `${Math.round(s.length)}`;
    label.style.left = `${(s.x1 + s.x2) / 2 + window.scrollX}px`;
    label.style.top = `${(s.y1 + s.y2) / 2 + window.scrollY}px`;
    label.style.display = 'block';
  });

  if (segs.length > 0) hideBoxModelOverlays();
  else if (target) showBoxModelOverlays(target);
}

// Mouse move handler
function onMouseMove(e) {
  if (!isActive) return;
  const element = document.elementFromPoint(e.clientX, e.clientY);
  
  if (element && element !== overlay && element !== infoBox && !element.classList.contains('pixelruler-tooltip') &&
      !element.id.includes('pixelruler-')) {
    selectedElement = element;
    const rect = element.getBoundingClientRect();
    
    // Distance lines (Alt) or box model overlays
    setAltDown(e.altKey); // also catches Alt pressed/released while the page lacked focus
    updateDistances();

    // Update main overlay
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.display = 'block';

    // Update info box
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    infoBox.textContent = `${width} × ${height}px`;
    infoBox.style.display = 'block';
    
    // Position info box near cursor
    let infoTop = e.clientY + 15;
    let infoLeft = e.clientX + 15;
    
    if (infoTop + 30 > window.innerHeight) {
      infoTop = e.clientY - 35;
    }
    if (infoLeft + 100 > window.innerWidth) {
      infoLeft = e.clientX - 115;
    }
    
    infoBox.style.top = `${infoTop + window.scrollY}px`;
    infoBox.style.left = `${infoLeft + window.scrollX}px`;
  } else {
    // Hide overlays when not hovering over a valid element
    hideBoxModelOverlays();
    allDistanceOverlays().forEach(el => { el.style.display = 'none'; });
    overlay.style.display = 'none';
    infoBox.style.display = 'none';
  }
}

// Click handler
function onClick(e) {
  if (!isActive) return;
  
  // If clicking on overlay, infoBox, or tooltip, don't do anything
  if (e.target === overlay || e.target === infoBox || e.target.classList.contains('pixelruler-tooltip')) {
    return;
  }
  
  // If clicking on a tooltip element, don't close it
  if (e.target.closest('.pixelruler-tooltip')) {
    return;
  }
  
  e.preventDefault();
  e.stopPropagation();
  
  // If there's already a tooltip visible, remove it first
  if (currentTooltips.length > 0) {
    currentTooltips.forEach(tooltip => {
      if (tooltip && tooltip.parentNode) {
        tooltip.remove();
      }
    });
    currentTooltips = [];
  }
  
  // Show new tooltip for the selected element
  if (selectedElement) {
    showDimensions(selectedElement);
  }
}

// Pressing Alt anchors the hovered element; releasing it drops the anchor
function setAltDown(down) {
  if (down === altDown) return;
  altDown = down;
  anchorElement = down ? selectedElement : null;
  placeAnchorOutline();
}

// Keyboard handler: Alt starts distance measuring, ESC closes tooltip or deactivates
function onKeyDown(e) {
  if (!isActive) return;
  if (e.key === 'Alt') {
    e.preventDefault();
    setAltDown(true);
    updateDistances();
  } else if (e.key === 'Escape') {
    // Close any visible tooltips first
    if (currentTooltips.length > 0) {
      currentTooltips.forEach(tooltip => {
        if (tooltip && tooltip.parentNode) {
          tooltip.remove();
        }
      });
      currentTooltips = [];
    } else {
      // If no tooltips visible, deactivate the ruler
      deactivate();
    }
  }
}

// Releasing Alt goes back to the box model; preventDefault stops Chrome focusing its menu
function onKeyUp(e) {
  if (!isActive || e.key !== 'Alt') return;
  e.preventDefault();
  setAltDown(false);
  updateDistances();
}

// Scroll handler to update overlay position
function onScroll() {
  if (!isActive || !selectedElement) return;
  const rect = selectedElement.getBoundingClientRect();
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  
  // Update anchor, distance and box model overlays
  placeAnchorOutline();
  updateDistances();
}

// Activate measurement mode
function activate() {
  if (isActive) return;
  isActive = true;
  loadSettings();
  createOverlay();
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('scroll', onScroll);
  document.body.style.cursor = 'crosshair';
  console.log('PixelRuler activado');
}

// Deactivate measurement mode
function deactivate() {
  if (!isActive) return;
  isActive = false;
  removeOverlay();
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('click', onClick, true);
  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('keyup', onKeyUp);
  document.removeEventListener('scroll', onScroll);
  document.body.style.cursor = '';
  selectedElement = null;
  console.log('PixelRuler desactivado');
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'activate') {
    activate();
    sendResponse({ status: 'activated' });
  } else if (request.action === 'deactivate') {
    deactivate();
    sendResponse({ status: 'deactivated' });
  } else if (request.action === 'toggle') {
    isActive ? deactivate() : activate();
    sendResponse({ status: isActive ? 'activated' : 'deactivated' });
  } else if (request.action === 'updateSettings') {
    if (request.language) {
      currentLang = request.language;
    }
    if (request.overlayColor) {
      overlayColor = request.overlayColor;
      updateOverlayColor();
    }
    sendResponse({ status: 'updated' });
  }
  return true;
});

// Automatically activate when content script is injected
activate();
