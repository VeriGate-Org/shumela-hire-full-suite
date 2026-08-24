package com.arthmatic.shumelahire.entity;

public enum PipelineStage {
    APPLICATION_RECEIVED("Application Received", 1, true, false),
    INITIAL_SCREENING("Initial Screening", 2, true, false),
    PHONE_SCREENING("Phone Screening", 3, true, false),
    FIRST_INTERVIEW("First Interview", 4, true, false),
    TECHNICAL_ASSESSMENT("Technical Assessment", 5, true, false),
    SECOND_INTERVIEW("Second Interview", 6, true, false),
    PANEL_INTERVIEW("Panel Interview", 7, true, false),
    MANAGER_INTERVIEW("Manager Interview", 8, true, false),
    FINAL_INTERVIEW("Final Interview", 9, true, false),
    REFERENCE_CHECK("Reference Check", 10, true, false),
    BACKGROUND_CHECK("Background Check", 11, true, false),
    OFFER_PREPARATION("Offer Preparation", 12, true, false),
    OFFER_EXTENDED("Offer Extended", 13, true, false),
    OFFER_NEGOTIATION("Offer Negotiation", 14, true, false),
    OFFER_ACCEPTED("Offer Accepted", 15, false, true),
    HIRED("Hired", 16, false, true),
    
    // Terminal stages
    WITHDRAWN("Withdrawn", 90, false, true),
    REJECTED("Rejected", 91, false, true),
    OFFER_DECLINED("Offer Declined", 92, false, true),
    NO_SHOW("No Show", 93, false, true),
    DUPLICATE("Duplicate Application", 94, false, true);

    private final String displayName;
    private final int order;
    private final boolean isActive;
    private final boolean isTerminal;

    PipelineStage(String displayName, int order, boolean isActive, boolean isTerminal) {
        this.displayName = displayName;
        this.order = order;
        this.isActive = isActive;
        this.isTerminal = isTerminal;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getOrder() {
        return order;
    }

    public boolean isActive() {
        return isActive;
    }

    public boolean isTerminal() {
        return isTerminal;
    }

    public boolean isSuccessful() {
        return this == OFFER_ACCEPTED || this == HIRED;
    }

    public boolean isRejected() {
        return this == REJECTED || this == OFFER_DECLINED || this == NO_SHOW || this == DUPLICATE;
    }

    public boolean isWithdrawn() {
        return this == WITHDRAWN;
    }

    /**
     * Whether moving from {@code currentStage} to {@code targetStage} is the move the verification
     * gate guards: leaving the checks stages for a later stage of the pipeline.
     *
     * <p>Two corrections to what this used to ask, and it lives here so the single-candidate path
     * and the bulk path cannot answer it differently.</p>
     *
     * <p><b>It covers Reference Check as well as Background Check.</b> The pipeline board treats
     * both as one "Checks" column and greys out the move button across the whole column, but the
     * rule only ever fired on the second of them — so a candidate sitting at Reference Check could
     * be sent to Offer Preparation with every check outstanding, by bulk action or by calling the
     * API directly, while the screen said they were blocked. The screen was right about the intent;
     * the server was not enforcing it.</p>
     *
     * <p><b>It never blocks a move that CLOSES an application unsuccessfully.</b> Rejected and
     * Withdrawn sort above every active stage by order, so the old comparison caught them too: a
     * candidate whose criminal check came back ADVERSE could not be rejected, because rejecting them
     * counted as progressing past a check that had not come back clear. That is exactly backwards —
     * an adverse result is the reason you are rejecting. The gate exists to stop someone being hired
     * without verification, never to trap them in the pipeline.</p>
     *
     * <p>Note that the exemption turns on {@link #isSuccessful()}, not on {@link #isTerminal()}.
     * {@code HIRED} and {@code OFFER_ACCEPTED} are terminal as well, and they are the precise
     * outcomes this gate exists to prevent without verification — exempting everything terminal
     * would have left the hole open at the only place it matters.</p>
     */
    public static boolean requiresCompletedChecks(PipelineStage currentStage, PipelineStage targetStage) {
        if (currentStage == null || targetStage == null) {
            return false;
        }
        if (targetStage.isTerminal && !targetStage.isSuccessful()) {
            return false;
        }
        boolean leavingChecks = currentStage == REFERENCE_CHECK || currentStage == BACKGROUND_CHECK;
        return leavingChecks && targetStage.order > BACKGROUND_CHECK.order;
    }

    public boolean canProgressTo(PipelineStage nextStage) {
        // Cannot move backwards (except for special cases)
        if (nextStage.order < this.order && !isSpecialTransition(this, nextStage)) {
            return false;
        }
        
        // Cannot move from terminal stages
        if (this.isTerminal) {
            return false;
        }
        
        // Can always move to terminal stages (except from other terminals)
        if (nextStage.isTerminal) {
            return true;
        }
        
        // Normal progression rules
        return nextStage.order <= this.order + 3; // Allow skipping up to 2 stages
    }

    private boolean isSpecialTransition(PipelineStage from, PipelineStage to) {
        // Allow moving back from certain stages for re-evaluation
        if (from == REFERENCE_CHECK || from == BACKGROUND_CHECK) {
            return to.order >= PHONE_SCREENING.order && to.order < from.order;
        }
        
        // Allow moving from offer stages back to final interview
        if (from == OFFER_PREPARATION || from == OFFER_EXTENDED || from == OFFER_NEGOTIATION) {
            return to == FINAL_INTERVIEW || to == MANAGER_INTERVIEW;
        }
        
        return false;
    }

    public PipelineStage getNextStage() {
        switch (this) {
            case APPLICATION_RECEIVED: return INITIAL_SCREENING;
            case INITIAL_SCREENING: return PHONE_SCREENING;
            case PHONE_SCREENING: return FIRST_INTERVIEW;
            case FIRST_INTERVIEW: return TECHNICAL_ASSESSMENT;
            case TECHNICAL_ASSESSMENT: return SECOND_INTERVIEW;
            case SECOND_INTERVIEW: return PANEL_INTERVIEW;
            case PANEL_INTERVIEW: return MANAGER_INTERVIEW;
            case MANAGER_INTERVIEW: return FINAL_INTERVIEW;
            case FINAL_INTERVIEW: return REFERENCE_CHECK;
            case REFERENCE_CHECK: return BACKGROUND_CHECK;
            case BACKGROUND_CHECK: return OFFER_PREPARATION;
            case OFFER_PREPARATION: return OFFER_EXTENDED;
            case OFFER_EXTENDED: return OFFER_NEGOTIATION;
            case OFFER_NEGOTIATION: return OFFER_ACCEPTED;
            case OFFER_ACCEPTED: return HIRED;
            default: return null;
        }
    }

    public PipelineStage getPreviousStage() {
        switch (this) {
            case INITIAL_SCREENING: return APPLICATION_RECEIVED;
            case PHONE_SCREENING: return INITIAL_SCREENING;
            case FIRST_INTERVIEW: return PHONE_SCREENING;
            case TECHNICAL_ASSESSMENT: return FIRST_INTERVIEW;
            case SECOND_INTERVIEW: return TECHNICAL_ASSESSMENT;
            case PANEL_INTERVIEW: return SECOND_INTERVIEW;
            case MANAGER_INTERVIEW: return PANEL_INTERVIEW;
            case FINAL_INTERVIEW: return MANAGER_INTERVIEW;
            case REFERENCE_CHECK: return FINAL_INTERVIEW;
            case BACKGROUND_CHECK: return REFERENCE_CHECK;
            case OFFER_PREPARATION: return BACKGROUND_CHECK;
            case OFFER_EXTENDED: return OFFER_PREPARATION;
            case OFFER_NEGOTIATION: return OFFER_EXTENDED;
            case OFFER_ACCEPTED: return OFFER_NEGOTIATION;
            case HIRED: return OFFER_ACCEPTED;
            default: return null;
        }
    }

    public static PipelineStage[] getActiveStages() {
        return java.util.Arrays.stream(values())
                .filter(PipelineStage::isActive)
                .toArray(PipelineStage[]::new);
    }

    public static PipelineStage[] getTerminalStages() {
        return java.util.Arrays.stream(values())
                .filter(PipelineStage::isTerminal)
                .toArray(PipelineStage[]::new);
    }

    public static PipelineStage[] getOrderedStages() {
        return java.util.Arrays.stream(values())
                .sorted((a, b) -> Integer.compare(a.order, b.order))
                .toArray(PipelineStage[]::new);
    }

    public String getCssClass() {
        if (isSuccessful()) {
            return "bg-green-100 text-green-800 border-green-200";
        } else if (isRejected()) {
            return "bg-red-100 text-red-800 border-red-200";
        } else if (isWithdrawn()) {
            return "bg-gray-100 text-gray-800 border-gray-200";
        } else if (isTerminal()) {
            return "bg-purple-100 text-purple-800 border-purple-200";
        } else {
            return "bg-blue-100 text-blue-800 border-blue-200";
        }
    }

    public String getStatusIcon() {
        if (isSuccessful()) {
            return "✅";
        } else if (isRejected()) {
            return "❌";
        } else if (isWithdrawn()) {
            return "↩️";
        } else if (isTerminal()) {
            return "⏹️";
        } else {
            return "⏳";
        }
    }

    public double getProgressPercentage() {
        if (isTerminal()) {
            return isSuccessful() ? 100.0 : 0.0;
        }
        
        // Calculate progress based on order (excluding terminal stages)
        int maxActiveOrder = java.util.Arrays.stream(getActiveStages())
                .mapToInt(PipelineStage::getOrder)
                .max()
                .orElse(16);
        
        return (double) this.order / maxActiveOrder * 100.0;
    }
}