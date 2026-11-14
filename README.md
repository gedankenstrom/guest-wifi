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

## Portainer / Docker Compose

1. Repository `gedankenstrom/guest-wifi` in Portainer als Stack hinzufügen.
2. Vor dem Deploy in `docker-compose.yml` unbedingt diese Werte ändern:
   - `SESSION_SECRET`: zufälliger, langer Wert (mindestens 32 Zeichen)
   - `ADMIN_PASSWORD`: eigenes, starkes Admin-Passwort
   - optional `ADMIN_USERNAME`
3. Stack deployen.
4. Öffnen: `http://SERVER-IP:8085`
5. Adminbereich: `http://SERVER-IP:8085/admin.html`

Ein Secret kannst du beispielsweise mit `openssl rand -hex 32` erzeugen.

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
