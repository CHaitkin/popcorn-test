// Allocation engine. Pure functions over the data in data.ts.
//
// Algorithm:
// For each SKU, walk containers in (effective) ETA order. For each container,
// allocate yardage by tier — top-8 → key → smaller. Within a tier, prefer the
// earliest promised ETA. The "don't half-fill if a future container can
// complete it on time" rule applies: if this container can only partially fill
// an order, and a future container before that order's promise can fully
// complete it, skip and let smaller tiers / later orders take this yardage.
//
// After walking, any order whose total allocation by its promised ETA is
// less than its qty is a shortfall — surfaced for Janet's judgment.

import {
  CONTAINERS,
  Container,
  CUSTOMERS,
  ORDERS,
  Order,
  Tier,
  customerById,
  tierRank,
} from "./data";

export type Allocation = {
  orderId: string;
  customerId: string;
  sku: string;
  containerId: string;
  yards: number;
  // True if this allocation arrives after the customer's promised ETA.
  late: boolean;
};

export type OrderState = {
  order: Order;
  customerName: string;
  tier: Tier;
  allocations: Allocation[];
  totalAllocated: number;
  allocatedByPromise: number; // sum of allocations from containers with eta <= promisedEta
  shortfall: number; // qty - allocatedByPromise
  isShortfall: boolean;
};

export type ContainerSkuBreakdown = {
  sku: string;
  itemName: string;
  yardsIn: number;
  allocations: Allocation[];
  yardsAllocated: number;
  yardsUnallocated: number;
};

export type ContainerState = {
  container: Container;
  perSku: ContainerSkuBreakdown[];
  hasShortfall: boolean;
};

export type AllocationResult = {
  orderStates: OrderState[];
  containerStates: ContainerState[];
  allocations: Allocation[];
};

function effectiveEta(c: Container): string {
  return c.eta;
}

// Sort orders for tier-based allocation: tier ascending, then promised ETA
// ascending (earliest promise first), then a stable id tiebreak.
function orderSortKey(o: Order): [number, string, string] {
  const tier = customerById(o.customerId).tier;
  return [tierRank(tier), o.promisedEta, o.id + o.customerId + o.sku];
}

export function runAllocation(): AllocationResult {
  // Track remaining qty per (orderId, customerId, sku) — orders with same id
  // can repeat across SKUs in the spec data, so we key on the triple.
  const orderKey = (o: Order) => `${o.id}|${o.customerId}|${o.sku}`;

  const remaining = new Map<string, number>();
  const allocsByOrder = new Map<string, Allocation[]>();
  for (const o of ORDERS) {
    remaining.set(orderKey(o), o.qty);
    allocsByOrder.set(orderKey(o), []);
  }

  // Group SKUs across containers
  const allSkus = new Set<string>();
  for (const c of CONTAINERS) for (const l of c.lines) allSkus.add(l.sku);

  // Container yardage remaining per (containerId, sku)
  const containerSkuRemaining = new Map<string, number>();
  for (const c of CONTAINERS) {
    for (const l of c.lines) {
      containerSkuRemaining.set(`${c.id}|${l.sku}`, l.yards);
    }
  }

  // For each SKU, walk containers in ETA order, allocate by tier+promise.
  for (const sku of allSkus) {
    const skuContainers = CONTAINERS
      .filter((c) => c.lines.some((l) => l.sku === sku))
      .sort((a, b) => effectiveEta(a).localeCompare(effectiveEta(b)));

    const skuOrders = ORDERS
      .filter((o) => o.sku === sku)
      .sort((a, b) => {
        const [ar, ap, aid] = orderSortKey(a);
        const [br, bp, bid] = orderSortKey(b);
        if (ar !== br) return ar - br;
        if (ap !== bp) return ap.localeCompare(bp);
        return aid.localeCompare(bid);
      });

    for (const c of skuContainers) {
      let avail = containerSkuRemaining.get(`${c.id}|${sku}`) ?? 0;
      if (avail <= 0) continue;

      // Pass 1: try to fully complete orders, in tier+promise order.
      // Pass 2: partial fills if no future container can save them.
      // We do this in a single loop with the "skip if future completes on time" rule.
      for (const o of skuOrders) {
        if (avail <= 0) break;
        const k = orderKey(o);
        const need = remaining.get(k) ?? 0;
        if (need <= 0) continue;

        if (avail >= need) {
          // Full allocation. Allocate.
          const allocs = allocsByOrder.get(k)!;
          allocs.push({
            orderId: o.id,
            customerId: o.customerId,
            sku,
            containerId: c.id,
            yards: need,
            late: effectiveEta(c) > o.promisedEta,
          });
          remaining.set(k, 0);
          avail -= need;
        } else {
          // Partial — apply the "don't half-fill if future saves us" rule.
          const futureSupply = skuContainers
            .filter(
              (fc) =>
                effectiveEta(fc) > effectiveEta(c) &&
                effectiveEta(fc) <= o.promisedEta,
            )
            .reduce(
              (sum, fc) =>
                sum + (containerSkuRemaining.get(`${fc.id}|${sku}`) ?? 0),
              0,
            );

          if (futureSupply >= need) {
            // Skip — defer to a future container that can complete on time.
            continue;
          }

          // Take what's available; the rest will be allocated later (late) or
          // surface as a shortfall.
          const allocs = allocsByOrder.get(k)!;
          allocs.push({
            orderId: o.id,
            customerId: o.customerId,
            sku,
            containerId: c.id,
            yards: avail,
            late: effectiveEta(c) > o.promisedEta,
          });
          remaining.set(k, need - avail);
          avail = 0;
        }
      }

      containerSkuRemaining.set(`${c.id}|${sku}`, avail);
    }

    // Second sweep: if any orders still have remaining qty (because their
    // promise was already missed and the partial-fill rule deferred them),
    // allocate from any remaining container yardage in ETA order.
    for (const c of skuContainers) {
      let avail = containerSkuRemaining.get(`${c.id}|${sku}`) ?? 0;
      if (avail <= 0) continue;
      for (const o of skuOrders) {
        if (avail <= 0) break;
        const k = orderKey(o);
        const need = remaining.get(k) ?? 0;
        if (need <= 0) continue;
        const give = Math.min(avail, need);
        allocsByOrder.get(k)!.push({
          orderId: o.id,
          customerId: o.customerId,
          sku,
          containerId: c.id,
          yards: give,
          late: effectiveEta(c) > o.promisedEta,
        });
        remaining.set(k, need - give);
        avail -= give;
      }
      containerSkuRemaining.set(`${c.id}|${sku}`, avail);
    }
  }

  // Build OrderState
  const orderStates: OrderState[] = ORDERS.map((o) => {
    const allocs = allocsByOrder.get(`${o.id}|${o.customerId}|${o.sku}`)!;
    const totalAllocated = allocs.reduce((s, a) => s + a.yards, 0);
    const allocatedByPromise = allocs
      .filter((a) => {
        const c = CONTAINERS.find((c) => c.id === a.containerId)!;
        return effectiveEta(c) <= o.promisedEta;
      })
      .reduce((s, a) => s + a.yards, 0);
    const shortfall = Math.max(0, o.qty - allocatedByPromise);
    return {
      order: o,
      customerName: customerById(o.customerId).name,
      tier: customerById(o.customerId).tier,
      allocations: allocs,
      totalAllocated,
      allocatedByPromise,
      shortfall,
      isShortfall: shortfall > 0,
    };
  });

  // Build ContainerState
  const allAllocations = orderStates.flatMap((os) => os.allocations);
  const containerStates: ContainerState[] = CONTAINERS.map((c) => {
    const perSku: ContainerSkuBreakdown[] = c.lines.map((l) => {
      const allocs = allAllocations.filter(
        (a) => a.containerId === c.id && a.sku === l.sku,
      );
      const yardsAllocated = allocs.reduce((s, a) => s + a.yards, 0);
      return {
        sku: l.sku,
        itemName: l.itemName,
        yardsIn: l.yards,
        allocations: allocs,
        yardsAllocated,
        yardsUnallocated: l.yards - yardsAllocated,
      };
    });
    // A container "has shortfall" if any order whose promise <= this container's
    // ETA was only partially served by this container or earlier.
    const hasShortfall = orderStates.some(
      (os) =>
        os.isShortfall &&
        os.allocations.some((a) => a.containerId === c.id),
    );
    return { container: c, perSku, hasShortfall };
  });

  return { orderStates, containerStates, allocations: allAllocations };
}

// Memoize once per process — data is static.
let cached: AllocationResult | null = null;
export function getAllocation(): AllocationResult {
  if (!cached) cached = runAllocation();
  return cached;
}
