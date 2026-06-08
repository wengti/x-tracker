package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"net/mail"
	"os"
	"strings"
	"time"
	"unicode"

	"example.com/x-tracker/auth"
	"example.com/x-tracker/db"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func generateJTI() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}


func isStrongPassword(p string) bool {
	if len(p) < 8 {
		return false
	}
	var hasUpper, hasDigit, hasSymbol bool
	for _, r := range p {
		switch {
		case unicode.IsUpper(r):
			hasUpper = true
		case unicode.IsDigit(r):
			hasDigit = true
		case unicode.IsPunct(r) || unicode.IsSymbol(r):
			hasSymbol = true
		}
	}
	return hasUpper && hasDigit && hasSymbol
}

type signUpRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func SignUp(c *gin.Context) {
	var req signUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)
	req.Password = strings.TrimSpace(req.Password)

	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name cannot be empty"})
		return
	}
	if req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email cannot be empty"})
		return
	}
	if _, err := mail.ParseAddress(req.Email); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email address"})
		return
	}
	if req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password cannot be empty"})
		return
	}
	if !isStrongPassword(req.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 8 characters and contain an uppercase letter, a number, and a symbol"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process password"})
		return
	}

	var id int64
	err = db.DB.QueryRow(
		`INSERT INTO users (name, email, password) VALUES (?, ?, ?) RETURNING id`,
		req.Name, req.Email, string(hashed),
	).Scan(&id)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			c.JSON(http.StatusConflict, gin.H{"error": "email already in use"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "name": req.Name, "email": req.Email})
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	req.Email = strings.TrimSpace(req.Email)
	req.Password = strings.TrimSpace(req.Password)

	if req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email cannot be empty"})
		return
	}
	if req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password cannot be empty"})
		return
	}

	var id int64
	var name, hashedPassword string
	err := db.DB.QueryRow(
		`SELECT id, name, password FROM users WHERE email = ?`, req.Email,
	).Scan(&id, &name, &hashedPassword)
	if err != nil {
		// Return the same message whether the email doesn't exist or the password is wrong,
		// to avoid leaking which emails are registered.
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	jti, err := generateJTI()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":    id,
		"email": req.Email,
		"jti":   jti,
		"exp":   time.Now().Add(7 * 24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "token",
		Value:    tokenString,
		MaxAge:   7 * 24 * 60 * 60,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		Secure:   os.Getenv("COOKIE_SECURE") == "true",
	})

	c.JSON(http.StatusOK, gin.H{"name": name})
}

func Logout(c *gin.Context) {
	jti, _ := c.Get("jti")
	exp, _ := c.Get("exp")

	if jtiStr, ok := jti.(string); ok {
		if expTime, ok := exp.(time.Time); ok {
			if err := auth.Block(jtiStr, expTime); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to invalidate token"})
				return
			}
		}
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "token",
		Value:    "",
		MaxAge:   -1,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		Secure:   os.Getenv("COOKIE_SECURE") == "true",
	})
	c.JSON(http.StatusOK, gin.H{})
}
