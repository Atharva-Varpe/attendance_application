#!/bin/bash

# SSL Certificate Setup Script for Attendance Application
# This script helps set up SSL certificates using Let's Encrypt or self-signed certificates

set -e

DOMAIN=${1:-"your-domain.com"}
EMAIL=${2:-"admin@your-domain.com"}
SSL_DIR="./nginx/ssl"

echo "🔐 SSL Certificate Setup for $DOMAIN"
echo "=================================="

# Create SSL directory
mkdir -p "$SSL_DIR"

# Function to generate self-signed certificate (for testing)
generate_self_signed() {
    echo "📝 Generating self-signed certificate for testing..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/cert.pem" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    echo "✅ Self-signed certificate generated"
    echo "⚠️  This is for testing only - use Let's Encrypt for production"
}

# Function to setup Let's Encrypt certificate
setup_letsencrypt() {
    echo "🌐 Setting up Let's Encrypt certificate..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        echo "📦 Installing certbot..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        elif command -v yum &> /dev/null; then
            sudo yum install -y certbot python3-certbot-nginx
        else
            echo "❌ Please install certbot manually"
            exit 1
        fi
    fi
    
    # Stop nginx if running
    echo "🛑 Stopping nginx temporarily..."
    docker-compose down nginx 2>/dev/null || true
    
    # Generate certificate
    echo "📋 Generating Let's Encrypt certificate..."
    sudo certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"
    
    # Copy certificates to our SSL directory
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
    
    # Fix permissions
    sudo chown $(whoami):$(whoami) "$SSL_DIR"/*.pem
    chmod 600 "$SSL_DIR"/*.pem
    
    echo "✅ Let's Encrypt certificate installed"
}

# Function to setup certificate renewal
setup_renewal() {
    echo "🔄 Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > "./scripts/renew-ssl.sh" << 'EOF'
#!/bin/bash
# SSL Certificate Renewal Script

DOMAIN=$1
SSL_DIR="./nginx/ssl"

echo "🔄 Renewing SSL certificate for $DOMAIN..."

# Renew certificate
sudo certbot renew --quiet

# Copy renewed certificates
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
    sudo chown $(whoami):$(whoami) "$SSL_DIR"/*.pem
    chmod 600 "$SSL_DIR"/*.pem
    
    # Reload nginx
    docker-compose exec nginx nginx -s reload
    
    echo "✅ Certificate renewed and nginx reloaded"
else
    echo "❌ Certificate renewal failed"
    exit 1
fi
EOF

    chmod +x "./scripts/renew-ssl.sh"
    
    # Add to crontab (runs twice daily)
    (crontab -l 2>/dev/null; echo "0 12 * * * $(pwd)/scripts/renew-ssl.sh $DOMAIN") | crontab -
    
    echo "✅ Automatic renewal configured (runs twice daily)"
}

# Main menu
echo ""
echo "Choose SSL setup option:"
echo "1) Self-signed certificate (testing)"
echo "2) Let's Encrypt certificate (production)"
echo "3) Skip SSL setup"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        generate_self_signed
        ;;
    2)
        if [ "$DOMAIN" = "your-domain.com" ]; then
            echo "❌ Please provide your actual domain name:"
            echo "Usage: $0 your-actual-domain.com your-email@domain.com"
            exit 1
        fi
        setup_letsencrypt
        setup_renewal
        ;;
    3)
        echo "⏭️  Skipping SSL setup"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 SSL setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your domain DNS to point to this server"
echo "2. Run: docker-compose -f docker-compose.production.yml up -d"
echo "3. Test your site: https://$DOMAIN"
echo ""
echo "📁 SSL certificates are stored in: $SSL_DIR"
