package handlers

import (
	"net/http"

	"example.com/x-tracker/db"
	"github.com/gin-gonic/gin"
)

type savedBeyResponse struct {
	ID               int64  `json:"id"`
	IsCX             bool   `json:"isCX"`
	Blade            string `json:"blade"`
	BladeImage       string `json:"bladeImage"`
	MetalBlade       string `json:"metalBlade"`
	MetalBladeImage  string `json:"metalBladeImage"`
	OverBlade        string `json:"overBlade"`
	OverBladeImage   string `json:"overBladeImage"`
	AssistBlade      string `json:"assistBlade"`
	AssistBladeImage string `json:"assistBladeImage"`
	LockChip         string `json:"lockChip"`
	LockChipImage    string `json:"lockChipImage"`
	Ratchet          string `json:"ratchet"`
	RatchetImage     string `json:"ratchetImage"`
	Bit              string `json:"bit"`
	BitImage         string `json:"bitImage"`
}

func GetSavedBeys(c *gin.Context) {
	userID := c.MustGet("userId").(int64)

	rows, err := db.DB.Query(`
		SELECT
			sb.id,
			COALESCE(bl.name,       '') AS blade,
			COALESCE(bl.image_url,  '') AS blade_image,
			COALESCE(mb.name,       '') AS metal_blade,
			COALESCE(mb.image_url,  '') AS metal_blade_image,
			COALESCE(ob.name,       '') AS over_blade,
			COALESCE(ob.image_url,  '') AS over_blade_image,
			COALESCE(ab.name,       '') AS assist_blade,
			COALESCE(ab.image_url,  '') AS assist_blade_image,
			COALESCE(lc.name,       '') AS lock_chip,
			COALESCE(lc.image_url,  '') AS lock_chip_image,
			COALESCE(r.name,        '') AS ratchet,
			COALESCE(r.image_url,   '') AS ratchet_image,
			COALESCE(bit.name,      '') AS bit,
			COALESCE(bit.image_url, '') AS bit_image
		FROM saved_beys sb
		LEFT JOIN parts bl  ON sb.blade_id        = bl.id
		LEFT JOIN parts mb  ON sb.metal_blade_id   = mb.id
		LEFT JOIN parts ob  ON sb.over_blade_id    = ob.id
		LEFT JOIN parts ab  ON sb.assist_blade_id  = ab.id
		LEFT JOIN parts lc  ON sb.lock_chip_id     = lc.id
		LEFT JOIN parts r   ON sb.ratchet_id       = r.id
		LEFT JOIN parts bit ON sb.bit_id           = bit.id
		WHERE sb.user_id = ?
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch saved beys"})
		return
	}
	defer rows.Close()

	beys := []savedBeyResponse{}
	for rows.Next() {
		var b savedBeyResponse
		if err := rows.Scan(
			&b.ID,
			&b.Blade, &b.BladeImage,
			&b.MetalBlade, &b.MetalBladeImage,
			&b.OverBlade, &b.OverBladeImage,
			&b.AssistBlade, &b.AssistBladeImage,
			&b.LockChip, &b.LockChipImage,
			&b.Ratchet, &b.RatchetImage,
			&b.Bit, &b.BitImage,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read saved beys"})
			return
		}
		b.IsCX = b.LockChip != ""
		beys = append(beys, b)
	}

	c.JSON(http.StatusOK, beys)
}

func DeleteSavedBey(c *gin.Context) {
	userID := c.MustGet("userId").(int64)

	id := c.Param("id")

	result, err := db.DB.Exec(
		`DELETE FROM saved_beys WHERE id = ? AND user_id = ?`, id, userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete bey"})
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "bey not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

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
