#!/usr/bin/env bash
# 🚀 SETUP SCRIPT - Sistema de Métricas
# Execute este script para verificar se tudo está pronto

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🚀 VERIFICANDO IMPLEMENTAÇÃO: MÉTRICAS + MÓDULOS        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/"
        return 1
    fi
}

echo "📁 VERIFICANDO ESTRUTURA DE ARQUIVOS"
echo "───────────────────────────────────────────"
check_file "supabase/migrations/20260410_000001_system_metrics_and_logging.sql"
check_file "lib/logger/system-logger.ts"
check_file "lib/logger/index.ts"
check_file "lib/logger/use-logger.ts"
check_file "lib/logger/server-action-logger.ts"
check_file "lib/logger/README.md"
check_file "app/(protected)/admin/metricas/page.tsx"

echo ""
echo "📁 VERIFICANDO ESTRUTURA DE DIRETÓRIOS"
echo "───────────────────────────────────────────"
check_dir "modules/superadmin"
check_dir "modules/company"
check_dir "modules/employee"
check_dir "shared"
check_dir "modules/superadmin/components/metrics"
check_dir "modules/superadmin/lib"

echo ""
echo "📚 VERIFICANDO DOCUMENTAÇÃO"
echo "───────────────────────────────────────────"
check_file "METRICS_QUICK_START.md"
check_file "IMPLEMENTATION_SUMMARY.md"
check_file "MODULES_MIGRATION_GUIDE.md"
check_file "INDEX.md"
check_file "VISUAL_GUIDE.md"
check_file "PRE_DEPLOYMENT_CHECKLIST.md"
check_file "lib/logger/INTEGRATION_EXAMPLES.md"

echo ""
echo "🔍 VERIFICANDO COMPILAÇÃO TYPESCRIPT"
echo "───────────────────────────────────────────"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build OK (npm run build)"
else
    echo -e "${RED}✗${NC} Build FAILED - Verifique errors acima"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  📊 PRÓXIMOS PASSOS                                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "1️⃣  Leia: METRICS_QUICK_START.md (2 min)"
echo "   https://github.com/seu-repo/blob/main/METRICS_QUICK_START.md"
echo ""
echo "2️⃣  Execute migration no Supabase:"
echo "   - Vá para: Supabase Console → SQL Editor"
echo "   - Cole conteúdo: supabase/migrations/20260410_000001_*.sql"
echo "   - Execute: Run"
echo ""
echo "3️⃣  Teste em desenvolvimento:"
echo "   npm run dev"
echo "   - Faça login"
echo "   - Acesse: http://localhost:3000/admin/metricas"
echo ""
echo "4️⃣  Integre logging em actions:"
echo "   - Veja: lib/logger/INTEGRATION_EXAMPLES.md"
echo "   - Exemplo: app/actions/auth.ts"
echo ""
echo "📞 Dúvidas? Veja: INDEX.md"
echo ""
