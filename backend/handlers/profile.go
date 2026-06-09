package handlers

import (
	"net/http"

	"example.com/x-tracker/db"
	"github.com/gin-gonic/gin"
)

type saveBeyRequest struct {
	BladeID       *int64 `json:"blade_id"`
	MetalBladeID  *int64 `json:"metal_blade_id"`
	OverBladeID   *int64 `json:"over_blade_id"`
	AssistBladeID *int64 `json:"assist_blade_id"`
	LockChipID    *int64 `json:"lock_chip_id"`
	RatchetID     *int64 `json:"ratchet_id"`
	BitID         *int64 `json:"bit_id" binding:"required"`
}

func SaveBey(c *gin.Context) {
	userID := c.MustGet("userId").(int64)

	var req saveBeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	_, err := db.DB.Exec(`
		INSERT INTO saved_beys (
			user_id,
			blade_id, metal_blade_id, over_blade_id, assist_blade_id, lock_chip_id, ratchet_id, bit_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, userID, req.BladeID, req.MetalBladeID, req.OverBladeID, req.AssistBladeID, req.LockChipID, req.RatchetID, req.BitID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save bey"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{})
}
