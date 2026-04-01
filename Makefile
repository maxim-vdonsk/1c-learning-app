.PHONY: dev prod build sandbox-image init-course seed-achievements down logs

# Development (hot-reload)
dev:
	docker compose -f docker-compose.dev.yml up -d --build
	@echo "✓ Dev server started"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API docs: http://localhost:8000/docs"

# Production
prod:
	@test -f .env || (cp .env.example .env && echo "⚠ Created .env from example — edit it first!" && exit 1)
	docker compose up -d --build
	@echo "✓ Production stack started"

# Build sandbox image separately
sandbox-image:
	docker build -t onec-sandbox:latest ./sandbox/

# Initialize course (60 lessons) — run after first start
init-course:
	curl -s -X POST http://localhost:8000/api/v1/lessons/initialize \
	  -H "Authorization: Bearer $$(cat /tmp/onec_token 2>/dev/null || echo TOKEN_REQUIRED)" | python3 -m json.tool

# Seed achievements
seed-achievements:
	curl -s -X POST http://localhost:8000/api/v1/achievements/seed \
	  -H "Authorization: Bearer $$(cat /tmp/onec_token 2>/dev/null || echo TOKEN_REQUIRED)" | python3 -m json.tool

# Stop all services
down:
	docker compose down
	docker compose -f docker-compose.dev.yml down

# Follow logs
logs:
	docker compose logs -f --tail=50

# Backend shell
shell-backend:
	docker compose exec backend bash

# DB shell
shell-db:
	docker compose exec db psql -U postgres onec_learning
