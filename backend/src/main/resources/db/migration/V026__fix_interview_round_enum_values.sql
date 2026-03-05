-- Fix invalid interview round enum values seeded by V021.
-- The InterviewRound Java enum uses FIRST_ROUND / SECOND_ROUND,
-- but the seed data inserted FIRST / SECOND which causes deserialization errors.

UPDATE interviews SET round = 'FIRST_ROUND'  WHERE round = 'FIRST';
UPDATE interviews SET round = 'SECOND_ROUND' WHERE round = 'SECOND';
