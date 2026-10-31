import { describe, expect, it, vi } from "vitest";

import { createUpdateOffer } from "./updateOffer";

describe("update offer", () => {
  it.each(["defer", "accept"] as const)(
    "%s closes once and waits for eligibility reentry",
    (action) => {
      const accept = vi.fn();
      const shown: boolean[] = [];
      const offer = createUpdateOffer(accept);
      offer.eligibility(true);
      offer.subscribe((value) => shown.push(value));
      offer[action]();
      offer[action]();
      offer.eligibility(true);
      expect(shown).toEqual([true, false]);
      expect(accept).toHaveBeenCalledTimes(action === "accept" ? 1 : 0);
      offer.eligibility(false);
      offer.eligibility(true);
      expect(shown).toEqual([true, false, true]);
    },
  );
  it("never accepts an unavailable or dismissed offer", () => {
    const accept = vi.fn();
    const offer = createUpdateOffer(accept);
    offer.accept();
    offer.eligibility(true);
    offer.defer();
    offer.accept();
    expect(accept).not.toHaveBeenCalled();
  });
});
