# Monitoring script for AI health project
# Run periodically to check deployment health

set -euo pipefail

APP_URL="${1:-http://localhost:3000}"

echo "=== AI Health Advisor Monitoring ==="
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "URL: $APP_URL"
echo ""

# Check HTTP status
status_code=$(curl -s --connect-timeout 5 --max-time 15 -o /dev/null -w "%{http_code}" "$APP_URL" 2>/dev/null || echo "000")
if [ "$status_code" = "200" ]; then
  echo "HTTP Status: ✓ $status_code"
else
  echo "HTTP Status: ✗ $status_code"
fi

# Check response time
response_time=$(curl -s --connect-timeout 5 --max-time 15 -o /dev/null -w "%{time_total}" "$APP_URL" 2>/dev/null || echo "0")
echo "Response Time: ${response_time}s"

# Check page title
title=$(curl -s --connect-timeout 5 --max-time 15 "$APP_URL" 2>/dev/null | grep -o '<title>[^<]*' | sed 's/<title>//' || echo "unknown")
echo "Page Title: $title"

# Check SEO meta tags
has_description=$(curl -s --connect-timeout 5 --max-time 15 "$APP_URL" 2>/dev/null | grep -c 'name="description"' || echo "0")
has_og=$(curl -s --connect-timeout 5 --max-time 15 "$APP_URL" 2>/dev/null | grep -c 'property="og:title"' || echo "0")
has_jsonld=$(curl -s --connect-timeout 5 --max-time 15 "$APP_URL" 2>/dev/null | grep -c 'application/ld+json' || echo "0")

echo ""
echo "SEO Check:"
echo "  Meta description: $([ "$has_description" -gt 0 ] && echo '✓' || echo '✗')"
echo "  Open Graph: $([ "$has_og" -gt 0 ] && echo '✓' || echo '✗')"
echo "  JSON-LD: $([ "$has_jsonld" -gt 0 ] && echo '✓' || echo '✗')"

echo ""
if [ "$status_code" = "200" ]; then
  echo "Status: HEALTHY"
else
  echo "Status: NEEDS ATTENTION"
fi
