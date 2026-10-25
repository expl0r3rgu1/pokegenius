"""Refresh the checked-in national dex and sprites. No runtime API is used."""
import concurrent.futures
import csv
import io
import json
from pathlib import Path
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'
SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'

def download(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=40) as response:
                return response.read()
        except Exception:
            if attempt == 3:
                raise
            time.sleep(attempt + 1)

def table(name):
    return list(csv.DictReader(io.StringIO(download(BASE + name + '.csv').decode())))

def main():
    species = {int(p['id']): p for p in table('pokemon_species') if int(p['id']) <= 1025}
    types = {p['id']: p['identifier'] for p in table('types')}
    pokemon_types = {}
    for row in table('pokemon_types'):
        pokemon_types.setdefault(int(row['pokemon_id']), []).append(types[row['type_id']])
    names = {int(p['pokemon_species_id']): p['name'] for p in table('pokemon_species_names') if p['local_language_id'] == '9'}
    defaults = {int(p['species_id']): p for p in table('pokemon') if p['is_default'] == '1'}
    stats = {}
    for row in table('pokemon_stats'):
        stats.setdefault(int(row['pokemon_id']), {})[row['stat_id']] = int(row['base_stat'])
    dex = [{'id': i, 'name': names[i], 'slug': defaults[i]['identifier'], 'gen': int(s['generation_id']), 'types': pokemon_types[int(defaults[i]['id'])], 'height': int(defaults[i]['height']) / 10, 'weight': int(defaults[i]['weight']) / 10, 'stats': [stats[int(defaults[i]['id'])][str(n)] for n in range(1, 7)]} for i, s in sorted(species.items())]
    assert len(dex) == 1025 and all(p['types'] for p in dex)
    (ROOT / 'src/data/pokemon.json').write_text(json.dumps(dex, ensure_ascii=False, separators=(',', ':')) + '\n')
    def sprite(p):
        path = ROOT / 'public/sprites' / (str(p['id']) + '.png')
        if not path.exists():
            path.write_bytes(download(SPRITES + defaults[p['id']]['id'] + '.png'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        list(pool.map(sprite, dex))
    for i in [6, 25, 94, 133, 201, 479, 143, 448]:
        (ROOT / 'public/art' / f'{i}.png').write_bytes(download(SPRITES + f'other/official-artwork/{i}.png'))
    print(f'Prepared {len(dex)} Pokemon and local sprites.')

if __name__ == '__main__':
    main()
