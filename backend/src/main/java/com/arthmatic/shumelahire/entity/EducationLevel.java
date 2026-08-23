package com.arthmatic.shumelahire.entity;

/**
 * Minimum formal qualification a vacancy requires, ordered so two levels can be compared.
 *
 * <p>The {@code rank} is what makes this useful for shortlisting: a candidate holding an Honours
 * degree satisfies a role asking for a Bachelor's, and {@code rank} is how that is expressed
 * without hard-coding a comparison table. South African NQF levels are noted against each so the
 * ordering is defensible rather than a matter of taste — this is the ladder an evaluator would
 * recognise.</p>
 *
 * <p>Deliberately coarse. A vacancy asking for "BSc/BEng or BCom Honours" is asking for a degree,
 * and finer granularity than that invites arguments the platform cannot settle.</p>
 */
public enum EducationLevel {

    NONE("No formal requirement", 0, null),
    MATRIC("Matric / National Senior Certificate", 1, "NQF 4"),
    CERTIFICATE("Higher Certificate", 2, "NQF 5"),
    DIPLOMA("Diploma / Advanced Certificate", 3, "NQF 6"),
    BACHELORS("Bachelor's Degree", 4, "NQF 7"),
    HONOURS("Honours / Postgraduate Diploma", 5, "NQF 8"),
    MASTERS("Master's Degree", 6, "NQF 9"),
    DOCTORATE("Doctorate", 7, "NQF 10");

    private final String displayName;
    private final int rank;
    private final String nqfLevel;

    EducationLevel(String displayName, int rank, String nqfLevel) {
        this.displayName = displayName;
        this.rank = rank;
        this.nqfLevel = nqfLevel;
    }

    public String getDisplayName() {
        return displayName;
    }

    /** Higher means more advanced. Compare with {@link #satisfies(EducationLevel)}. */
    public int getRank() {
        return rank;
    }

    /** South African NQF level, or {@code null} where no requirement is expressed. */
    public String getNqfLevel() {
        return nqfLevel;
    }

    /**
     * Whether holding this level meets a role asking for {@code required}.
     *
     * <p>A null requirement is satisfied by anything — a vacancy that names no qualification must
     * not silently penalise candidates.</p>
     */
    public boolean satisfies(EducationLevel required) {
        return required == null || this.rank >= required.rank;
    }
}
