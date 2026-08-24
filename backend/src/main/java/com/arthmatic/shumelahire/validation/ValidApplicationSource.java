package com.arthmatic.shumelahire.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * The annotated value must name a
 * {@link com.arthmatic.shumelahire.entity.ApplicationSource}.
 *
 * Exists so the accepted set is read from the enum rather than repeated in a
 * regex beside it. The regex this replaces admitted five of the enum's values
 * and rejected the rest, which meant an application genuinely sourced from
 * PNet, LinkedIn or CareerJunction could not be created through the API —
 * on a product whose whole point is publishing to those boards.
 *
 * Null passes; use {@code @NotNull} alongside if the field is required.
 */
@Documented
@Constraint(validatedBy = ApplicationSourceValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidApplicationSource {

    String message() default "Invalid application source";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
