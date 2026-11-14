# Guest WiFi

Self-hosted guest Wi-Fi landing page with QR code and protected admin panel.

## Quick start

1. Clone this repository.
2. Set a unique `SESSION_SECRET` (at least 32 characters) and a strong `ADMIN_PASSWORD` in `docker-compose.yml`.
3. Deploy the stack in Portainer.
4. Open `http://SERVER-IP:8085`.

The public page intentionally displays the guest Wi-Fi credentials. Protect access to the admin interface with HTTPS when accessed outside your trusted LAN. Wi-Fi credentials are stored in the persistent Docker volume and must be protected and backed up.

See the compose file for deployment settings.