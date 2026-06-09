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

// ── Player stats ──────────────────────────────────────────────────────────────

type playerRound struct {
	ID         int64  `json:"id"`
	CreatedAt  string `json:"createdAt"`
	Win        bool   `json:"win"`
	FinishType string `json:"finishType"`
	Match3v3ID *int64 `json:"match3v3Id"`

	BladeA1ID       *int64 `json:"bladeA1Id"`
	MetalBladeA1ID  *int64 `json:"metalBladeA1Id"`
	OverBladeA1ID   *int64 `json:"overBladeA1Id"`
	AssistBladeA1ID *int64 `json:"assistBladeA1Id"`
	LockChipA1ID    *int64 `json:"lockChipA1Id"`
	RatchetA1ID     *int64 `json:"ratchetA1Id"`
	BitA1ID         int64  `json:"bitA1Id"`

	BladeB1ID       *int64 `json:"bladeB1Id"`
	MetalBladeB1ID  *int64 `json:"metalBladeB1Id"`
	OverBladeB1ID   *int64 `json:"overBladeB1Id"`
	AssistBladeB1ID *int64 `json:"assistBladeB1Id"`
	LockChipB1ID    *int64 `json:"lockChipB1Id"`
	RatchetB1ID     *int64 `json:"ratchetB1Id"`
	BitB1ID         int64  `json:"bitB1Id"`
}

type playerGame struct {
	ID            int64  `json:"id"`
	CreatedAt     string `json:"createdAt"`
	YourScore     int    `json:"yourScore"`
	OpponentScore int    `json:"opponentScore"`

	BladeA1ID       *int64 `json:"bladeA1Id"`
	MetalBladeA1ID  *int64 `json:"metalBladeA1Id"`
	OverBladeA1ID   *int64 `json:"overBladeA1Id"`
	AssistBladeA1ID *int64 `json:"assistBladeA1Id"`
	LockChipA1ID    *int64 `json:"lockChipA1Id"`
	RatchetA1ID     *int64 `json:"ratchetA1Id"`
	BitA1ID         int64  `json:"bitA1Id"`

	BladeA2ID       *int64 `json:"bladeA2Id"`
	MetalBladeA2ID  *int64 `json:"metalBladeA2Id"`
	OverBladeA2ID   *int64 `json:"overBladeA2Id"`
	AssistBladeA2ID *int64 `json:"assistBladeA2Id"`
	LockChipA2ID    *int64 `json:"lockChipA2Id"`
	RatchetA2ID     *int64 `json:"ratchetA2Id"`
	BitA2ID         int64  `json:"bitA2Id"`

	BladeA3ID       *int64 `json:"bladeA3Id"`
	MetalBladeA3ID  *int64 `json:"metalBladeA3Id"`
	OverBladeA3ID   *int64 `json:"overBladeA3Id"`
	AssistBladeA3ID *int64 `json:"assistBladeA3Id"`
	LockChipA3ID    *int64 `json:"lockChipA3Id"`
	RatchetA3ID     *int64 `json:"ratchetA3Id"`
	BitA3ID         int64  `json:"bitA3Id"`

	BladeB1ID       *int64 `json:"bladeB1Id"`
	MetalBladeB1ID  *int64 `json:"metalBladeB1Id"`
	OverBladeB1ID   *int64 `json:"overBladeB1Id"`
	AssistBladeB1ID *int64 `json:"assistBladeB1Id"`
	LockChipB1ID    *int64 `json:"lockChipB1Id"`
	RatchetB1ID     *int64 `json:"ratchetB1Id"`
	BitB1ID         int64  `json:"bitB1Id"`

	BladeB2ID       *int64 `json:"bladeB2Id"`
	MetalBladeB2ID  *int64 `json:"metalBladeB2Id"`
	OverBladeB2ID   *int64 `json:"overBladeB2Id"`
	AssistBladeB2ID *int64 `json:"assistBladeB2Id"`
	LockChipB2ID    *int64 `json:"lockChipB2Id"`
	RatchetB2ID     *int64 `json:"ratchetB2Id"`
	BitB2ID         int64  `json:"bitB2Id"`

	BladeB3ID       *int64 `json:"bladeB3Id"`
	MetalBladeB3ID  *int64 `json:"metalBladeB3Id"`
	OverBladeB3ID   *int64 `json:"overBladeB3Id"`
	AssistBladeB3ID *int64 `json:"assistBladeB3Id"`
	LockChipB3ID    *int64 `json:"lockChipB3Id"`
	RatchetB3ID     *int64 `json:"ratchetB3Id"`
	BitB3ID         int64  `json:"bitB3Id"`
}

type playerStatsResponse struct {
	Rounds []playerRound `json:"rounds"`
	Games  []playerGame  `json:"games"`
}

func GetPlayerStats(c *gin.Context) {
	userID := c.MustGet("userId").(int64)

	// ── 1v1 rounds ───────────────────────────────────────────────────────────
	rRows, err := db.DB.Query(`
		SELECT
			id, created_at, win, finish_type, match_3v3_id,
			blade_a1_id, metal_blade_a1_id, over_blade_a1_id, assist_blade_a1_id, lock_chip_a1_id, ratchet_a1_id, bit_a1_id,
			blade_b1_id, metal_blade_b1_id, over_blade_b1_id, assist_blade_b1_id, lock_chip_b1_id, ratchet_b1_id, bit_b1_id
		FROM matches_1v1
		WHERE user_id = ?
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch rounds"})
		return
	}
	defer rRows.Close()

	rounds := []playerRound{}
	for rRows.Next() {
		var r playerRound
		var win int
		var match3v3ID sql.NullInt64
		if err := rRows.Scan(
			&r.ID, &r.CreatedAt, &win, &r.FinishType, &match3v3ID,
			&r.BladeA1ID, &r.MetalBladeA1ID, &r.OverBladeA1ID, &r.AssistBladeA1ID, &r.LockChipA1ID, &r.RatchetA1ID, &r.BitA1ID,
			&r.BladeB1ID, &r.MetalBladeB1ID, &r.OverBladeB1ID, &r.AssistBladeB1ID, &r.LockChipB1ID, &r.RatchetB1ID, &r.BitB1ID,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read rounds"})
			return
		}
		r.Win = win == 1
		if match3v3ID.Valid {
			id := match3v3ID.Int64
			r.Match3v3ID = &id
		}
		rounds = append(rounds, r)
	}

	// ── 3v3 games ────────────────────────────────────────────────────────────
	gRows, err := db.DB.Query(`
		SELECT
			id, created_at, your_score, opponent_score,
			blade_a1_id, metal_blade_a1_id, over_blade_a1_id, assist_blade_a1_id, lock_chip_a1_id, ratchet_a1_id, bit_a1_id,
			blade_a2_id, metal_blade_a2_id, over_blade_a2_id, assist_blade_a2_id, lock_chip_a2_id, ratchet_a2_id, bit_a2_id,
			blade_a3_id, metal_blade_a3_id, over_blade_a3_id, assist_blade_a3_id, lock_chip_a3_id, ratchet_a3_id, bit_a3_id,
			blade_b1_id, metal_blade_b1_id, over_blade_b1_id, assist_blade_b1_id, lock_chip_b1_id, ratchet_b1_id, bit_b1_id,
			blade_b2_id, metal_blade_b2_id, over_blade_b2_id, assist_blade_b2_id, lock_chip_b2_id, ratchet_b2_id, bit_b2_id,
			blade_b3_id, metal_blade_b3_id, over_blade_b3_id, assist_blade_b3_id, lock_chip_b3_id, ratchet_b3_id, bit_b3_id
		FROM matches_3v3
		WHERE user_id = ?
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch games"})
		return
	}
	defer gRows.Close()

	games := []playerGame{}
	for gRows.Next() {
		var g playerGame
		if err := gRows.Scan(
			&g.ID, &g.CreatedAt, &g.YourScore, &g.OpponentScore,
			&g.BladeA1ID, &g.MetalBladeA1ID, &g.OverBladeA1ID, &g.AssistBladeA1ID, &g.LockChipA1ID, &g.RatchetA1ID, &g.BitA1ID,
			&g.BladeA2ID, &g.MetalBladeA2ID, &g.OverBladeA2ID, &g.AssistBladeA2ID, &g.LockChipA2ID, &g.RatchetA2ID, &g.BitA2ID,
			&g.BladeA3ID, &g.MetalBladeA3ID, &g.OverBladeA3ID, &g.AssistBladeA3ID, &g.LockChipA3ID, &g.RatchetA3ID, &g.BitA3ID,
			&g.BladeB1ID, &g.MetalBladeB1ID, &g.OverBladeB1ID, &g.AssistBladeB1ID, &g.LockChipB1ID, &g.RatchetB1ID, &g.BitB1ID,
			&g.BladeB2ID, &g.MetalBladeB2ID, &g.OverBladeB2ID, &g.AssistBladeB2ID, &g.LockChipB2ID, &g.RatchetB2ID, &g.BitB2ID,
			&g.BladeB3ID, &g.MetalBladeB3ID, &g.OverBladeB3ID, &g.AssistBladeB3ID, &g.LockChipB3ID, &g.RatchetB3ID, &g.BitB3ID,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read games"})
			return
		}
		games = append(games, g)
	}

	c.JSON(http.StatusOK, playerStatsResponse{Rounds: rounds, Games: games})
}
