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
