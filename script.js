'use strict';

const form = document.getElementById('qr-form');
const modes = document.querySelectorAll('input[name="mode"]');
const linkField = document.getElementById('link-field');
const textField = document.getElementById('text-field');
const linkInput = document.getElementById('link-input');
const textInput = document.getElementById('text-input');
const error = document.getElementById('field-error');
const status = document.getElementById('result-status');
const canvas = document.getElementById('qr-canvas');
const emptyState = document.getElementById('empty-state');
const download = document.getElementById('download-button');
let currentResult = null;
let generation = 0;

// Use the same standards-based UTF-8 encoding as the byte limit check.
qrcode.stringToBytes = (value) => Array.from(new TextEncoder().encode(value));

function currentMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

function invalidateResult() {
  generation += 1;
  currentResult = null;
  canvas.hidden = true;
  emptyState.hidden = false;
  download.disabled = true;
  status.textContent = 'Готов к созданию';
}

function clearError() {
  error.hidden = true;
  error.textContent = '';
  linkInput.removeAttribute('aria-invalid');
  textInput.removeAttribute('aria-invalid');
}

function showMode() {
  const isLink = currentMode() === 'link';
  linkField.hidden = !isLink;
  textField.hidden = isLink;
  clearError();
  invalidateResult();
}

function showError(message, field) {
  error.textContent = message;
  error.hidden = false;
  if (field) {
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }
  status.textContent = 'Исправьте данные и попробуйте ещё раз';
}

function drawCode(code) {
  const size = canvas.width;
  const count = code.getModuleCount();
  const cell = Math.floor(size / (count + 8));
  if (cell < 1) throw new Error('QR code does not fit');
  const offset = Math.floor((size - count * cell) / 2);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size, size);
  context.fillStyle = '#000000';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (code.isDark(row, col)) context.fillRect(offset + col * cell, offset + row * cell, cell, cell);
    }
  }
}

modes.forEach((mode) => mode.addEventListener('change', showMode));
[linkInput, textInput].forEach((field) => field.addEventListener('input', () => {
  clearError();
  invalidateResult();
}));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  invalidateResult();
  clearError();
  const mode = currentMode();
  const field = mode === 'link' ? linkInput : textInput;
  const result = QrValidation.validateInput(mode, field.value);
  if (!result.ok) {
    showError(result.message, field);
    return;
  }
  try {
    const code = qrcode(0, 'M');
    code.addData(result.value, 'Byte');
    code.make();
    drawCode(code);
    currentResult = { mode, value: result.value };
    emptyState.hidden = true;
    canvas.hidden = false;
    download.disabled = false;
    status.textContent = 'QR-код готов к скачиванию';
  } catch (_) {
    invalidateResult();
    showError('Не удалось создать QR-код. Попробуйте ещё раз.');
  }
});

download.addEventListener('click', () => {
  if (!currentResult) return;
  const snapshot = generation;
  const mode = currentResult.mode;
  try {
    canvas.toBlob((blob) => {
      if (snapshot !== generation || !currentResult) return;
      if (!blob) {
        showError('Не удалось сохранить PNG. Попробуйте ещё раз.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = mode === 'link' ? 'qr-link.png' : 'qr-text.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  } catch (_) {
    showError('Не удалось сохранить PNG. Попробуйте ещё раз.');
  }
});
