-- Только демонстрационные данные; реальные введённые строки не используются.
INSERT INTO qr_profiles (profile_id, profile_name, error_correction, image_format, image_size_px, quiet_zone_modules)
VALUES (1, 'Стандартный', 'M', 'PNG', 512, 4);
INSERT INTO qr_entries (entry_id, input_kind, content, profile_id, created_at) VALUES
  (1, 'url', 'https://example.com/', 1, '2026-01-01 12:00:00'),
  (2, 'text', 'Пример текста для QR-кода', 1, '2026-01-01 12:05:00');
INSERT INTO labels (label_id, name) VALUES (1, 'Учебное'), (2, 'Ссылки');
INSERT INTO entry_labels (entry_id, label_id) VALUES (1, 1), (1, 2), (2, 1);
