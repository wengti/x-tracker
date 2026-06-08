package main

import (
	"log"
	"net/http"
	"os"

	"example.com/x-tracker/db"
	"example.com/x-tracker/handlers"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if present (ignored in production where env vars are set directly)
	_ = godotenv.Load()

	if err := db.Init(); err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}

	r := gin.Default()

	corsConfig := cors.DefaultConfig()
	if origin := os.Getenv("FRONTEND_ORIGIN"); origin != "" {
		corsConfig.AllowOrigins = []string{origin}
	} else {
		corsConfig.AllowAllOrigins = true
	}
	corsConfig.AllowHeaders = append(corsConfig.AllowHeaders, "Authorization")
	r.Use(cors.New(corsConfig))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "hello world"})
	})

	r.POST("/auth/signup", handlers.SignUp)

	r.Run(":8080")
}
