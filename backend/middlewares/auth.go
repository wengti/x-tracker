package middlewares

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func VerifyAuthorization() gin.HandlerFunc {
	return func(c *gin.Context) {
		rawHeader := c.GetHeader("Authorization")
		if rawHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		tokenString := strings.TrimPrefix(rawHeader, "Bearer ")

		token, err := jwt.Parse(
			tokenString,
			func(t *jwt.Token) (any, error) {
				return []byte(os.Getenv("JWT_SECRET")), nil
			},
			jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
			jwt.WithExpirationRequired(),
		)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		// JWT encodes numbers as float64; convert to int64 for safe use downstream.
		rawID, ok := claims["id"].(float64)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		c.Set("userId", int64(rawID))
		c.Set("userEmail", claims["email"])
		c.Next()
	}
}
