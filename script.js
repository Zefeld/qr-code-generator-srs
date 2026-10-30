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
  status.textContent = 'Готов к созданию';
}

modes.forEach((mode) => mode.addEventListener('change', showMode));
form.addEventListener('submit', (event) => {
  event.preventDefault();
  status.textContent = 'Генерация будет добавлена на следующем этапе';
});
