import { Prisma } from "@prisma/client";

const D = (x: Prisma.Decimal | number | string) => new Prisma.Decimal(x);

export type SettleBalance = {
  player_id: string;
  name: string;
  amount: Prisma.Decimal; // + ему должны, − он должен
};

export type SettleTransfer = {
  from_player_id: string;
  from_player_name: string;
  to_player_id: string;
  to_player_name: string;
  amount: Prisma.Decimal;
};

/**
 * Greedy settle-up. O(n log n).
 * Correct (zeroes all balances) but not always minimum number of transfers.
 */
export function greedySettle(balances: SettleBalance[]): SettleTransfer[] {
  const cred = balances
    .filter((b) => b.amount.gt(0))
    .sort((a, b) => b.amount.cmp(a.amount));
  const debt = balances
    .filter((b) => b.amount.lt(0))
    .sort((a, b) => a.amount.cmp(b.amount));

  const credList = cred.map((b) => ({ b, rem: b.amount }));
  const debtList = debt.map((b) => ({ b, rem: b.amount.neg() })); // make positive

  const transfers: SettleTransfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtList.length && j < credList.length) {
    const di = debtList[i]!;
    const cj = credList[j]!;
    const amount = Prisma.Decimal.min(di.rem, cj.rem);

    transfers.push({
      from_player_id: di.b.player_id,
      from_player_name: di.b.name,
      to_player_id: cj.b.player_id,
      to_player_name: cj.b.name,
      amount,
    });
    di.rem = di.rem.sub(amount);
    cj.rem = cj.rem.sub(amount);
    if (di.rem.eq(0)) i++;
    if (cj.rem.eq(0)) j++;
  }
  return transfers;
}

/**
 * Exact settle-up via bitmask DP. Guarantees minimum number of transfers.
 * O(2^n * 2^n / something). Safe up to ~15 players. Falls back to greedy
 * for larger sets.
 */
export function exactSettle(balances: SettleBalance[]): SettleTransfer[] {
  const nonZero = balances.filter((b) => !b.amount.eq(0));
  const n = nonZero.length;
  if (n === 0) return [];
  if (n > 20) return greedySettle(balances);

  const fullMask = (1 << n) - 1;
  const subsetSum: Prisma.Decimal[] = new Array(1 << n).fill(D(0));
  for (let mask = 1; mask < 1 << n; mask++) {
    const lsb = mask & -mask;
    const idx = Math.log2(lsb);
    subsetSum[mask] = subsetSum[mask ^ lsb]!.add(nonZero[idx]!.amount);
  }

  const maxZeroGroups: number[] = new Array(1 << n).fill(0);
  for (let mask = 1; mask < 1 << n; mask++) {
    let sub = mask;
    while (sub > 0) {
      if (subsetSum[sub]!.eq(0)) {
        const rest = mask ^ sub;
        const candidate = maxZeroGroups[rest]! + 1;
        if (candidate > maxZeroGroups[mask]!) {
          maxZeroGroups[mask] = candidate;
        }
      }
      sub = (sub - 1) & mask;
    }
  }

  const transfers: SettleTransfer[] = [];
  const reconstruct = (mask: number): void => {
    if (mask === 0) return;
    const target = maxZeroGroups[mask]!;
    let sub = mask;
    while (sub > 0) {
      if (
        subsetSum[sub]!.eq(0) &&
        maxZeroGroups[mask ^ sub] === target - 1
      ) {
        const group: SettleBalance[] = [];
        for (let i = 0; i < n; i++) {
          if (sub & (1 << i)) group.push(nonZero[i]!);
        }
        transfers.push(...greedySettle(group));
        reconstruct(mask ^ sub);
        return;
      }
      sub = (sub - 1) & mask;
    }
  };
  reconstruct(fullMask);
  return transfers;
}

/** Pick algorithm by player count: exact for ≤15, greedy otherwise. */
export function settle(balances: SettleBalance[]): SettleTransfer[] {
  return balances.length <= 15
    ? exactSettle(balances)
    : greedySettle(balances);
}
