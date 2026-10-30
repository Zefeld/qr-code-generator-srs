'use strict';

const form = document.getElementById('qr-form');
const modes = document.querySelectorAll('input[name="mode"]');
const linkField = document.getElementById('link-field');
const textField = document.getElementById('text-field');
const error = document.getElementById('field-error');
const status = document.getElementById('result-status');

function currentMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

function showMode() {
  const isLink = currentMode() === 'link';
  linkField.hidden = !isLink;
  textField.hidden = isLink;
  error.hidden = true;
  document.getElementById('link-input').removeAttribute('aria-invalid');
  document.getElementById('text-input').removeAttribute('aria-invalid');
  status.textContent = 'Готов к созданию';
}

modes.forEach((mode) => mode.addEventListener('change', showMode));
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const field = document.getElementById(currentMode() === 'link' ? 'link-input' : 'text-input');
  const result = QrValidation.validateInput(currentMode(), field.value);
  field.setAttribute('aria-invalid', String(!result.ok));
  error.hidden = result.ok;
  error.textContent = result.ok ? '' : result.message;
  status.textContent = result.ok ? 'Данные проверены' : 'Исправьте данные';
  if (!result.ok) field.focus();
});
