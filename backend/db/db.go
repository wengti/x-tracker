package db

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

type seedEntry struct {
	Name     string `json:"name"`
	ImageURL string `json:"image_url"`
}

var partSeeds = []struct {
	file string
	kind string
}{
	{"seeds/blades.json", "blade"},
	{"seeds/bits.json", "bit"},
	{"seeds/ratchets.json", "ratchet"},
	{"seeds/lock_chips.json", "lock_chip"},
	{"seeds/metal_blades.json", "metal_blade"},
	{"seeds/over_blades.json", "over_blade"},
	{"seeds/assist_blades.json", "assist_blade"},
}

func Init() error {
	var err error
	DB, err = sql.Open("sqlite3", "./x-tracker.sql")
	if err != nil {
		return fmt.Errorf("open database: %w", err)
	}

	// By default, SQLite does not enforce foreign key constraints,
	// even if you've defined them in your schema (this is a backwards-compatibility quirk in SQLite).
	// You have to explicitly turn it on per connection
	if _, err := DB.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return fmt.Errorf("enable foreign keys: %w", err)
	}

	if err := createTables(); err != nil {
		return fmt.Errorf("create tables: %w", err)
	}

	if err := seedParts(); err != nil {
		return fmt.Errorf("seed parts: %w", err)
	}

	return nil
}

func createTables() error {
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS parts (
			id        INTEGER PRIMARY KEY AUTOINCREMENT,
			name      TEXT NOT NULL,
			type      TEXT NOT NULL,
			image_url TEXT NOT NULL,
			UNIQUE(name, type)
		)
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id       INTEGER PRIMARY KEY AUTOINCREMENT,
			name     TEXT NOT NULL,
			email    TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL
		)
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS matches_3v3 (
			id INTEGER PRIMARY KEY AUTOINCREMENT,

			user_id INTEGER NOT NULL REFERENCES users(id),

			blade_a1_id        INTEGER REFERENCES parts(id),
			metal_blade_a1_id  INTEGER REFERENCES parts(id),
			over_blade_a1_id   INTEGER REFERENCES parts(id),
			assist_blade_a1_id INTEGER REFERENCES parts(id),
			lock_chip_a1_id    INTEGER REFERENCES parts(id),
			ratchet_a1_id      INTEGER REFERENCES parts(id),
			bit_a1_id          INTEGER NOT NULL REFERENCES parts(id),

			blade_a2_id        INTEGER REFERENCES parts(id),
			metal_blade_a2_id  INTEGER REFERENCES parts(id),
			over_blade_a2_id   INTEGER REFERENCES parts(id),
			assist_blade_a2_id INTEGER REFERENCES parts(id),
			lock_chip_a2_id    INTEGER REFERENCES parts(id),
			ratchet_a2_id      INTEGER REFERENCES parts(id),
			bit_a2_id          INTEGER NOT NULL REFERENCES parts(id),

			blade_a3_id        INTEGER REFERENCES parts(id),
			metal_blade_a3_id  INTEGER REFERENCES parts(id),
			over_blade_a3_id   INTEGER REFERENCES parts(id),
			assist_blade_a3_id INTEGER REFERENCES parts(id),
			lock_chip_a3_id    INTEGER REFERENCES parts(id),
			ratchet_a3_id      INTEGER REFERENCES parts(id),
			bit_a3_id          INTEGER NOT NULL REFERENCES parts(id),

			blade_b1_id        INTEGER REFERENCES parts(id),
			metal_blade_b1_id  INTEGER REFERENCES parts(id),
			over_blade_b1_id   INTEGER REFERENCES parts(id),
			assist_blade_b1_id INTEGER REFERENCES parts(id),
			lock_chip_b1_id    INTEGER REFERENCES parts(id),
			ratchet_b1_id      INTEGER REFERENCES parts(id),
			bit_b1_id          INTEGER NOT NULL REFERENCES parts(id),

			blade_b2_id        INTEGER REFERENCES parts(id),
			metal_blade_b2_id  INTEGER REFERENCES parts(id),
			over_blade_b2_id   INTEGER REFERENCES parts(id),
			assist_blade_b2_id INTEGER REFERENCES parts(id),
			lock_chip_b2_id    INTEGER REFERENCES parts(id),
			ratchet_b2_id      INTEGER REFERENCES parts(id),
			bit_b2_id          INTEGER NOT NULL REFERENCES parts(id),

			blade_b3_id        INTEGER REFERENCES parts(id),
			metal_blade_b3_id  INTEGER REFERENCES parts(id),
			over_blade_b3_id   INTEGER REFERENCES parts(id),
			assist_blade_b3_id INTEGER REFERENCES parts(id),
			lock_chip_b3_id    INTEGER REFERENCES parts(id),
			ratchet_b3_id      INTEGER REFERENCES parts(id),
			bit_b3_id          INTEGER NOT NULL REFERENCES parts(id),

			your_score     INTEGER NOT NULL,
			opponent_score INTEGER NOT NULL
		)
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS matches_1v1 (
			id INTEGER PRIMARY KEY AUTOINCREMENT,

			user_id INTEGER NOT NULL REFERENCES users(id),

			blade_a1_id        INTEGER REFERENCES parts(id),
			metal_blade_a1_id  INTEGER REFERENCES parts(id),
			over_blade_a1_id   INTEGER REFERENCES parts(id),
			assist_blade_a1_id INTEGER REFERENCES parts(id),
			lock_chip_a1_id    INTEGER REFERENCES parts(id),
			ratchet_a1_id      INTEGER REFERENCES parts(id),
			bit_a1_id          INTEGER NOT NULL REFERENCES parts(id),

			blade_b1_id        INTEGER REFERENCES parts(id),
			metal_blade_b1_id  INTEGER REFERENCES parts(id),
			over_blade_b1_id   INTEGER REFERENCES parts(id),
			assist_blade_b1_id INTEGER REFERENCES parts(id),
			lock_chip_b1_id    INTEGER REFERENCES parts(id),
			ratchet_b1_id      INTEGER REFERENCES parts(id),
			bit_b1_id          INTEGER NOT NULL REFERENCES parts(id),

			win          INTEGER NOT NULL,
			finish_type  TEXT NOT NULL,
			match_3v3_id INTEGER REFERENCES matches_3v3(id)
		)
	`)
	return err
}

// seedParts inserts each part from the seed files.
// INSERT OR IGNORE skips rows that already satisfy the UNIQUE(name, type) constraint,
// making this safe to run on every server start.
func seedParts() error {
	stmt, err := DB.Prepare(`INSERT OR IGNORE INTO parts (name, type, image_url) VALUES (?, ?, ?)`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, s := range partSeeds {
		data, err := os.ReadFile(s.file)
		if err != nil {
			return fmt.Errorf("read %s: %w", s.file, err)
		}

		var entries []seedEntry
		if err := json.Unmarshal(data, &entries); err != nil {
			return fmt.Errorf("parse %s: %w", s.file, err)
		}

		inserted := 0
		for _, e := range entries {
			res, err := stmt.Exec(e.Name, s.kind, e.ImageURL)
			if err != nil {
				return fmt.Errorf("insert %s (%s): %w", e.Name, s.kind, err)
			}
			if rows, _ := res.RowsAffected(); rows > 0 {
				inserted++
			}
		}
		log.Printf("parts seed [%s]: %d inserted, %d already existed", s.kind, inserted, len(entries)-inserted)
	}

	return nil
}
