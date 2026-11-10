"""Проверка учебной схемы SQLite на независимой базе в памяти."""
import pathlib
import sqlite3
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent


class DatabaseTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.addCleanup(self.db.close)
        self.db.executescript((ROOT / 'database/schema.sql').read_text(encoding='utf-8'))
        self.db.executescript((ROOT / 'database/seed_data.sql').read_text(encoding='utf-8'))

    def test_seed_and_integrity(self):
        self.assertEqual(self.db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
        self.assertEqual(self.db.execute('PRAGMA foreign_key_check').fetchall(), [])
        self.assertEqual(self.db.execute('SELECT count(*) FROM entry_labels WHERE entry_id=1').fetchone()[0], 2)
        self.assertEqual(self.db.execute('SELECT input_kind, content FROM qr_entries WHERE entry_id=2').fetchone(), ('text', 'Пример текста для QR-кода'))

    def test_limits_uniqueness_and_foreign_keys(self):
        self.db.execute('INSERT INTO qr_entries(entry_id, input_kind, content, profile_id) VALUES(3, ?, ?, 1)', ('text', 'я' * 500))
        for sql, args in [
            ('INSERT INTO qr_entries(entry_id,input_kind,content,profile_id) VALUES(4,?,?,1)', ('text', 'я' * 500 + '!')),
            ('INSERT INTO qr_entries(entry_id,input_kind,content,profile_id) VALUES(5,?,?,1)', ('bad', 'data')),
            ('INSERT INTO entry_labels VALUES(?,?)', (1, 1)),
            ('INSERT INTO entry_labels VALUES(?,?)', (999, 1)),
            ('DELETE FROM qr_profiles WHERE profile_id=?', (1,)),
        ]:
            with self.subTest(sql=sql, args=args), self.assertRaises(sqlite3.IntegrityError):
                self.db.execute(sql, args)
        self.db.execute("INSERT INTO labels(name) VALUES ('TEST')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO labels(name) VALUES ('test')")

    def test_cascades_remove_links_only(self):
        self.db.execute('DELETE FROM qr_entries WHERE entry_id=1')
        self.assertEqual(self.db.execute('SELECT count(*) FROM entry_labels WHERE entry_id=1').fetchone()[0], 0)
        self.assertEqual(self.db.execute('SELECT count(*) FROM labels').fetchone()[0], 2)
        self.db.execute('DELETE FROM labels WHERE label_id=1')
        self.assertEqual(self.db.execute('SELECT count(*) FROM entry_labels WHERE label_id=1').fetchone()[0], 0)
        self.assertEqual(self.db.execute('SELECT count(*) FROM qr_entries WHERE entry_id=2').fetchone()[0], 1)


if __name__ == '__main__':
    unittest.main()
