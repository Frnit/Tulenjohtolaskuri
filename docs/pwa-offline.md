# PWA- ja offline-sopimus

Sovelluksen manuaaliset työnkulut sekä main- ja AR-käyttöliittymät kuuluvat
offline-Coreen. Ne toimivat ilman verkkoyhteyttä sen jälkeen, kun service worker
on asentunut onnistuneesti, hallitsee sivua ja käyttöliittymä näyttää tilan
`OFFLINE: VALMIS`.

Kamera ja suunta-anturi eivät tarvitse sovelluksen omaa verkkoyhteyttä, mutta ne
edellyttävät laitteen ja selaimen tukea, suojattua yhteyttä sekä käyttäjän lupaa.
Sijaintirajapinta on offline-ehdollinen: uuden sijaintiarvon saatavuutta ilman
verkkoa ei luvata.

## Päivitys

Uusi julkaisu ladataan omaan versionoituun cacheen ja jää odottamaan. Sovellus
näyttää päivityspainikkeen. Päivitys aktivoituu vasta käyttäjän painalluksesta,
minkä jälkeen saman sovelluksen avoimet välilehdet latautuvat hallitusti uudelleen.

Jos uuden julkaisun lataaminen epäonnistuu, keskeneräinen cache poistetaan ja
nykyinen toimiva julkaisu jatkaa käytössä. Sovellus poistaa vain omalla
`tjl-core-`-prefixillään nimetyt vanhat cachet eikä koske muihin originin cacheihin.

## Palautus

Aiempi lähdekoodi julkaistaan palautustilanteessa uutena buildina ja uudella
`swBuildId`-tunnisteella. Cacheversion tunnistetta ei kelata taaksepäin eikä
tallennusskeemaa alenneta automaattisesti. Nykyistä skeemaa tuntematon versio
säilyttää tietueen ja käynnistyy turvallisilla oletuksilla P2.3-sopimuksen mukaan.
