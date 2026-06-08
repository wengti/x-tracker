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
