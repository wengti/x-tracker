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
