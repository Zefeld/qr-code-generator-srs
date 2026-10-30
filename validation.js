/* Validation is shared by the browser and the Node.js test suite. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QrValidation = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const MAX_BYTES = 1000;
  function validateInput(mode, value) {
    const bytes = new TextEncoder().encode(value).length;
    if (!value || !value.trim()) return { ok: false, message: mode === 'link' ? 'Введите ссылку.' : 'Введите непустой текст.', bytes };
    if (bytes > MAX_BYTES) return { ok: false, message: 'Длина не должна превышать 1000 байт UTF-8.', bytes };
    if (mode === 'link') {
      if (/\s|[\u0000-\u001f\u007f-\u009f]/u.test(value)) return { ok: false, message: 'Уберите пробелы и управляющие символы из ссылки.', bytes };
      if (!/^https?:\/\//i.test(value)) return { ok: false, message: 'Укажите ссылку с протоколом http:// или https://.', bytes };
      try {
        const parsed = new URL(value);
        if (!parsed.hostname || !/^https?:$/.test(parsed.protocol)) throw new TypeError('Invalid host');
        const authority = value.match(/^https?:\/\/([^/?#]*)/i)?.[1] || '';
        if (!authority || authority.startsWith(':') || authority.endsWith('@')) throw new TypeError('Invalid authority');
      } catch (_) {
        return { ok: false, message: 'Укажите корректный адрес с именем хоста.', bytes };
      }
    }
    return { ok: true, value, bytes };
  }
  return { MAX_BYTES, validateInput };
});
