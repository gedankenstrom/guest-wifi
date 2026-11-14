const $=id=>document.getElementById(id);let currentPassword="";
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200)}
async function copyText(text){
  if(!text)throw Error("Kein Passwort vorhanden");
  if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return}
  const field=document.createElement("textarea");
  field.value=text;field.setAttribute("readonly","");
  field.style.position="fixed";field.style.left="-9999px";field.style.top="0";field.style.opacity="0";
  document.body.appendChild(field);field.focus();field.select();field.setSelectionRange(0,field.value.length);
  let copied=false;try{copied=document.execCommand("copy")}finally{field.remove()}
  if(!copied)throw Error("Kopieren fehlgeschlagen");
}
async function init(){try{
  const r=await fetch("/api/public",{cache:"no-store"}),d=await r.json();
  if(!d.enabled){$("qr").remove();$("ssid").textContent="Derzeit nicht verfügbar";$("password").textContent="";$("download").disabled=true;$("copy").disabled=true;return}
  currentPassword=d.password||"";$("ssid").textContent=d.ssid;$("password").textContent=d.password;
  const q=await fetch("/api/qr",{cache:"no-store"});if(!q.ok)throw Error();$("qr").src=(await q.json()).dataUrl;
}catch(e){document.querySelector(".public-wrap").innerHTML='<div class="error">Das Gäste-WLAN ist momentan nicht verfügbar. Bitte versuche es später erneut.</div>'}}
$("copy").addEventListener("click",async()=>{try{await copyText(currentPassword);toast("Passwort kopiert")}catch{toast("Kopieren nicht möglich – bitte Passwort markieren und kopieren")}});
$("download").addEventListener("click",()=>{const a=document.createElement("a");a.href="/api/qr.png";a.download="guest-wifi-qr.png";a.click()});
init();