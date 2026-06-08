package handlers

import (
	"log"
	"net/http"

	"example.com/x-tracker/db"
	"github.com/gin-gonic/gin"
)

type partIDs struct {
	BladeID       *int64 `json:"blade_id"`
	MetalBladeID  *int64 `json:"metal_blade_id"`
	OverBladeID   *int64 `json:"over_blade_id"`
	AssistBladeID *int64 `json:"assist_blade_id"`
	LockChipID    *int64 `json:"lock_chip_id"`
	RatchetID     *int64 `json:"ratchet_id"`
	BitID         *int64 `json:"bit_id" binding:"required"`
}

type roundEntry struct {
	YouBey      partIDs `json:"you_bey"`
	OpponentBey partIDs `json:"opponent_bey"`
	Win         int     `json:"win"`
	FinishType  string  `json:"finish_type" binding:"required"`
}

type match3v3Request struct {
	YouSetups      []partIDs    `json:"you_setups"      binding:"required,len=3"`
	OpponentSetups []partIDs    `json:"opponent_setups" binding:"required,len=3"`
	YourScore      int          `json:"your_score"`
	OpponentScore  int          `json:"opponent_score"`
	Rounds         []roundEntry `json:"rounds"          binding:"required,min=1"`
}

var validFinishTypes = map[string]bool{
	"Spin Finish":    true,
	"Burst Finish":   true,
	"Over Finish":    true,
	"Extreme Finish": true,
}

type match1v1Request struct {
	BladeA1       *int64 `json:"blade_a1_id"`
	MetalBladeA1  *int64 `json:"metal_blade_a1_id"`
	OverBladeA1   *int64 `json:"over_blade_a1_id"`
	AssistBladeA1 *int64 `json:"assist_blade_a1_id"`
	LockChipA1    *int64 `json:"lock_chip_a1_id"`
	RatchetA1     *int64 `json:"ratchet_a1_id"`
	BitA1         *int64 `json:"bit_a1_id"  binding:"required"`

	BladeB1       *int64 `json:"blade_b1_id"`
	MetalBladeB1  *int64 `json:"metal_blade_b1_id"`
	OverBladeB1   *int64 `json:"over_blade_b1_id"`
	AssistBladeB1 *int64 `json:"assist_blade_b1_id"`
	LockChipB1    *int64 `json:"lock_chip_b1_id"`
	RatchetB1     *int64 `json:"ratchet_b1_id"`
	BitB1         *int64 `json:"bit_b1_id"  binding:"required"`

	Win        int    `json:"win"`
	FinishType string `json:"finish_type" binding:"required"`
}

func CreateMatch1v1(c *gin.Context) {
	userID := c.MustGet("userId").(int64)

	var req match1v1Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !validFinishTypes[req.FinishType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid finish_type"})
		return
	}

	_, err := db.DB.Exec(`
		INSERT INTO matches_1v1 (
			user_id,
			blade_a1_id, metal_blade_a1_id, over_blade_a1_id, assist_blade_a1_id, lock_chip_a1_id, ratchet_a1_id, bit_a1_id,
			blade_b1_id, metal_blade_b1_id, over_blade_b1_id, assist_blade_b1_id, lock_chip_b1_id, ratchet_b1_id, bit_b1_id,
			win, finish_type
		) VALUES (
			?,
			?, ?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?, ?,
			?, ?
		)
	`,
		userID,
		req.BladeA1, req.MetalBladeA1, req.OverBladeA1, req.AssistBladeA1, req.LockChipA1, req.RatchetA1, req.BitA1,
		req.BladeB1, req.MetalBladeB1, req.OverBladeB1, req.AssistBladeB1, req.LockChipB1, req.RatchetB1, req.BitB1,
		req.Win, req.FinishType,
	)
	if err != nil {
		log.Printf("CreateMatch1v1: db error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save match"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "match saved"})
}

func CreateMatch3v3(c *gin.Context) {
	userID := c.MustGet("userId").(int64)

	var req match3v3Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, round := range req.Rounds {
		if !validFinishTypes[round.FinishType] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid finish_type: " + round.FinishType})
			return
		}
	}

	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to start transaction"})
		return
	}
	defer tx.Rollback()

	a, b := req.YouSetups, req.OpponentSetups
	result, err := tx.Exec(`
		INSERT INTO matches_3v3 (
			user_id,
			blade_a1_id, metal_blade_a1_id, over_blade_a1_id, assist_blade_a1_id, lock_chip_a1_id, ratchet_a1_id, bit_a1_id,
			blade_a2_id, metal_blade_a2_id, over_blade_a2_id, assist_blade_a2_id, lock_chip_a2_id, ratchet_a2_id, bit_a2_id,
			blade_a3_id, metal_blade_a3_id, over_blade_a3_id, assist_blade_a3_id, lock_chip_a3_id, ratchet_a3_id, bit_a3_id,
			blade_b1_id, metal_blade_b1_id, over_blade_b1_id, assist_blade_b1_id, lock_chip_b1_id, ratchet_b1_id, bit_b1_id,
			blade_b2_id, metal_blade_b2_id, over_blade_b2_id, assist_blade_b2_id, lock_chip_b2_id, ratchet_b2_id, bit_b2_id,
			blade_b3_id, metal_blade_b3_id, over_blade_b3_id, assist_blade_b3_id, lock_chip_b3_id, ratchet_b3_id, bit_b3_id,
			your_score, opponent_score
		) VALUES (
			?,
			?, ?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?, ?,
			?, ?
		)
	`,
		userID,
		a[0].BladeID, a[0].MetalBladeID, a[0].OverBladeID, a[0].AssistBladeID, a[0].LockChipID, a[0].RatchetID, a[0].BitID,
		a[1].BladeID, a[1].MetalBladeID, a[1].OverBladeID, a[1].AssistBladeID, a[1].LockChipID, a[1].RatchetID, a[1].BitID,
		a[2].BladeID, a[2].MetalBladeID, a[2].OverBladeID, a[2].AssistBladeID, a[2].LockChipID, a[2].RatchetID, a[2].BitID,
		b[0].BladeID, b[0].MetalBladeID, b[0].OverBladeID, b[0].AssistBladeID, b[0].LockChipID, b[0].RatchetID, b[0].BitID,
		b[1].BladeID, b[1].MetalBladeID, b[1].OverBladeID, b[1].AssistBladeID, b[1].LockChipID, b[1].RatchetID, b[1].BitID,
		b[2].BladeID, b[2].MetalBladeID, b[2].OverBladeID, b[2].AssistBladeID, b[2].LockChipID, b[2].RatchetID, b[2].BitID,
		req.YourScore, req.OpponentScore,
	)
	if err != nil {
		log.Printf("CreateMatch3v3: insert 3v3: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save match"})
		return
	}

	match3v3ID, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve match id"})
		return
	}

	for _, round := range req.Rounds {
		_, err := tx.Exec(`
			INSERT INTO matches_1v1 (
				user_id,
				blade_a1_id, metal_blade_a1_id, over_blade_a1_id, assist_blade_a1_id, lock_chip_a1_id, ratchet_a1_id, bit_a1_id,
				blade_b1_id, metal_blade_b1_id, over_blade_b1_id, assist_blade_b1_id, lock_chip_b1_id, ratchet_b1_id, bit_b1_id,
				win, finish_type, match_3v3_id
			) VALUES (
				?,
				?, ?, ?, ?, ?, ?, ?,
				?, ?, ?, ?, ?, ?, ?,
				?, ?, ?
			)
		`,
			userID,
			round.YouBey.BladeID, round.YouBey.MetalBladeID, round.YouBey.OverBladeID, round.YouBey.AssistBladeID, round.YouBey.LockChipID, round.YouBey.RatchetID, round.YouBey.BitID,
			round.OpponentBey.BladeID, round.OpponentBey.MetalBladeID, round.OpponentBey.OverBladeID, round.OpponentBey.AssistBladeID, round.OpponentBey.LockChipID, round.OpponentBey.RatchetID, round.OpponentBey.BitID,
			round.Win, round.FinishType, match3v3ID,
		)
		if err != nil {
			log.Printf("CreateMatch3v3: insert round: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save round"})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to commit match"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "match saved"})
}
