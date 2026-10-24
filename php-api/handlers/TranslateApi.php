<?php

declare(strict_types=1);

namespace WT\Handlers;

use WT\Auth;
use WT\External;
use WT\Http;
use WT\Router;
use WT\Validator;

/**
 * POST /api/dashboard/translate — port de app/api/dashboard/translate :
 * traduction DeepL des textes du dashboard (bouton « Traduire en
 * anglais » des formulaires). Admin+éditeur uniquement ; 503 explicite
 * sans DEEPL_API_KEY. L'anglais cible se précise en en-US.
 */
final class TranslateApi
{
    private const LOCALES = ['fr', 'en'];

    public static function registerRoutes(): void
    {
        Router::post('/api/dashboard/translate', [self::class, 'translate']);
    }

    public static function translate(): never
    {
        Auth::requireSession(['admin', 'editor']);

        $v = Validator::body();
        $v->texts('texts');
        $v->enum('sourceLocale', self::LOCALES);
        $v->reqEnum('targetLocale', self::LOCALES);
        $v->fail();
        $data = $v->d();
        $texts = $data['texts'];
        $source = $data['sourceLocale'] ?? null;

        if (!External::isDeeplConfigured()) {
            Http::serviceUnavailable("DeepL n'est pas configuré : définissez DEEPL_API_KEY (serveur)");
        }

        // Codes DeepL : cible « en » → en-US ; la source reste « en ».
        $target = $data['targetLocale'] === 'en' ? 'en-US' : 'fr';
        $translated = External::translateTexts(array_values($texts), $target, $source);

        $out = [];
        $index = 0;
        foreach (array_keys($texts) as $key) {
            $out[$key] = $translated[$index++];
        }
        Http::ok(['texts' => $out, 'targetLocale' => $data['targetLocale']]);
    }
}
