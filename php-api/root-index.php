<?php
// Front controller minimal pour la racine du sous-domaine API.
// Redirige la racine vers l'API (l'API est servie sous /api/).
header('Location: /api/', true, 302);
exit;
