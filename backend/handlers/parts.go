package handlers

import (
	"net/http"

	"example.com/x-tracker/db"
	"github.com/gin-gonic/gin"
)

type partResponse struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	ImageURL string `json:"image_url"`
}

func GetParts(c *gin.Context) {
	rows, err := db.DB.Query(`SELECT id, name, type, image_url FROM parts ORDER BY type, name`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch parts"})
		return
	}
	defer rows.Close()

	result := map[string][]partResponse{}
	for rows.Next() {
		var p partResponse
		var partType string
		if err := rows.Scan(&p.ID, &p.Name, &partType, &p.ImageURL); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan part"})
			return
		}
		result[partType] = append(result[partType], p)
	}

	c.JSON(http.StatusOK, result)
}
