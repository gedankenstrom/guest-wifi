# Guest WiFi

Moderne, selbst gehostete Gäste-WLAN-Landingpage mit automatisch generiertem QR-Code und geschütztem Adminbereich.

## Funktionen

- Öffentliche, responsive WLAN-Landingpage
- QR-Code für Android und iOS
- QR-Code als PNG herunterladen
- WLAN-Name, Passwort, Verschlüsselung und versteckte SSID verwalten
- Gäste-WLAN öffentlich ein- und ausschalten
- Admin-Login mit Benutzername und Passwort
- Passwort-Hashing mit bcrypt, Session-Cookies und Login-Rate-Limit
- WLAN-Konfiguration und Sessions persistent im Docker-Volume speichern

## Image bauen und veröffentlichen

GitHub Actions baut das Docker-Image automatisch bei jedem Push auf `main` und veröffentlicht es unter:

`ghcr.io/gedankenstrom/guest-wifi:latest`

Der Workflow liegt unter `.github/workflows/publish-image.yml`. Nach dem ersten erfolgreichen Lauf muss das neu angelegte Container-Paket gegebenenfalls einmalig in GitHub unter **Packages → guest-wifi → Package settings → Change visibility → Public** auf öffentlich gestellt werden. Nur dann kann Portainer das Image ohne GHCR-Anmeldung herunterladen.

## Portainer / Docker Compose

1. In GitHub unter **Actions** warten, bis **Build and publish Guest WiFi image** erfolgreich abgeschlossen ist.
2. Falls erforderlich, das GHCR-Paket wie oben beschrieben auf **Public** stellen.
3. In Portainer **Stacks → Add stack → Repository** öffnen.
4. Repository URL: `https://github.com/gedankenstrom/guest-wifi.git`
5. Reference: `refs/heads/main`
6. Compose path: `docker-compose.yml`
7. Unter **Environment variables** diese Variablen eintragen:
   - `SESSION_SECRET`: zufälliger, langer Wert (mindestens 32 Zeichen)
   - `ADMIN_PASSWORD`: eigenes, starkes Admin-Passwort
   - optional `ADMIN_USERNAME` (Standard: `admin`)
8. Stack deployen.

Ein Secret kannst du beispielsweise mit `openssl rand -hex 32` erzeugen. Zugangsdaten gehören ausschließlich in die Portainer-Umgebungsvariablen, niemals in die öffentliche GitHub-Datei.

Öffentliche Seite: `http://SERVER-IP:8085`

Adminbereich: `http://SERVER-IP:8085/admin.html`

## Speicherung

Die Konfiguration liegt im persistenten Volume `guest-wifi-data` unter `/data/wifi.json`. Die Datei enthält das WLAN-Passwort im Klartext, da es für den WLAN-QR-Code benötigt wird. Das Volume muss deshalb geschützt und in Backups aufgenommen werden. Die Datei wird mit restriktiven Dateirechten angelegt.

## Sicherheit

- Die öffentliche Seite zeigt absichtlich SSID und WLAN-Passwort an. Jeder Besucher der Seite kann sich mit dem Gäste-WLAN verbinden.
- Admin-Passwörter werden mit bcrypt gehasht; das WLAN-Passwort muss für die QR-Code-Erstellung im Datenvolume gespeichert werden.
- Niemals echte Zugangsdaten, `.env`-Dateien oder Secrets in GitHub committen.
- Die Anwendung nicht ungeschützt ins Internet veröffentlichen. Für externen Zugriff HTTPS über einen Reverse Proxy verwenden.
- Wenn HTTPS über einen Reverse Proxy genutzt wird, `COOKIE_SECURE=true` setzen und den Proxy korrekt konfigurieren.
- Standardport: `8085`.

## Lizenz

MIT
