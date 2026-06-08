package handlers

import (
	"log"
	"net/http"

	"example.com/x-tracker/db"
	"github.com/gin-gonic/gin"
)

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
