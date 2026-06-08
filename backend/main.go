package main

import (
	"log"
	"net/http"
	"os"

	"example.com/x-tracker/auth"
	"example.com/x-tracker/db"
	"example.com/x-tracker/handlers"
	"example.com/x-tracker/middlewares"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatalf("failed to load environment: %v", err)
	}

	if err := db.Init(); err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}

	// Establish connection to Redis (responsible for storing invalid jwt token's ID)
	redisOpts, err := redis.ParseURL(os.Getenv("REDIS_URL"))
	if err != nil {
		log.Fatalf("invalid REDIS_URL: %v", err)
	}
	auth.InitBlocklist(redis.NewClient(redisOpts))

	r := gin.Default()

	corsConfig := cors.DefaultConfig()
	if origin := os.Getenv("FRONTEND_ORIGIN"); origin != "" {
		corsConfig.AllowOrigins = []string{origin}
		corsConfig.AllowCredentials = true
	} else {
		corsConfig.AllowAllOrigins = true
	}
	corsConfig.AllowHeaders = append(corsConfig.AllowHeaders, "Authorization")
	r.Use(cors.New(corsConfig))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "hello world"})
	})

	r.POST("/auth/signup", handlers.SignUp)
	r.POST("/auth/login", handlers.Login)

	protected := r.Group("/")
	protected.Use(middlewares.VerifyAuthorization())
	{
		protected.POST("/auth/logout", handlers.Logout)
	}

	r.Run(":8080")
}
