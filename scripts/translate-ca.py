#!/usr/bin/env python3
"""
Genera title_ca i notes_ca per a les activitats en Català/Valencià
que tenen títol o notes en castellà.
Usa l'API de Claude per fer la traducció en lots.
"""

import json
import os
import time
import anthropic

GAMES_PATH = "data/games.json"
BATCH_SIZE = 10

CA_MARKERS = ['à', 'è', 'ï', '·l', 'ny', 'ix', 'aix', 'eix', 'tge']
ES_MARKERS = ['ción', 'sión', 'ñ', 'ación', 'oción', 'mente ', 'aprender',
              'aprend', 'Aprend', 'jueg', 'lleva', 'llega', 'rr']


def looks_spanish(text):
    if not text:
        return False
    t = text.lower()
    has_ca = any(m in t for m in CA_MARKERS)
    has_es = any(m in t for m in ES_MARKERS)
    return has_es and not has_ca


def needs_translation(game):
    if game.get('language') != 'Català/Valencià':
        return False
    if game.get('title_ca') and game.get('notes_ca') is not None:
        return False
    return looks_spanish(game.get('title', '')) or looks_spanish(game.get('notes', ''))


def translate_batch(client, batch):
    items = []
    for i, game in enumerate(batch):
        item = {"i": i, "title": game.get('title', '')}
        if game.get('notes'):
            item["notes"] = game['notes']
        items.append(item)

    prompt = f"""Tradueix al català/valencià estos títols i descripcions d'activitats educatives.
Retorna ÚNICAMENT un array JSON amb el mateix ordre i format:
[{{"i": 0, "title_ca": "...", "notes_ca": "..."}}]
Si notes és buit o no existeix, posa notes_ca com a cadena buida.
Usa un registre natural i proper al valencià/català estàndard.

Input:
{json.dumps(items, ensure_ascii=False)}"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    # Extrau el JSON de la resposta
    start = text.find('[')
    end = text.rfind(']') + 1
    return json.loads(text[start:end])


def main():
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("Error: cal definir ANTHROPIC_API_KEY")
        return

    client = anthropic.Anthropic(api_key=api_key)

    games = json.load(open(GAMES_PATH, encoding='utf-8'))
    to_translate = [(i, g) for i, g in enumerate(games) if needs_translation(g)]

    print(f"Activitats a traduir: {len(to_translate)}")
    if not to_translate:
        print("Res a fer.")
        return

    translated = 0
    for batch_start in range(0, len(to_translate), BATCH_SIZE):
        batch_pairs = to_translate[batch_start:batch_start + BATCH_SIZE]
        batch_games = [g for _, g in batch_pairs]

        print(f"  Lot {batch_start // BATCH_SIZE + 1}: {[g['title'] for g in batch_games]}")
        results = translate_batch(client, batch_games)

        for result in results:
            idx = batch_pairs[result['i']][0]
            games[idx]['title_ca'] = result.get('title_ca', '')
            games[idx]['notes_ca'] = result.get('notes_ca', '')
            translated += 1

        if batch_start + BATCH_SIZE < len(to_translate):
            time.sleep(0.5)

    open(GAMES_PATH, 'w', encoding='utf-8').write(
        json.dumps(games, ensure_ascii=False, indent=2)
    )
    print(f"Traduccions completades: {translated}")


if __name__ == '__main__':
    main()
