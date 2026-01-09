#!/bin/bash

# SSL Setup Script for booking.ceritakitastudio.site
# This script sets up SSL certificates using Let's Encrypt

set -e

DOMAIN="ceritakitastudio.site"
EMAIL="admin@ceritakitastudio.site"
SSL_DIR="/etc/letsencrypt/live/$DOMAIN"
NGINX_CONF_DIR="/home/nugroho/Documents/ceritakita-booking/nginx"

echo "=== SSL Certificate Setup for $DOMAIN ==="

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Check if certificates already exist
if [ -d "$SSL_DIR" ] && [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
    echo "SSL certificates already exist at $SSL_DIR"
    echo "Checking certificate validity..."
    sudo certbot certificates -d $DOMAIN
    
    # Ask if user wants to renew
    read -p "Do you want to renew the certificates? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo certbot renew --nginx -d $DOMAIN
    fi
else
    echo "No existing certificates found. Generating new certificates..."
    
    # Ensure nginx is running on port 80 for domain validation
    echo "Starting nginx temporarily on port 80 for certificate validation..."
    
    # Create a temporary nginx config for HTTP validation
    sudo bash -c "cat > /etc/nginx/sites-available/certbot-validation.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF"
    
    # Enable the config
    sudo ln -sf /etc/nginx/sites-available/certbot-validation.conf /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    
    # Create webroot for certbot
    sudo mkdir -p /var/www/certbot
    sudo chown -R www-data:www-data /var/www/certbot
    
    # Generate certificates
    sudo certbot certonly --webroot -w /var/www/certbot -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive
    
    # Clean up temporary config
    sudo rm -f /etc/nginx/sites-enabled/certbot-validation.conf
    sudo rm -f /etc/nginx/sites-available/certbot-validation.conf
    sudo nginx -t && sudo systemctl reload nginx
    
    echo "SSL certificates generated successfully!"
fi

# Set proper permissions
sudo chmod 600 $SSL_DIR/privkey.pem
sudo chmod 644 $SSL_DIR/fullchain.pem
sudo chown -R root:root $SSL_DIR

echo "=== SSL Setup Complete ==="
echo "Certificates location: $SSL_DIR"
echo "You can now restart your docker containers with SSL support"