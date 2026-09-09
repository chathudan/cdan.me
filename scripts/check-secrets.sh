#!/usr/bin/env bash
# Fast, deterministic scan of staged content for common secret patterns.
# Runs as a git pre-commit hook. If something looks like a secret, the commit
# is blocked. To bypass (only when you're absolutely sure it's a false positive):
#     git commit --no-verify
#
# The gitleaks GitHub Action provides a deeper backup scan on push / PR.

set -euo pipefail

# Skip binary/vendored/lockfile changes — noisy and not human-authored secrets.
# Also skip files that legitimately contain secret-detection patterns as *data*
# (this script and any future gitleaks config); otherwise the scanner flags
# its own regexes.
DIFF=$(git diff --cached --unified=0 \
  -- ':(exclude)*.svg' \
     ':(exclude)*.png' \
     ':(exclude)*.jpg' \
     ':(exclude)*.jpeg' \
     ':(exclude)*.gif' \
     ':(exclude)*.ico' \
     ':(exclude)*.webp' \
     ':(exclude)*.avif' \
     ':(exclude)*.woff*' \
     ':(exclude)*.ttf' \
     ':(exclude)*.otf' \
     ':(exclude)*.pdf' \
     ':(exclude)*.mp4' \
     ':(exclude)package-lock.json' \
     ':(exclude)yarn.lock' \
     ':(exclude)pnpm-lock.yaml' \
     ':(exclude)scripts/check-secrets.sh' \
     ':(exclude).gitleaks.toml' \
     ':(exclude).gitleaksignore' \
  2>/dev/null || true)

if [ -z "$DIFF" ]; then
  exit 0
fi

# Only look at added lines (skip diff headers and removed lines).
ADDED=$(printf '%s\n' "$DIFF" | grep -aE '^\+[^+]' || true)
if [ -z "$ADDED" ]; then
  exit 0
fi

FOUND=0

# report NAME REGEX
#   Runs the regex against staged additions. If matches exist, prints them
#   and marks the scan as failed. Use extended regex (-E).
report() {
  local name="$1"
  local pattern="$2"
  local extra_grep="${3:-}"

  local matches
  if [ -n "$extra_grep" ]; then
    matches=$(printf '%s\n' "$ADDED" | grep -aE -e "$pattern" | grep -Ev -e "$extra_grep" || true)
  else
    matches=$(printf '%s\n' "$ADDED" | grep -aE -e "$pattern" || true)
  fi

  if [ -n "$matches" ]; then
    echo ""
    echo "🚨 Possible ${name}:"
    printf '%s\n' "$matches" | head -10
    FOUND=1
  fi
}

# ---- High-confidence patterns (very low false-positive rate) ----

report "OpenSSH/RSA/DSA/EC private key" \
  '-----BEGIN (RSA|OPENSSH|DSA|EC|ENCRYPTED) PRIVATE KEY( BLOCK)?-----'

report "PGP private key block" \
  '-----BEGIN PGP PRIVATE KEY BLOCK-----'

report "AWS access key ID" \
  'AKIA[0-9A-Z]{16}'

report "AWS secret access key (heuristic)" \
  '(aws_)?secret_?access_?key["'"'"' ]*[:=]["'"'"' ]*[A-Za-z0-9/+=]{40}'

report "GitHub personal access token" \
  'gh[pousr]_[A-Za-z0-9_]{36,}'

report "Slack token" \
  'xox[baprs]-[A-Za-z0-9-]{10,}'

report "Google API key" \
  'AIza[0-9A-Za-z_-]{35}'

report "OpenAI API key" \
  'sk-[A-Za-z0-9]{40,}' \
  'sk-ant-'

report "Anthropic API key" \
  'sk-ant-[A-Za-z0-9_-]{40,}'

report "Stripe live secret key" \
  'sk_live_[A-Za-z0-9]{24,}'

report "Stripe restricted key" \
  'rk_live_[A-Za-z0-9]{24,}'

report "Twilio account SID" \
  'AC[a-f0-9]{32}'

report "SendGrid API key" \
  'SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}'

report "JWT-shaped token" \
  'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'

# ---- Medium-confidence patterns (some false positives possible) ----

# Password/secret assignments with real-looking values (>= 10 chars, mixed).
# Exclude "password" as a plain word in prose, HTML labels, CSS class names.
report "Password / secret / passphrase assignment (heuristic)" \
  '(password|passphrase|api[_-]?key|access[_-]?token|client[_-]?secret|auth[_-]?token)[[:space:]]*[:=][[:space:]]*['"'"'"][^'"'"'"]{10,}['"'"'"]' \
  '(placeholder|example\.com|xxxxx|your-|change-me|<[a-z_-]+>|\$\{|\$\()'

# .env-style KEY=long-value lines that look like credentials.
# Exclude common non-secret assignments (PATH, NODE_, npm_*, etc.).
report ".env-style secret line" \
  '^\+[A-Z_][A-Z0-9_]+=[A-Za-z0-9+/=_-]{20,}' \
  '(PATH=|NODE_|NPM_|npm_|CI=|GITHUB_WORKSPACE|RUNNER_)'

# Database connection strings that include credentials.
report "Database URL with embedded password" \
  '(postgres|postgresql|mysql|mongodb|redis|amqp)://[^:]+:[^@[:space:]/'"'"'"]+@'

# ---- Result ----

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "❌ Commit blocked — possible secret detected in staged changes."
  echo ""
  echo "Next steps:"
  echo "  1. Move the secret out of the file (use a .env file, environment"
  echo "     variable, or a secret manager — .env is already gitignored)."
  echo "  2. If already committed to a previous commit, ROTATE the secret"
  echo "     — assume it is compromised. Git history is public once pushed."
  echo "  3. If this is a genuine false positive, bypass with:"
  echo "         git commit --no-verify"
  echo "     Then consider tightening the pattern in scripts/check-secrets.sh."
  exit 1
fi

echo "✓ pre-commit secret scan clean"
