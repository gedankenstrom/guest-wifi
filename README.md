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

## Portainer Stack

### Voraussetzungen

1. In GitHub unter **Actions** warten, bis **Build and publish Guest WiFi image** erfolgreich abgeschlossen ist.
2. Falls erforderlich, das GHCR-Paket wie oben beschrieben auf **Public** stellen.
3. In Portainer **Stacks → Add stack → Web editor** öffnen.

### Docker Compose

Den folgenden vollständigen Stack in den Portainer Web editor kopieren:

```yaml
services:
  guest-wifi:
    image: ghcr.io/gedankenstrom/guest-wifi:latest
    container_name: guest-wifi
    restart: unless-stopped
    pull_policy: always

    ports:
      - "8085:8085"

    environment:
      PORT: "8085"
      NODE_ENV: production
      SESSION_SECRET: "${SESSION_SECRET:?SESSION_SECRET fehlt}"
      ADMIN_USERNAME: "${ADMIN_USERNAME:-admin}"
      ADMIN_PASSWORD: "${ADMIN_PASSWORD:?ADMIN_PASSWORD fehlt}"
      DATA_DIR: /data

    volumes:
      - guest-wifi-data:/data

volumes:
  guest-wifi-data:
```

### Umgebungsvariablen in Portainer

Unter **Environment variables** diese Variablen anlegen:

| Name | Wert |
|---|---|
| `SESSION_SECRET` | Zufälliger, geheimer Wert mit mindestens 32 Zeichen |
| `ADMIN_USERNAME` | `admin` (optional, Standardwert) |
| `ADMIN_PASSWORD` | Eigenes, starkes Admin-Passwort |

Ein geeignetes Session-Secret lässt sich zum Beispiel auf einem Linux-System mit folgendem Befehl erzeugen:

```bash
openssl rand -hex 32
```

Das erzeugte Secret als Wert von `SESSION_SECRET` in Portainer eintragen. Danach den Stack deployen.

**Wichtig:** Die Platzhalter dürfen nicht unverändert bleiben. Ohne ein mindestens 32 Zeichen langes `SESSION_SECRET` und ein eigenes `ADMIN_PASSWORD` startet die Anwendung nicht. Zugangsdaten gehören ausschließlich in die Portainer-Umgebungsvariablen, niemals in die öffentliche GitHub-Datei.

### Zugriff

- Öffentliche Seite: `http://SERVER-IP:8085`
- Adminbereich: `http://SERVER-IP:8085/admin.html`

## Alternative: Stack direkt aus dem GitHub-Repository

In Portainer **Stacks → Add stack → Repository** auswählen und folgende Angaben verwenden:

- Repository URL: `https://github.com/gedankenstrom/guest-wifi.git`
- Reference: `refs/heads/main`
- Compose path: `docker-compose.yml`

Auch bei dieser Methode müssen `SESSION_SECRET` und `ADMIN_PASSWORD` unter den Stack-Umgebungsvariablen gesetzt werden.

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
