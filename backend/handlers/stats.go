package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"example.com/x-tracker/db"
	"github.com/gin-gonic/gin"
)

type beyStatRound struct {
	ID         int64  `json:"id"`
	CreatedAt  string `json:"createdAt"`
	Win        bool   `json:"win"`
	FinishType string `json:"finishType"`
	Match3v3ID *int64 `json:"match3v3Id"`

	OppBladeID       *int64 `json:"oppBladeId"`
	OppMetalBladeID  *int64 `json:"oppMetalBladeId"`
	OppOverBladeID   *int64 `json:"oppOverBladeId"`
	OppAssistBladeID *int64 `json:"oppAssistBladeId"`
	OppLockChipID    *int64 `json:"oppLockChipId"`
	OppRatchetID     *int64 `json:"oppRatchetId"`
	OppBitID         *int64 `json:"oppBitId"`
}

type beyStatGame struct {
	ID            int64  `json:"id"`
	CreatedAt     string `json:"createdAt"`
	YourScore     int    `json:"yourScore"`
	OpponentScore int    `json:"opponentScore"`
}

type beyStatsResponse struct {
	Rounds []beyStatRound `json:"rounds"`
	Games  []beyStatGame  `json:"games"`
}

func parseOptInt64(s string) *int64 {
	if s == "" {
		return nil
	}
	n, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return nil
	}
	return &n
}

func GetBeyStats(c *gin.Context) {
	userID := c.MustGet("userId").(int64)

	bladeID       := parseOptInt64(c.Query("blade_id"))
	metalBladeID  := parseOptInt64(c.Query("metal_blade_id"))
	overBladeID   := parseOptInt64(c.Query("over_blade_id"))
	assistBladeID := parseOptInt64(c.Query("assist_blade_id"))
	lockChipID    := parseOptInt64(c.Query("lock_chip_id"))
	ratchetID     := parseOptInt64(c.Query("ratchet_id"))
	bitID         := parseOptInt64(c.Query("bit_id"))

	if bitID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bit_id is required"})
		return
	}

	rows, err := db.DB.Query(`
		SELECT
			id, created_at, win, finish_type, match_3v3_id,
			blade_b1_id, metal_blade_b1_id, over_blade_b1_id, assist_blade_b1_id,
			lock_chip_b1_id, ratchet_b1_id, bit_b1_id
		FROM matches_1v1
		WHERE user_id = ?
		  AND COALESCE(blade_a1_id,        0) = COALESCE(?, 0)
		  AND COALESCE(metal_blade_a1_id,  0) = COALESCE(?, 0)
		  AND COALESCE(over_blade_a1_id,   0) = COALESCE(?, 0)
		  AND COALESCE(assist_blade_a1_id, 0) = COALESCE(?, 0)
		  AND COALESCE(lock_chip_a1_id,    0) = COALESCE(?, 0)
		  AND COALESCE(ratchet_a1_id,      0) = COALESCE(?, 0)
		  AND bit_a1_id = ?
		ORDER BY created_at DESC
	`, userID, bladeID, metalBladeID, overBladeID, assistBladeID, lockChipID, ratchetID, *bitID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stats"})
		return
	}
	defer rows.Close()

	rounds := []beyStatRound{}
	match3v3IDs := []int64{}
	seen := map[int64]bool{}

	for rows.Next() {
		var (
			r          beyStatRound
			win        int
			match3v3ID sql.NullInt64
		)
		if err := rows.Scan(
			&r.ID, &r.CreatedAt, &win, &r.FinishType, &match3v3ID,
			&r.OppBladeID, &r.OppMetalBladeID, &r.OppOverBladeID, &r.OppAssistBladeID,
			&r.OppLockChipID, &r.OppRatchetID, &r.OppBitID,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read stats"})
			return
		}
		r.Win = win == 1
		if match3v3ID.Valid {
			id := match3v3ID.Int64
			r.Match3v3ID = &id
			if !seen[id] {
				seen[id] = true
				match3v3IDs = append(match3v3IDs, id)
			}
		}
		rounds = append(rounds, r)
	}

	games := []beyStatGame{}
	if len(match3v3IDs) > 0 {
		placeholders := strings.TrimSuffix(strings.Repeat("?,", len(match3v3IDs)), ",")
		args := make([]any, len(match3v3IDs))
		for i, id := range match3v3IDs {
			args[i] = id
		}
		gRows, err := db.DB.Query(
			`SELECT id, created_at, your_score, opponent_score FROM matches_3v3 WHERE id IN (`+placeholders+`) ORDER BY created_at DESC`,
			args...,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch games"})
			return
		}
		defer gRows.Close()
		for gRows.Next() {
			var g beyStatGame
			if err := gRows.Scan(&g.ID, &g.CreatedAt, &g.YourScore, &g.OpponentScore); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read games"})
				return
			}
			games = append(games, g)
		}
	}

	c.JSON(http.StatusOK, beyStatsResponse{Rounds: rounds, Games: games})
}
