// content.css is injected by the popup / background (chrome.scripting.insertCSS) before this script runs

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

// Pending requestAnimationFrame for scroll updates (0 = none)
let scrollFrame = 0;

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

// Read an element's margin / padding / border widths, as [top, right, bottom, left]
function readBoxModel(element) {
  const cs = window.getComputedStyle(element);
  const px = (prop) => parseFloat(cs[prop]) || 0;
  const sides = (prefix, suffix = '') =>
    ['Top', 'Right', 'Bottom', 'Left'].map(s => px(prefix + s + suffix));
  return { margin: sides('margin'), padding: sides('padding'), border: sides('border', 'Width') };
}

// Draw the box model overlays (write-only: everything is measured beforehand)
function drawBoxModel(rect, box, scrollX, scrollY) {
  if (!borderOverlay) return;
  const [mt, mr, mb, ml] = box.margin;
  const [pt, pr, pb, pl] = box.padding;
  const [bt, br, bb, bl] = box.border;

  // Border box, in page coordinates
  const left = rect.left + scrollX;
  const top = rect.top + scrollY;
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

// Draw the distance segments, hiding unused lines/labels (write-only)
function drawDistances(segs, scrollX, scrollY) {
  distanceLines.forEach((line, i) => {
    const s = segs[i];
    const label = distanceLabels[i];
    if (!s) {
      line.style.display = 'none';
      label.style.display = 'none';
      return;
    }
    const horizontal = s.y1 === s.y2;
    const x = Math.min(s.x1, s.x2) + scrollX;
    const y = Math.min(s.y1, s.y2) + scrollY;
    placeBox(line, x, y, horizontal ? s.length : 1, horizontal ? 1 : s.length);
    label.textContent = `${Math.round(s.length)}`;
    label.style.left = `${(s.x1 + s.x2) / 2 + scrollX}px`;
    label.style.top = `${(s.y1 + s.y2) / 2 + scrollY}px`;
    label.style.display = 'block';
  });
}

// Redraw every overlay for the hovered element and the anchor.
// All layout reads happen first, then all writes, so it costs at most one reflow.
// With Alt held over another element it draws distance lines; otherwise the box model.
// Returns the hovered element's rect (or null).
function render() {
  if (!overlay) return null;
  const target = selectedElement;

  // Read phase
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const anchorRect = anchorElement ? anchorElement.getBoundingClientRect() : null;
  const rect = target ? target.getBoundingClientRect() : null;
  const segs = altDown && anchorRect && rect && target !== anchorElement
    ? measureGap(anchorRect, rect)
    : [];
  const box = rect && segs.length === 0 ? readBoxModel(target) : null;

  // Write phase
  if (anchorRect) {
    placeBox(anchorOutline, anchorRect.left + scrollX, anchorRect.top + scrollY, anchorRect.width, anchorRect.height);
  } else {
    anchorOutline.style.display = 'none';
  }
  drawDistances(segs, scrollX, scrollY);
  if (!rect) return null;

  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.top = `${rect.top + scrollY}px`;
  overlay.style.left = `${rect.left + scrollX}px`;
  overlay.style.display = 'block';

  if (box) drawBoxModel(rect, box, scrollX, scrollY);
  else hideBoxModelOverlays();
  return rect;
}

// Hide everything tied to the hovered element (the anchor outline stays)
function hideHoverOverlays() {
  hideBoxModelOverlays();
  allDistanceOverlays().forEach(el => { el.style.display = 'none'; });
  overlay.style.display = 'none';
  infoBox.style.display = 'none';
}

// Position the size label near the cursor
function placeInfoBox(e) {
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
}

// Mouse move handler
function onMouseMove(e) {
  if (!isActive) return;
  const element = document.elementFromPoint(e.clientX, e.clientY);
  const valid = element && element !== overlay && element !== infoBox &&
    !element.classList.contains('pixelruler-tooltip') && !element.id.includes('pixelruler-');

  if (!valid) {
    // Hide overlays when not hovering over a valid element
    if (selectedElement) {
      selectedElement = null;
      hideHoverOverlays();
    }
    return;
  }

  // Only re-measure when the hovered element or the Alt state changes;
  // moving within the same element just moves the size label
  if (element !== selectedElement || e.altKey !== altDown) {
    selectedElement = element;
    setAltDown(e.altKey); // also catches Alt pressed/released while the page lacked focus
    const rect = render();
    infoBox.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}px`;
    infoBox.style.display = 'block';
  }
  placeInfoBox(e);
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
}

// Keyboard handler: Alt starts distance measuring, ESC closes tooltip or deactivates
function onKeyDown(e) {
  if (!isActive) return;
  if (e.key === 'Alt') {
    e.preventDefault();
    if (altDown) return; // key auto-repeat
    setAltDown(true);
    render();
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
  render();
}

// Scroll handler: overlays use page coordinates, so they only need re-measuring
// for fixed/sticky content. Coalesce to one redraw per frame.
function onScroll() {
  if (!isActive || scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    if (isActive) render();
  });
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
  cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
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
