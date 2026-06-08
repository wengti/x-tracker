package auth

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

var rdb *redis.Client

func InitBlocklist(client *redis.Client) {
	rdb = client
}

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
