package middlewares

import (
	"net/http"
	"os"
	"time"

	"example.com/x-tracker/auth"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func VerifyAuthorization() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Read JWT token from the cookie header
		tokenString, err := c.Cookie("token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		// Verify the JWT - whether expired or not
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

		// Extract the JWT claims with the correct type
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

		jti, ok := claims["jti"].(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		// Check if the JWT ID is in the block list
		if auth.IsBlocked(jti) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token has been invalidated"})
			return
		}

		// exp is stored as float64 (Unix seconds) in JWT claims.
		rawExp, ok := claims["exp"].(float64)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		c.Set("userId", int64(rawID))
		c.Set("userEmail", claims["email"])
		c.Set("jti", jti)
		c.Set("exp", time.Unix(int64(rawExp), 0))
		c.Next()
	}
}
