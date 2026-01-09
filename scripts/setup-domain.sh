#!/bin/bash

# Complete Setup Script for booking.ceritakitastudio.site
# This script handles SSL setup and docker deployment

set -e

DOMAIN="ceritakitastudio.site"
PROJECT_DIR="/home/nugroho/Documents/ceritakita-booking"
SSL_DIR="/etc/letsencrypt/live/$DOMAIN"

echo "=== CeritaKita Booking System Setup ==="
echo "Domain: $DOMAIN"
echo "Project: $PROJECT_DIR"
echo

# Function to check if domain is accessible
check_domain_access() {
    echo "Checking if domain $DOMAIN is accessible..."
    if nslookup $DOMAIN > /dev/null 2>&1; then
        echo "✓ Domain DNS is configured"
        return 0
    else
        echo "✗ Domain DNS not found. Please ensure $DOMAIN points to this server's IP"
        return 1
    fi
}

# Function to setup SSL certificates
setup_ssl() {
    echo
    echo "=== SSL Certificate Setup ==="
    
    # Check if certificates already exist
    if [ -d "$SSL_DIR" ] && [ -f "$SSL_DIR/fullchain.pem" ]; then
        echo "✓ SSL certificates already exist"
        sudo certbot certificates -d $DOMAIN -d www.$DOMAIN
        return 0
    fi
    
    echo "Setting up SSL certificates using Let's Encrypt..."
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    # Ensure nginx is running on port 80
    echo "Starting nginx for certificate validation..."
    cd $PROJECT_DIR
    docker compose up -d nginx
    
    # Wait for nginx to be ready
    echo "Waiting for nginx to be ready..."
    sleep 10
    
    # Generate certificates
    echo "Generating SSL certificates..."
    sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email admin@ceritakitastudio.site --agree-tos --non-interactive --preferred-challenges http
    
    if [ $? -eq 0 ]; then
        echo "✓ SSL certificates generated successfully"
        sudo chmod 600 $SSL_DIR/privkey.pem
        sudo chmod 644 $SSL_DIR/fullchain.pem
    else
        echo "✗ Failed to generate SSL certificates"
        echo "You can try manually: sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN"
        return 1
    fi
}

# Function to deploy with docker
deploy_docker() {
    echo
    echo "=== Docker Deployment ==="
    
    cd $PROJECT_DIR
    
    # Check if .env.local exists
    if [ ! -f ".env.local" ]; then
        echo "Creating .env.local from example..."
        if [ -f ".env.local.example" ]; then
            cp .env.local.example .env.local
            echo "Please edit .env.local to set your ADMIN_USERNAME and ADMIN_PASSWORD"
            echo "Then press Enter to continue..."
            read
        else
            echo "No .env.local.example found. Creating basic .env.local..."
            cat > .env.local << EOF
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_me_in_production
NEXTAUTH_URL=https://$DOMAIN
EOF
        fi
    fi
    
    # Stop existing containers
    echo "Stopping existing containers..."
    docker compose down
    
    # Start new containers
    echo "Starting containers with new configuration..."
    docker compose up -d
    
    # Wait for app to be ready
    echo "Waiting for application to start..."
    sleep 15
    
    # Check status
    echo
    echo "=== Deployment Status ==="
    docker compose ps
    
    echo
    echo "=== Service Health ==="
    docker compose logs --tail=10 nginx
    echo
    docker compose logs --tail=10 app
}

# Function to verify setup
verify_setup() {
    echo
    echo "=== Verification ==="
    
    # Check if containers are running
    if docker compose ps | grep -q "Up"; then
        echo "✓ Containers are running"
    else
        echo "✗ Some containers are not running"
        return 1
    fi
    
    # Test HTTP endpoint
    echo "Testing HTTP endpoint..."
    if curl -f -s http://localhost/health > /dev/null; then
        echo "✓ HTTP health check passed"
    else
        echo "✗ HTTP health check failed"
    fi
    
    # Test HTTPS if available
    if [ -d "$SSL_DIR" ]; then
        echo "Testing HTTPS endpoint..."
        if curl -f -s -k https://localhost/health > /dev/null; then
            echo "✓ HTTPS health check passed"
        else
            echo "✗ HTTPS health check failed"
        fi
    fi
    
    echo
    echo "=== Setup Complete ==="
    echo "Your application should be accessible at:"
    echo "  HTTP:  http://$DOMAIN"
    if [ -d "$SSL_DIR" ]; then
        echo "  HTTPS: https://$DOMAIN"
    fi
    echo
    echo "Admin login credentials are in your .env.local file"
}

# Main execution
main() {
    echo "This script will:"
    echo "1. Check domain DNS configuration"
    echo "2. Setup SSL certificates (if needed)"
    echo "3. Deploy with Docker Compose"
    echo "4. Verify the deployment"
    echo
    read -p "Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    # Check domain
    if ! check_domain_access; then
        echo "Warning: Domain check failed. Proceeding anyway..."
        read -p "Press Enter to continue or Ctrl+C to cancel..."
    fi
    
    # Setup SSL
    setup_ssl
    
    # Deploy Docker
    deploy_docker
    
    # Verify
    verify_setup
    
    echo
    echo "=== Next Steps ==="
    echo "1. If you need to regenerate SSL certificates, run: sudo $PROJECT_DIR/scripts/setup-ssl.sh"
    echo "2. To view logs: docker compose logs -f"
    echo "3. To restart: docker compose restart"
    echo "4. Make sure your DNS points $DOMAIN to this server's IP address"
}

# Run main function
main