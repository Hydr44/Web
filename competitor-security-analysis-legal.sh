#!/bin/bash
# Analisi Sicurezza Competitor - 100% LEGALE (solo dati pubblici)
# Per: ecodev.it, omicronsistemi.it, ecodat.it, ecoeuro.it
# Data: 2026-03-21

COMPETITORS="ecodev.it omicronsistemi.it ecodat.it ecoeuro.it"
REPORT_DIR="competitor_security_reports"
mkdir -p $REPORT_DIR

echo "🔍 Analisi Sicurezza Competitor - Solo Dati Pubblici"
echo "=================================================="
echo ""

for SITE in $COMPETITORS; do
    REPORT_FILE="$REPORT_DIR/${SITE}_security_analysis_$(date +%Y%m%d).md"
    
    echo "Analizzando $SITE..." | tee -a $REPORT_FILE
    
    # Header Report
    cat > $REPORT_FILE << EOF
# Security Analysis - $SITE
**Data:** $(date)
**Tipo:** Analisi passiva (solo dati pubblici)
**Scopo:** Responsible disclosure

---

## 1. Informazioni DNS
\`\`\`
EOF
    
    # DNS Info (100% legale)
    dig $SITE A +short >> $REPORT_FILE 2>&1
    dig $SITE MX +short >> $REPORT_FILE 2>&1
    echo '```' >> $REPORT_FILE
    
    # SSL/TLS Info (100% legale - API pubblica)
    echo -e "\n## 2. Certificato SSL" >> $REPORT_FILE
    echo '```' >> $REPORT_FILE
    echo | openssl s_client -connect $SITE:443 -servername $SITE 2>/dev/null | openssl x509 -noout -subject -dates -issuer >> $REPORT_FILE 2>&1
    echo '```' >> $REPORT_FILE
    
    # Security Headers (100% legale - richiesta HTTP normale)
    echo -e "\n## 3. Security Headers" >> $REPORT_FILE
    echo '```' >> $REPORT_FILE
    curl -sI https://$SITE | grep -E "X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security|Content-Security-Policy|X-XSS-Protection|Referrer-Policy|Permissions-Policy" >> $REPORT_FILE
    if [ $? -ne 0 ]; then
        echo "⚠️  Nessun security header rilevato" >> $REPORT_FILE
    fi
    echo '```' >> $REPORT_FILE
    
    # Server Info (100% legale)
    echo -e "\n## 4. Server Information" >> $REPORT_FILE
    echo '```' >> $REPORT_FILE
    curl -sI https://$SITE | grep -E "Server:|X-Powered-By:" >> $REPORT_FILE
    echo '```' >> $REPORT_FILE
    
    # WordPress Detection (100% legale - file pubblici)
    echo -e "\n## 5. CMS Detection" >> $REPORT_FILE
    WP_CHECK=$(curl -s https://$SITE/wp-json/ 2>/dev/null | grep -o "WordPress" | head -1)
    if [ ! -z "$WP_CHECK" ]; then
        echo "✓ WordPress rilevato" >> $REPORT_FILE
        
        # WordPress Version (file pubblico)
        WP_VERSION=$(curl -s https://$SITE/wp-includes/js/wp-embed.min.js 2>/dev/null | grep -o "ver=[0-9.]*" | cut -d= -f2 | head -1)
        if [ ! -z "$WP_VERSION" ]; then
            echo "  - Versione: $WP_VERSION" >> $REPORT_FILE
        fi
        
        # User Enumeration Check (API pubblica WordPress)
        USERS_CHECK=$(curl -s https://$SITE/wp-json/wp/v2/users 2>/dev/null | grep -o '"id":[0-9]*' | wc -l)
        if [ "$USERS_CHECK" -gt 0 ]; then
            echo "  ⚠️  User enumeration possibile via REST API ($USERS_CHECK utenti esposti)" >> $REPORT_FILE
        fi
        
        # XML-RPC Check (endpoint pubblico)
        XMLRPC_CHECK=$(curl -s -X POST https://$SITE/xmlrpc.php -d '<?xml version="1.0"?><methodCall><methodName>system.listMethods</methodName></methodCall>' 2>/dev/null | grep -o "methodResponse" | wc -l)
        if [ "$XMLRPC_CHECK" -gt 0 ]; then
            echo "  ⚠️  XML-RPC abilitato (rischio DDoS)" >> $REPORT_FILE
        fi
        
        # Readme.html Check (file pubblico)
        README_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://$SITE/readme.html)
        if [ "$README_CHECK" = "200" ]; then
            echo "  ⚠️  readme.html esposto (information disclosure)" >> $REPORT_FILE
        fi
    else
        echo "CMS non rilevato o non WordPress" >> $REPORT_FILE
    fi
    
    # Raccomandazioni
    cat >> $REPORT_FILE << 'EOF'

---

## Raccomandazioni (se applicabili)

### Critiche
- [ ] Disabilitare user enumeration REST API
- [ ] Disabilitare XML-RPC se non utilizzato
- [ ] Implementare security headers (X-Frame-Options, HSTS, CSP)

### Importanti
- [ ] Nascondere versione WordPress
- [ ] Rimuovere file readme.html e license.txt
- [ ] Implementare rate limiting su wp-login.php
- [ ] Abilitare 2FA per account admin

### Consigliate
- [ ] WAF (Cloudflare/Wordfence)
- [ ] Backup automatici offsite
- [ ] Monitoring sicurezza
- [ ] Aggiornamenti automatici security patches

---

**Nota:** Questa analisi usa solo dati pubblicamente accessibili.
Nessuna scansione invasiva o tentativo di accesso non autorizzato.

EOF
    
    echo "✓ Report salvato: $REPORT_FILE"
    echo ""
done

# Summary Report
SUMMARY_FILE="$REPORT_DIR/SUMMARY_$(date +%Y%m%d).md"
cat > $SUMMARY_FILE << EOF
# Security Analysis Summary - Competitor Benchmark
**Data:** $(date)

## Siti Analizzati
EOF

for SITE in $COMPETITORS; do
    echo "- $SITE" >> $SUMMARY_FILE
done

cat >> $SUMMARY_FILE << 'EOF'

## Metodologia
- ✅ Solo dati pubblicamente accessibili
- ✅ Nessuna scansione invasiva
- ✅ Nessun tentativo di accesso
- ✅ Conforme a responsible disclosure

## Prossimi Passi
1. Rivedere i report individuali
2. Preparare email di disclosure per siti con vulnerabilità critiche
3. Dare 30-90 giorni per fix prima di qualsiasi comunicazione pubblica

EOF

echo ""
echo "✅ Analisi completata!"
echo "📁 Report salvati in: $REPORT_DIR/"
echo "📊 Summary: $SUMMARY_FILE"
echo ""
echo "⚠️  IMPORTANTE: Usa questi dati solo per responsible disclosure."
echo "   Non pubblicare vulnerabilità senza consenso dei proprietari."
