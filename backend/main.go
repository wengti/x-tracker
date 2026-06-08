package main

import (
	"log"
	"net/http"

	"example.com/x-tracker/db"
	"example.com/x-tracker/handlers"
	"github.com/gin-gonic/gin"
)

func main() {
	if err := db.Init(); err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}

	r := gin.Default()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "hello world"})
	})

	r.POST("/auth/signup", handlers.SignUp)

	r.Run(":8080")
}
