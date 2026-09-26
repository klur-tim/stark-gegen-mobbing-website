/* Stark gegen Mobbing – texte-neu.js
   Die überarbeiteten Texte als Tabelle: CSS-Selektor → neuer Text. Einzige Quelle für
   index.html?texte=neu (site.js) und die Vorher/Nachher-Liste im Handbuch (designsystem.js).
   Regeln: Fakten nur aus dem Briefing des Vereins, keine erfundenen Zahlen, Zitate oder Ergebnisse.
   Ein Schlüssel mit „@“ fügt eine Zeile NACH dem Element ein ({ after: '…' }). */
window.SGM_TEXTE = {
  '.hero-sub': 'Kinder und Jugendliche mit und ohne Behinderung spielen Szenen aus ihrem Alltag und üben auf der Bühne, Nein zu sagen. Angeleitet vom Schauspieler Sebastian Kolb.',
  '.hero-actions@sub': { after: '<p class="label muted hero-hint">Der Kennlerntag ist zum Reinschnuppern. Danach entscheidet ihr, ob der Workshop passt.</p>' },
  '.about-lead': 'Wer gemobbt wird, wird oft still. Bei uns üben Kinder und Jugendliche mit und ohne Behinderung auf der Bühne, laut zu werden.',
  '.about-text p:nth-of-type(1)': 'Mobbing nimmt im Alltag von Kindern immer mehr Raum ein, gerade bei Kindern mit Behinderung. Der Taekwondo Team Kocer e.V. hält mit diesem Projekt dagegen, getragen von Ehrenamtlichen mit ganz unterschiedlichen Berufen.',
  '.about-text p:nth-of-type(2)': 'Sebastian Kolb, Schauspieler aus Film und Fernsehen, leitet die Workshops. Die Kinder bringen ihre eigenen Erlebnisse mit, daraus entstehen Szenen. Wir schauen dabei auf das, was sie können, nicht auf das, was ihnen schwerfällt.',
  '.about-text p:nth-of-type(3)': 'Am Ende soll jedes Kind wissen, wo seine Stärken liegen, und sie auch dann finden, wenn es schwierig wird.',
  '.about-point--1 p': 'Wir schauen auf das, was ein Kind kann. Wer seine Stärken kennt, steht sicherer, auch wenn es schwierig wird.',
  '.about-point--2 p': 'Mit und ohne Behinderung, mit ganz verschiedenen Erfahrungen. In der Gruppe ist jede Person anders, und genau das macht die Szenen gut.',
  '.about-point--3 p': 'Eine Szene funktioniert nur, wenn alle mitspielen. Auf der Bühne erleben die Kinder, wie viel sie zusammen schaffen.',
  '.offers-intro': 'Man kann klein anfangen: erst zuhören, dann einen Tag reinschnuppern, dann mitspielen.',
  '.offer--1 p': 'Wir lesen aus Kinder- und Jugendbüchern, in denen jemand Mut findet. Danach wird gefragt und erzählt. Die Buchliste folgt.',
  '.offer--2 p': 'Ein Tag zum Reinschnuppern mit Spielen und einer ersten kleinen Szene. Danach wisst ihr, ob der Workshop passt.',
  '.offer--3 p': 'Mit Sebastian Kolb entwickelt die Gruppe eigene Szenen zum Thema Mobbing und bringt sie auf die Bühne. Tempo und Inhalt passen wir an jedes Kind an.',
  '.offers-foot p': 'Alle Angebote sind inklusiv. Sagt uns vorher, was euer Kind braucht.',
  '.impressions-intro': 'So kann ein Tag bei uns aussehen. Die Bilder sind Illustrationen, echte Fotos folgen mit Einverständnis der Familien.',
  '.impressions-note > p.muted': 'Echte Fotos aus den Projekten zeigen wir erst, wenn die Familien zugestimmt haben.',
  '.team-intro': 'Hinter dem Projekt stehen ein Schauspieler, eine Pädagogin und der Vorstand des Vereins.',
  '.contact-intro': 'Schreib uns, welches Angebot dich interessiert, gern mit Alter und Größe der Gruppe. Wir melden uns mit einem Terminvorschlag.'
};
