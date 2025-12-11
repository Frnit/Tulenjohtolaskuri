========================================================================
TJ-LASKURI PRO (v10) - KÄYTTÖOHJE JA DOKUMENTAATIO
========================================================================

1. YLEISKUVAUS
--------------
Tämä sovellus on optiseen mittaukseen perustuva laskin tulenjohto- ja 
tiedustelukäyttöön. Se on suunniteltu toimimaan selaimessa (HTML5) 
sekä asennettavana mobiilisovelluksena (PWA).

Sovellus laskee etäisyyden kohteeseen kolmiomittauksella hyödyntäen 
kameran kuvakulmaa (FOV), resoluutiota ja kohteen pikselikokoa kuvassa.
Lisäksi sovellus laskee kohteen koordinaatit (WGS84 ja MGRS).

2. ASENNUS JA VAATIMUKSET
-------------------------
Tiedostot:
- index.html    (Itse sovellus)
- manifest.json (Määritykset asennusta varten)
- sw.js         (Mahdollistaa offline-käytön)
- icon.png      (Sovelluksen kuvake, valinnainen)

Käyttö:
1. HTTPS-Yhteys: GPS ja Kompassi vaativat toimiakseen suojatun yhteyden 
   (esim. GitHub Pages). Ne EIVÄT toimi, jos avaat tiedoston suoraan 
   kansiosta (file://).
2. Asennus puhelimeen:
   - Android (Chrome): Valikko -> "Asenna sovellus" tai "Lisää aloitusnäytölle".
   - iOS (Safari): Jaa-painike -> "Lisää Koti-valikkoon".
3. Offline: Kun sovellus on kerran ladattu, se toimii ilman verkkoyhteyttä.

3. LASKENTATILAT (VÄLILEHDET)
-----------------------------
A) LASKE ETÄISYYS (Oletus)
   - Käyttötapaus: Tiedät kohteen koon (esim. BTR = 2.9m), haluat tietää etäisyyden.
   - Syöte: Maalin leveys (m) ja koko kuvassa (px).
   - Tulos: Viisto- ja maastoetäisyys.

B) LASKE KOKO (Tiedustelu)
   - Käyttötapaus: Tiedät etäisyyden (esim. laserilla mitattu), haluat 
     tietää kohteen fyysisen koon tunnistamista varten.
   - Syöte: Tunnettu etäisyys (m) ja koko kuvassa (px).
   - Tulos: Kohteen leveys metreinä.

4. KÄYTTÖLIITTYMÄN TOIMINNOT
----------------------------

PROFIILIT
- Voit tallentaa eri laitteiden asetukset (FOV, Resoluutio).
- Tallenna: Täytä kentät -> Paina "TAL" -> Anna nimi.
- Lataa: Valitse listasta.

OMAT SENSORIT (Vaatii HTTPS)
- 📍 GPS: Hakee oman sijainnin (WGS84). Päivittyy jatkuvasti.
- 🧭 Kompassi: Hakee puhelimen suunnan. Huom: iPhonessa vaatii luvan (Allow).
- Manuaalinen syöttö: Sijainnin voi syöttää myös käsin (Asteet, Minuutit, Sekunnit).

OPTIIKKA (Laskennan perusta)
- FOV (Field of View): Kameran vaakasuuntainen avauskulma.
- Yksiköt: 
  * Deg (Asteet, 360)
  * Mil (NATO, 6400)
  * PV (Piiru, 6000)
  * Mrad (Milliradiaani, aito)
- Resoluutio: Kuvan leveys pikseleinä (esim. 1920, 3840, 4000).

MAALIKIRJASTO (⚙ -ikoni)
- Voit valita vakiomaalin (esim. Mies, BTR, Lennokki).
- Voit lisätä omia maaleja ja poistaa niitä. Tiedot tallentuvat laitteen muistiin.

KORO (Elevation)
- Kulma vaakatason suhteen.
- 0 = Vaaka, + = Ylös, - = Alas.
- Vaikuttaa maastoetäisyyden ja korkeuseron laskentaan.

5. TULOSLAATIKON TIEDOT
-----------------------
ETÄISYYDET
- Viistoetäisyys (Slant Range): Suora linja linssistä kohteeseen.
- Maastoetäisyys (Ground Range): Etäisyys "kartalla". Lasketaan: Slant * cos(koro).
- Korkeusero: Paljonko kohde on ylempänä/alempana. Lasketaan: Slant * sin(koro).

MAALIN KOORDINAATIT
- WGS84: Lasketaan pallogeometrialla (Great Circle) omasta sijainnista, 
  suunnasta ja maastoetäisyydestä.
- MGRS: Automaattinen muunnos (tarkkuus 10 numeroa).
- Grid Siirtymä: Kertoo paljonko kohde on Pohjoiseen (N) ja Itään (E) 
  omasta sijainnista. Hyödyllinen paperikartan kanssa.

JOHNSONIN KRITEERIT (Kuvanlaatu)
- Liikennevalot kertovat, riittääkö pikselimäärä kohteen tunnistamiseen:
  🔴 Havaitseminen (>2px): "Jotain on tuolla"
  🟡 Luokittelu (>8px): "Se on pyöräajoneuvo"
  🟢 Tunnistus (>13px): "Se on BTR-80"

JAA-NAPPI (📤)
- Muodostaa valmiin viestin (Havainto/Maali, Sijainti, Etäisyys) ja 
  avaa puhelimen jakovalikon (Signal, SMS, WhatsApp).

6. ONGELMATILANTEET
-------------------
"GPS/Kompassi ei toimi"
-> Tarkista, että osoiterivillä lukee https:// (lukon kuva).
-> Tarkista, että olet antanut selaimelle luvan käyttää sijaintia.

"MGRS näyttää 'Err' tai 'Polar region'"
-> Olet syöttänyt virheelliset WGS84-koordinaatit tai olet napa-alueella.

"Etäisyys on ---"
-> Jokin pakollinen kenttä (FOV, Resoluutio, Maalin koko, Pikselit) puuttuu.

7. TIETOSUOJA
-------------
Sovellus toimii täysin paikallisesti käyttäjän laitteella.
Sijaintitietoja tai kameran tietoja EI lähetetä millekään palvelimelle.
Profiilit ja omat maalit tallennetaan selaimen välimuistiin (LocalStorage).

========================================================================
8. AR-TÄHTÄIN (Lisätty v11)
========================================================================
Sovelluksessa on nyt kokeellinen AR-tila (Augmented Reality).
Pääset siihen etusivun napista "📷 Siirry AR-Tähtäimeen".

MITEN SE TOIMII?
Käyttää puhelimen kameraa ja piirtää näytölle mittauskehyksen.
1. Valitse maali (esim. BTR).
2. Säädä liukusäätimellä kehys maalin kokoiseksi.
3. Lue etäisyys näytöltä.

TÄRKEÄÄ: KALIBROINTI
Jotta mittaus on tarkka, sinun täytyy kertoa sovellukselle puhelimesi 
kameran kuvakulma (FOV).
1. Mene AR-tilaan ja paina "⚙ Kalibroi".
2. Aseta tunnettu kohde (esim. ovi) tasan 5 metrin päähän.
3. Säädä kehys täsmälleen oven kokoiseksi.
4. Tallenna.
Nyt puhelimesi on kalibroitu ja mittaukset ovat tarkempia.

JÄÄDYTYS-TOIMINTO (❄️)
Käden tärinän estämiseksi voit painaa "Jäädytä"-nappia. Kuva pysähtyy, 
jolloin voit rauhassa sovittaa kehyksen maaliin.
========================================================================
========================================================================
