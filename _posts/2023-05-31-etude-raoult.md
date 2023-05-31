---
title: Résultats de la dernière étude de Raoult
subtitle: Fin alternative au papier
---

La [dernière étude cosignée par le Dr. Raoult](https://www.medrxiv.org/content/10.1101/2023.04.03.23287649v1.full.pdf) est disponible
en prépublication sur medRxiv. De plus, les données, "constatées par huissier" (je ne sais pas ce que ça veut dire), sont disponible !
Nous n'aurons donc pas cette fois à deviner le contenu des cohortes et simuler des populations pour reproduire ces résultats.

Note : Je pense que les spécialistes en statistiques arriveront très bien à mener leurs propres études. Ce post est donc destiné aux
néophytes, il a donc été fait pour être accessible au plus grand nombre.

TL;DR: Je fais dans ce blog post une analyse rapide qui montre que la publication a les mêmes travers que les précédentes. N'ayant pas
réussi à reproduire exactement les résultats de l'étude (des indications méthodologiques comme le traitement des données manquantes ne
sont pas explicites), je pratique une analyse plus simple et accessible à tous. On voit alors que les données-mêmes fournies par l'IHU
montrent que le traitement ne fonctionne pas mieux qu'un autre.

Je m'excuse d'avance : je n'ai pas eu le temps de générer de beaux graphiques pour illustrer les chiffres ici. C'est donc assez aride
pour le moment.

Le notebook pour reproduire ces résultats est disponible [ici](https://github.com/AlexandreAbraham/alexandreabraham.github.io/blob/master/dload/blog_post_raoult_23.ipynb).

## Critique rapide du papier

Il a été reproché aux travaux précédent du Dr. Raoult d'ignorer les comorbidités, en particulier cardiaques, car le cocktail hydroxychloroquine
et azithromycine est déconseillé pour les personnes cardiaques. Ici, les comorbidités sont présentes. Mais on constate plusieurs problèmes :
* Elles ne sont pas présentes pour tous, ainsi, seuls quelques 16 000 patients ont ces données renseignées.
* Dans le cas particulier des maladies cardiaques, on constate qu'il y a 6.4% des patients qui en souffrent chez les non traités HCQ+AZ, contre
  1.8% chez les traités. On peut donc supposer que ces 1.8% sont des patients très légers car aucun médecin ne préscrirait ce traitement à un
  patient avec une pathologie sérieuse. On voit donc qu'une donnée nous échappe : la gravité de la comorbidité.
* Nous ne savons pas ce qui a été fait pour les patients qui n'ont pas leur comorbidité de renseignée.
* Dans l'analyse des facteurs contributifs à la mortalité, nous avons tout sauf la vaccination et les comorbidités. Pourquoi ? Je ne peux que faire
  des hypothèses, contactez-moi si vous avez une réponse.

Pour toutes ces raisons, je pense que sans analyse complémentaire ces travaux ont toutes les chances de se voir refusées où qu'ils soient soumis.

## Analyse des résultats

Lançons-nous dans l'analyse de ces résultats ! Je précise que toute cette section a été faite pour être accessible à n'importe qui ! N'hésitez donc
pas à vous y aventurer même si vous ne connaissez rien aux statistiques ou au domaine médical. J'y détaille également mon point de vue critique pour
que vous puissiez voir comment un scientifique (en tout cas moi) approche des données. Vous pourrez également constater que je ne sais aucune manipulation
trompeuse.

### Première étape : filtrage des données

Regardons les données disponibles. Je télécharge la base de données et je constate :
* 30 423 patients, comme mentionné dans le papier
* 30 202 patients restent après avoir retiré les 221 patients dont le traitement n'est pas connu
* Parmi ces patients restants, 23 172 sont traités à HCQ+AZ, 7 030 avec un autre traitement

Heurtons-nous au premier problème : il est mentionné que le passif médical (comorbidités, vaccination) n'est connu que pour environ la moitié des patients.
Ne sachant pas comment l'IHU a traité les autres, de mon côté, je vais simplement les retirer :
* 14 139 patients sont retirés car nous ne connaissons pas leur passif médical
* Il reste donc 12 948 patients traités avec HCQ+AZ, 3 115 avec un autre traitement.

Nous avons assez filtré nos données, nous pouvons avancer !

### Deuxième étape : l'appariement des populations

Comme vous vous en doutez, il est difficile de comparer 12 948 patients à 3 115 autres. En particulier parce que l'IHU a bien précisé que le médecin avait
toute lattitude pour choisir le traitement : ce n'est donc pas un essai aléatoire ! Comme je l'ai déjà mentionné, les patients cardiaques par exemple ont
plus de chance de finir sans le traitement HCQ+AZ.

Je ne vais pas faire une étude épidémioliogique complète ici. L'IHU a décidé de procéder à la correction de ce biais en utilisant une analyse avec un modèle
de régression. Cette méthode a plusieurs défauts, mais je n'en citerai qu'un : elle ne va modéliser que les effets simples, et non les effets mixtes. Elle
suppose donc que les différents facteurs qui contribuent à la mortalité (l'âge, le sexe, les comorbidités...) sont indépendant les uns des autres. Pour résumer,
être cardiaque va influencer la moralité de la même façon, qu'on ait 50 ans ou 90 ans. Je ne suis pas médecin, je ne peux pas me prononcer sur ce critère, je vous
laisse juger selon vos connaissances.

Toutefois, cette méthode est validée et largement acceptée dans la communauté médicale, à condition de respecter certaines conditions. Personnellement, je travaille
avec les contraintes de la Haute Autorité de Santé qui [ne conseille pas cette approche pour la correction des résultats d'études non randomisées](https://www.has-sante.fr/upload/docs/application/pdf/2013-11/guide_methodologique_pour_le_developpement_clinique_des_dispositifs_medicaux.pdf). Elle lui préfère la méthode de correction par score de propension ou l'appariement de population. Nous allons procéder à cette dernière puisqu'elle est simple et très intuitive.

Voici comment on procède : pour chaque population, nous disposons de plusieurs indicateurs :
* Tranche d'âge
* Sexe
* Période de contamination
* Variant
* Si le patient a été vu en ambulatoire ou hospitalisé
* Les comorbidités du patient

Sur ces données, la méthode de calcul d'impact par régression va attribuer à chacun de ces facteurs un certain impact sur la mortalité. L'appariement à une
approche plus restrictive : pour chaque patient de la cohorte la plus petite (ici les patients non traités à l'HCQ+AZ), on va associer un patient de la cohorte traitée
à l'HCQ+AZ ayant exactement les mêmes caractéristiques pour tous les indicateurs. Si un patient est une femme de 50 ans avec un cancer, nous allons chercher
le même profil dans l'autre population. S'il n'y a aucun profil correspondant, on élimine le patient. S'il y en a plusieurs, on en prend un aléatoirement.

A la fin de ce calcul, on a donc un appariement un à un de tous les patients ! Plus précisément, on obtient deux populations de 1725 patients rigoureusement identiques
par rapport à tous les indicateurs fournis.

### Troisème étape : Comparaison statistique

Quel est l'avantage de cet appariement de population ? L'avantage est que nous avons maintenant deux populations identiques et donc comparables avec des
méthodes statistiques simples. Il est même très aisé de regarder soi-même la mortalité de chaque groupe. Voici donc les résultats :
- Dans la population non traitées, il y a 15 morts sur 1725 patients
- Dans la population traitée, il y a 10 morts pour 1725 patients

Peut-on en conclure que le traitement fonctionne ? Pour cela, il faut hélas faire appel aux statistiques, et c'est la seule partie un peu obscure de cette analyse,
je m'en excuse. A quoi servent les tests statistiques ? Lorsque vous tirez dix fois une pièces, il y a une probabilité, certes très faible, que vous tiriez "pile"
10 fois. Cette probabilité, nous pouvons la calculer. C'est la même chose ici. Nous allons calculer la probabilité que la différence de nombre de morts entre
les deux populations ne soit dû qu'à un pur hasard. Pour des événements à compter comme ceci, le test du Chi-2 est le test standard.

Le test du Chi-2 est sans appel : il y a 11.28% de chances que la différence de nombre de morts ne soit dû au hasard. Le traitement n'est donc pas en dessous
des 5%, valeur communément admise pour être significatif.

### Quatrième étape : Plus de statistiques

On pourrait rétorquer à cette analyse : Mais attends Alexandre, tu as fait un matching aléatoire des patients ! Il y a donc une forme d'incertitude. Et oui c'est vrai,
mais je voulais que cela reste accessible. Afin de savoir le chiffre réel, il y a plusieurs méthodes : la méthode dite "de Monte Carlo" consiste par exemple à
répéter cette analyse de nombreuses fois et à prendre la moyenne des résultats. Pour une cinquantaine de tirages, on obtient environ 14.95 morts dans le groupe non traité et 9.55 dans le groupe traite (oui, vous l'aurez deviné, j'ai initialisé pour générateur de nombre aléatoires dans la section précédente pour tomber au plus près des résultats moyens). Bien-sûr, il convient de calculer les intevalles de confiance, etc. Mais je n'ai pas le temps pour ça maintenant.

### Conclusion

Le monde médical est un monde complexe et, comme vous pouvez le constater, la statistique de mortalité dans des cohortes aussi petites de moins de 2000
patients peut prêter à confusion : il suffit qu'une personne meure un jour plus tard pour faire basculer les résultats. C'est pour cela qu'il faut répéter les études
car les erreurs arrivent, qu'elles soient commises de bonne ou de mauvaise foi.
