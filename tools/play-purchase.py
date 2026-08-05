#!/usr/bin/env python3
"""
Работа с покупками в Google Play из командной строки.

Зачем: возвращённый, но не потреблённый заказ намертво блокирует повторную
покупку — Play считает товар принадлежащим аккаунту и на любую попытку купить
отвечает ITEM_ALREADY_OWNED, а RevenueCat не выдаёт entitlement. Найти такие
заказы в консоли можно только глазами, а «Вернуть платёж» их не освобождает.

Использование:
    play-purchase.py <ключ.json> voided [дней]     список аннулированных покупок
    play-purchase.py <ключ.json> get <token>       состояние покупки
    play-purchase.py <ключ.json> consume <token>   пометить потреблённой (товар снова покупаем)
    play-purchase.py <ключ.json> revoke <token>    отозвать покупку
    play-purchase.py <ключ.json> cleanup [дней]    показать зависшие (ничего не меняет)
    play-purchase.py <ключ.json> cleanup [дней] --apply   потребить их

Ключ — JSON сервисного аккаунта с правами на просмотр финансовых данных и
управление заказами (Play Console → Пользователи и разрешения).
"""
import base64
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PACKAGE = 'com.gliderk.cakecalc'
PRODUCT = 'cakecalc_pro'
API = f'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PACKAGE}'

PURCHASE_STATE = {0: 'куплена', 1: 'отменена', 2: 'ожидает оплаты'}
CONSUMPTION_STATE = {0: 'НЕ потреблена', 1: 'потреблена'}


def access_token(key_file: str) -> str:
    data = json.load(open(key_file))
    pem = '/tmp/play-purchase-key.pem'
    with open(pem, 'w') as f:
        f.write(data['private_key'])
    os.chmod(pem, 0o600)

    def b64(raw: bytes) -> str:
        return base64.urlsafe_b64encode(raw).decode().rstrip('=')

    now = int(time.time())
    header = b64(b'{"alg":"RS256","typ":"JWT"}')
    claim = b64(json.dumps({
        'iss': data['client_email'],
        'scope': 'https://www.googleapis.com/auth/androidpublisher',
        'aud': 'https://oauth2.googleapis.com/token',
        'exp': now + 3600,
        'iat': now,
    }).encode())
    signature = subprocess.run(
        ['openssl', 'dgst', '-sha256', '-sign', pem],
        input=f'{header}.{claim}'.encode(), capture_output=True, check=True
    ).stdout
    os.remove(pem)

    body = urllib.parse.urlencode({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': f'{header}.{claim}.{b64(signature)}',
    }).encode()
    request = urllib.request.Request('https://oauth2.googleapis.com/token', data=body)
    return json.load(urllib.request.urlopen(request))['access_token']


def call(token: str, method: str, url: str):
    request = urllib.request.Request(url, method=method)
    request.add_header('Authorization', f'Bearer {token}')
    if method == 'POST':
        request.add_header('Content-Length', '0')
    try:
        with urllib.request.urlopen(request) as response:
            raw = response.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        return {'error': json.loads(e.read().decode()).get('error', {})}


def describe(purchase: dict) -> str:
    if 'error' in purchase:
        return f"ошибка: {purchase['error'].get('message', '')}"
    state = PURCHASE_STATE.get(purchase.get('purchaseState'), purchase.get('purchaseState'))
    consumed = CONSUMPTION_STATE.get(purchase.get('consumptionState'), purchase.get('consumptionState'))
    kind = 'тестовая' if purchase.get('purchaseType') == 0 else 'обычная'

    # Непотреблённая покупка — норма, пока она действует: так и выглядит владение Pro.
    # Проблема — когда покупка отменена или ожидает оплаты, но всё ещё числится за
    # аккаунтом: тогда Play не даёт купить заново, а entitlement уже не выдаётся.
    is_stuck = purchase.get('consumptionState') == 0 and purchase.get('purchaseState') in (1, 2)
    warning = ' — ЗАВИСЛА: не даст купить заново, освободите consume' if is_stuck else ''

    return f"заказ {purchase.get('orderId', '—')}: {state}, {consumed}, {kind}{warning}"


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 1

    key_file, command = sys.argv[1], sys.argv[2]
    rest = sys.argv[3:]
    token = access_token(key_file)

    if command == 'get':
        if not rest:
            print('нужен purchaseToken')
            return 1
        print(describe(call(token, 'GET', f'{API}/purchases/products/{PRODUCT}/tokens/{rest[0]}')))
        return 0

    if command in ('consume', 'revoke'):
        if not rest:
            print('нужен purchaseToken')
            return 1
        result = call(token, 'POST', f'{API}/purchases/products/{PRODUCT}/tokens/{rest[0]}:{command}')
        if 'error' in result:
            print(f"ошибка: {result['error'].get('message', '')}")
            return 1
        print(f'{command}: готово')
        print(describe(call(token, 'GET', f'{API}/purchases/products/{PRODUCT}/tokens/{rest[0]}')))
        return 0

    if command in ('voided', 'cleanup'):
        days = int(rest[0]) if rest and rest[0].isdigit() else 30
        apply = '--apply' in rest
        # Play хранит список аннулированных покупок примерно за месяц и отвергает
        # startTime у самой границы, поэтому за длинный период просто не задаём его
        # и берём всё, что отдаёт API. Заказ старше окна освобождается вручную по
        # токену из консоли (кнопка «Копировать токен покупки»).
        url = f'{API}/purchases/voidedpurchases'
        if days < 29:
            url += f'?startTime={int((time.time() - days * 86400) * 1000)}'
        else:
            print('за период больше месяца Play данных не отдаёт — беру всё доступное окно')
        result = call(token, 'GET', url)
        if 'error' in result:
            print(f"ошибка: {result['error'].get('message', '')}")
            return 1

        voided = result.get('voidedPurchases', [])
        print(f'аннулированных покупок за {days} дн.: {len(voided)}')

        stuck = []
        for item in voided:
            purchase_token = item.get('purchaseToken', '')
            state = call(token, 'GET', f'{API}/purchases/products/{PRODUCT}/tokens/{purchase_token}')
            if 'error' in state:
                continue
            print(f'  {describe(state)}')
            # список voided — это уже возвращённые заказы; блокирует тот, что не потреблён
            if state.get('consumptionState') == 0:
                stuck.append((item.get('orderId') or state.get('orderId'), purchase_token))

        if not stuck:
            print('зависших покупок нет — товар свободен')
            return 0

        print(f'\nзависших (возвращены, но не потреблены): {len(stuck)}')
        if not apply:
            print('это была проверка; чтобы освободить товар, добавьте --apply')
            return 0

        for order_id, purchase_token in stuck:
            res = call(token, 'POST', f'{API}/purchases/products/{PRODUCT}/tokens/{purchase_token}:consume')
            status = 'освобождена' if 'error' not in res else res['error'].get('message', '')
            print(f'  {order_id}: {status}')
        return 0

    print(f'неизвестная команда: {command}')
    print(__doc__)
    return 1


if __name__ == '__main__':
    sys.exit(main())
