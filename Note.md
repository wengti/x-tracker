# How to set and check the expiry of a JWT Token
1. The exp claim written at login

```go
"exp": time.Now().Add(7 * 24 * time.Hour).Unix(),
```
exp is a standard JWT claim that holds a Unix timestamp. It gets embedded inside the token's payload before signing — so it's tamper-proof (changing it would invalidate the signature).

2. `jwt.WithExpirationRequired()` passed to `jwt.Parse`

```go
jwt.Parse(
    tokenString,
    func(t *jwt.Token) (any, error) { ... },
    jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
    jwt.WithExpirationRequired(),  // ← this
)
```
golang-jwt/jwt/v5 automatically reads the exp claim during parsing and compares it against the current time. If exp is in the past, Parse returns an error and the middleware calls `AbortWithStatusJSON` — the request never reaches your handler.

`WithExpirationRequired()` is an extra safety option that makes the check mandatory — without it, a token with no exp claim at all would be considered valid forever. With it, a missing exp is also rejected.

So the full flow on an expired token:


Client sends Bearer <token>
  → Parse() checks signature ✓
  → Parse() checks exp claim → now > exp → error
  → middleware: `AbortWithStatusJSON(401, "invalid or expired token")`
  → handler never runs


# JWT Storage via httpOnly Cookie
1. Why set the cookie from the backend?

A cookie set from JavaScript (document.cookie) is readable by any JS running on the page — so if your site has an XSS vulnerability, an attacker's script can steal the token just as easily as from localStorage. There is no security difference between the two.

A cookie set by the backend via the Set-Cookie response header can carry the HttpOnly flag, which makes the browser refuse to expose it to JavaScript at all — not even your own code can read it. The browser just silently attaches it to every matching request automatically.

2. How is it implemented?

**Backend — write the cookie on login (handlers/user.go)**
```go
http.SetCookie(c.Writer, &http.Cookie{
    Name:     "token",
    Value:    tokenString,       // the signed JWT
    MaxAge:   7 * 24 * 60 * 60, // 7 days in seconds, matches JWT exp
    Path:     "/",
    HttpOnly: true,              // JS cannot read this
    SameSite: http.SameSiteStrictMode, // blocks cross-site request forgery
    Secure:   gin.Mode() == gin.ReleaseMode, // HTTPS only in production
})
// Return only non-sensitive info in the JSON body
c.JSON(http.StatusOK, gin.H{"name": name})
```

**Backend — read the cookie in the auth middleware (middlewares/auth.go)**
```go
tokenString, err := c.Cookie("token") // browser sends it automatically
if err != nil {
    c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
    return
}
// then parse + validate JWT as normal
```

**Backend — CORS must allow credentials (main.go)**
```go
// AllowCredentials CANNOT be combined with AllowAllOrigins (wildcard)
// so only enable it when an explicit origin is configured (dev)
corsConfig.AllowOrigins = []string{"http://localhost:3000"}
corsConfig.AllowCredentials = true
```

**Frontend — tell the browser to send/receive cookies cross-origin**
```go
fetch(apiURL("/auth/login"), {
    method: "POST",
    credentials: "include", // ← required for cross-origin cookies
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
})
// Store only the name (non-sensitive) in localStorage
localStorage.setItem("name", data.name)
```

**Key point - credentials: "include"**
* must be on every fetch call that needs the cookie sent — the browser won't attach it otherwise for cross-origin requests.


# Implementing a JWT Blocklist

**The Problem**
JWT validation only checks signature and expiry. A logged-out token is still cryptographically valid until exp is reached — up to 7 days in our case. If someone captured the token string before logout, they could still use it.

An in-memory (sync.Map) blocklist solves this during a single server uptime, but a server restart wipes it clean, making blocked tokens valid again.

Redis solves both problems — it persists across restarts and handles TTL expiry automatically.

**At Login**
At login, a unique `jti` (JWT ID) is generated and embedded in the token:
```go
func generateJTI() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

jti, _ := generateJTI()  // crypto/rand → 16-byte hex string

jwt.MapClaims{
    "id":    id,
    "email": email,
    "jti":   jti,   // unique fingerprint for this specific token
    "exp":   ...,
}
```

**At Logout**
At logout, the `jti` and `exp` are read from the Gin context (set by the middleware) and stored in Redis with a TTL equal to the token's remaining lifetime:
```go
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

// In package auth
// This function is used when /auth/logout is hit
// Block stores the jti in Redis with a TTL equal to the token's remaining lifetime.
// Redis automatically evicts the key when the TTL expires — no cleanup needed.
func Block(jti string, exp time.Time) error {
	ttl := time.Until(exp)
	if ttl <= 0 {
		return nil
	}
	return rdb.Set(context.Background(), "blocklist:"+jti, 1, ttl).Err()
}
```

**At Middleware**
On every protected request, the middleware checks the blocklist after the normal signature + expiry validation:
```go
// Check if the JWT ID is in the block list
if auth.IsBlocked(jti) {
    c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token has been invalidated"})
    return
}

// IsBlocked is from package auth
// IsBlocked returns true if the jti is present in Redis (i.e. the token was logged out).
// If Redis is unreachable we fail open (allow the request) and log the error.
func IsBlocked(jti string) bool {
	n, err := rdb.Exists(context.Background(), "blocklist:"+jti).Result()
	if err != nil {
		log.Printf("blocklist: redis error: %v", err)
		return false
	}
	return n > 0
}
```