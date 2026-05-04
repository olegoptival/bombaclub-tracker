"""
Settle-up algorithms for poker club tracker.

Two algorithms provided:
  - greedy_settle: жадный (быстрый, ~оптимальный на бытовых данных)
  - exact_settle:  точный bitmask DP (гарантирует минимум, до ~15 игроков)

Both возвращают список переводов: [(from_idx, to_idx, amount), ...]
"""

from dataclasses import dataclass
from typing import List, Tuple
from decimal import Decimal


@dataclass
class Balance:
    """Баланс одного игрока."""
    player_id: str           # club_member_id
    name: str                # для отображения
    amount: Decimal          # положительный = ему должны; отрицательный = он должен


@dataclass
class Transfer:
    """Один перевод в settle-up."""
    from_player_id: str
    from_player_name: str
    to_player_id: str
    to_player_name: str
    amount: Decimal


# ---------------------------------------------------------------------------
# Жадный алгоритм
# ---------------------------------------------------------------------------

def greedy_settle(balances: List[Balance]) -> List[Transfer]:
    """
    Жадный алгоритм минимизации переводов.
    
    Сложность: O(n log n) за счёт сортировки.
    Гарантия: правильный результат (балансы обнуляются), число переводов
    обычно близко к минимуму, но НЕ всегда минимум.
    """
    # Копируем чтобы не мутировать
    creditors = sorted(
        [b for b in balances if b.amount > 0],
        key=lambda b: -b.amount
    )
    debtors = sorted(
        [b for b in balances if b.amount < 0],
        key=lambda b: b.amount  # самые "минусовые" первыми
    )
    
    # Будем работать со списками [name_id, remaining]
    cred_list = [[b, b.amount] for b in creditors]
    debt_list = [[b, -b.amount] for b in debtors]  # делаем положительными для удобства
    
    transfers: List[Transfer] = []
    i = 0  # указатель в debt_list
    j = 0  # указатель в cred_list
    
    while i < len(debt_list) and j < len(cred_list):
        debtor, debt_remaining = debt_list[i]
        creditor, cred_remaining = cred_list[j]
        
        amount = min(debt_remaining, cred_remaining)
        transfers.append(Transfer(
            from_player_id=debtor.player_id,
            from_player_name=debtor.name,
            to_player_id=creditor.player_id,
            to_player_name=creditor.name,
            amount=amount,
        ))
        
        debt_list[i][1] -= amount
        cred_list[j][1] -= amount
        
        if debt_list[i][1] == 0:
            i += 1
        if cred_list[j][1] == 0:
            j += 1
    
    return transfers


# ---------------------------------------------------------------------------
# Точный алгоритм (bitmask DP)
# ---------------------------------------------------------------------------

def exact_settle(balances: List[Balance]) -> List[Transfer]:
    """
    Точный алгоритм. Гарантирует МИНИМАЛЬНОЕ число переводов.
    
    Идея: разбиваем игроков на максимально возможное число
    подгрупп, в каждой из которых сумма балансов = 0. Внутри
    подгруппы из k человек нужно k-1 переводов. Итого: n - max_groups.
    
    Сложность: O(2^n) по времени и памяти. Применять при n ≤ 15.
    
    Внутри каждой найденной подгруппы переводы ищем жадно — это уже
    оптимально для подгруппы с нулевой суммой.
    """
    # Отфильтровываем нулевые
    non_zero = [b for b in balances if b.amount != 0]
    n = len(non_zero)
    
    if n == 0:
        return []
    if n > 20:
        # Защита: для большого числа игроков точный алгоритм нереалистичен.
        # Падаем обратно на жадный.
        return greedy_settle(balances)
    
    # max_zero_groups[mask] = максимум подгрупп с нулевой суммой,
    # на которые можно разбить игроков из mask
    full_mask = (1 << n) - 1
    max_zero_groups = [0] * (1 << n)
    
    # Предвычисляем сумму для каждого подмножества
    subset_sum = [Decimal(0)] * (1 << n)
    for mask in range(1, 1 << n):
        # Берём младший установленный бит
        lsb = mask & (-mask)
        idx = lsb.bit_length() - 1
        subset_sum[mask] = subset_sum[mask ^ lsb] + non_zero[idx].amount
    
    # DP по подмножествам
    for mask in range(1, 1 << n):
        # Перебираем все непустые подмаски mask и проверяем,
        # является ли она подгруппой с нулевой суммой
        sub = mask
        while sub > 0:
            if subset_sum[sub] == 0:
                # sub - подгруппа с нулевой суммой
                rest = mask ^ sub
                candidate = max_zero_groups[rest] + 1
                if candidate > max_zero_groups[mask]:
                    max_zero_groups[mask] = candidate
            sub = (sub - 1) & mask
    
    # Восстанавливаем разбиение
    transfers: List[Transfer] = []
    
    def reconstruct(mask: int) -> None:
        """Находим разбиение на zero-sum подгруппы и считаем для каждой."""
        if mask == 0:
            return
        target = max_zero_groups[mask]
        # Ищем подгруппу sub с zero-sum, такую что max_zero_groups[mask^sub] = target-1
        sub = mask
        while sub > 0:
            if (subset_sum[sub] == 0 and
                    max_zero_groups[mask ^ sub] == target - 1):
                # Нашли, обрабатываем sub
                group = [non_zero[i] for i in range(n) if sub & (1 << i)]
                transfers.extend(greedy_settle(group))
                reconstruct(mask ^ sub)
                return
            sub = (sub - 1) & mask
    
    reconstruct(full_mask)
    return transfers


# ---------------------------------------------------------------------------
# Тесты
# ---------------------------------------------------------------------------

def _test_correctness(transfers, balances):
    """Проверяем что после переводов все балансы = 0."""
    delta = {b.player_id: b.amount for b in balances}
    for t in transfers:
        delta[t.from_player_id] -= t.amount  # должник заплатил
        delta[t.to_player_id] += t.amount    # кредитор получил минус-долг
    # Постойте: должник имеет отрицательный баланс, платит → его баланс растёт.
    # Перепроверим:
    delta = {b.player_id: b.amount for b in balances}
    for t in transfers:
        delta[t.from_player_id] += t.amount  # его минус становится менее минусовым
        delta[t.to_player_id] -= t.amount    # его плюс уменьшается
    return all(v == 0 for v in delta.values())


if __name__ == "__main__":
    from decimal import Decimal as D
    
    # Тест 1: классический пример с одной сессии
    print("=" * 60)
    print("TEST 1: ClubGG single screen aggregate")
    print("=" * 60)
    bs = [
        Balance("p1", "Yakirsneh",     D("138.59")),
        Balance("p2", "Don ron99",     D("1176.92")),
        Balance("p3", "Idanbu3224",    D("-4.41")),
        Balance("p4", "The PAZ Okay",  D("395.79")),
        Balance("p5", "Ronc102",       D("-300")),
        Balance("p6", "omer525",       D("-236.64")),
        Balance("p7", "lok113",        D("-1170.25")),
    ]
    
    g = greedy_settle(bs)
    print(f"\nGreedy: {len(g)} transfers")
    for t in g:
        print(f"  {t.from_player_name:15} → {t.to_player_name:15}  {t.amount}")
    print(f"  correct: {_test_correctness(g, bs)}")
    
    e = exact_settle(bs)
    print(f"\nExact:  {len(e)} transfers")
    for t in e:
        print(f"  {t.from_player_name:15} → {t.to_player_name:15}  {t.amount}")
    print(f"  correct: {_test_correctness(e, bs)}")
    
    # Тест 2: aggregate по двум скринам
    print("\n" + "=" * 60)
    print("TEST 2: ClubGG aggregate over 2 screens")
    print("=" * 60)
    bs2 = [
        Balance("p1", "Yakirsneh",     D("1.47")),
        Balance("p2", "Don ron99",     D("1801.90")),
        Balance("p3", "Idanbu3224",    D("95.17")),
        Balance("p4", "The PAZ Okay",  D("401.71")),
        Balance("p5", "Ronc102",       D("-300")),
        Balance("p6", "omer525",       D("-400")),
        Balance("p7", "lok113",        D("-1600.25")),
    ]
    
    g2 = greedy_settle(bs2)
    e2 = exact_settle(bs2)
    print(f"Greedy: {len(g2)} transfers, correct: {_test_correctness(g2, bs2)}")
    print(f"Exact:  {len(e2)} transfers, correct: {_test_correctness(e2, bs2)}")
    for t in e2:
        print(f"  {t.from_player_name:15} → {t.to_player_name:15}  {t.amount}")
    
    # Тест 3: случай где жадный отстаёт
    print("\n" + "=" * 60)
    print("TEST 3: case where greedy might be suboptimal")
    print("=" * 60)
    # 5+5+5+5 vs 10+10 - жадный делает 4, оптимум тоже 4 (4 - 2*1 = 2 группы по 3 → 4 переводов)
    # Хотя нет: 4 кредитора + 2 должника = 6 человек. Можно разбить на 2 группы:
    # {A(+5), B(+5), E(-10)} → 2 перевода; {C(+5), D(+5), F(-10)} → 2 перевода.
    # Итого 4. Жадный тоже даёт 4. Здесь они равны.
    
    # Реальный кейс расхождения:
    bs3 = [
        Balance("a", "A", D("3")),
        Balance("b", "B", D("3")),
        Balance("c", "C", D("4")),
        Balance("d", "D", D("-3")),
        Balance("e", "E", D("-3")),
        Balance("f", "F", D("-4")),
    ]
    g3 = greedy_settle(bs3)
    e3 = exact_settle(bs3)
    print(f"Greedy: {len(g3)} transfers")
    print(f"Exact:  {len(e3)} transfers (можно разбить на 3 пары — 3 перевода)")
    for t in e3:
        print(f"  {t.from_player_name} → {t.to_player_name}  {t.amount}")
