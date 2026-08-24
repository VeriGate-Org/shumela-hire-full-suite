package com.arthmatic.shumelahire.approval;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Everything awaiting approval, plus an honest account of which sources answered.
 *
 * <p>The result carries {@link #getUnavailableSources()} because this aggregate reads five
 * independent subsystems and any one of them can fail. If a failed source were silently omitted,
 * an outage in the offers service would render as "no offers awaiting you" — which is the same
 * class of defect as the recruiter dashboard reporting zeros when analytics is unreachable. A
 * caller must be able to tell "nothing is pending" from "we could not find out".
 */
public class PendingApprovalsResult {

    private List<PendingApproval> items = new ArrayList<>();

    /** Sources that threw, by name, with the reason. Empty when everything answered. */
    private Map<String, String> unavailableSources = new LinkedHashMap<>();

    public List<PendingApproval> getItems() { return items; }
    public void setItems(List<PendingApproval> items) {
        this.items = items == null ? new ArrayList<>() : items;
    }

    public Map<String, String> getUnavailableSources() { return unavailableSources; }
    public void setUnavailableSources(Map<String, String> unavailableSources) {
        this.unavailableSources = unavailableSources == null ? new LinkedHashMap<>() : unavailableSources;
    }

    /** True when at least one source failed, so counts below are a floor rather than a total. */
    public boolean isPartial() {
        return !unavailableSources.isEmpty();
    }

    public int getTotal() {
        return items.size();
    }

    /** How many are confirmed as this user's, as opposed to pending somebody. */
    public long getAssignedToYou() {
        return items.stream()
                .filter(i -> i.getAssignment() == PendingApproval.Assignment.YOURS)
                .count();
    }

    /** Counts by kind, so a caller does not have to group the list itself. */
    public Map<String, Integer> getCountsByKind() {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (PendingApproval item : items) {
            if (item.getKind() != null) {
                counts.merge(item.getKind().name(), 1, Integer::sum);
            }
        }
        return counts;
    }

    /**
     * Total rand value held up.
     *
     * <p>Sums {@link PendingApproval#getStakeAmount()} only. Leave carries days rather than money
     * and contributes nothing here by design — ten days is not an amount, and adding it would
     * produce a number that looks like currency and is not.
     *
     * <p>Returns null when nothing in the list carries an amount, rather than zero: no monetary
     * commitments pending and a total of zero rands are different statements.
     */
    public BigDecimal getValueHeldUp() {
        BigDecimal total = null;
        for (PendingApproval item : items) {
            if (item.getStakeAmount() != null) {
                total = total == null ? item.getStakeAmount() : total.add(item.getStakeAmount());
            }
        }
        return total;
    }
}
