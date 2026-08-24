package com.arthmatic.shumelahire.validation;

import com.arthmatic.shumelahire.entity.ApplicationSource;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ApplicationSourceValidator
        implements ConstraintValidator<ValidApplicationSource, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Null is not this constraint's business — pair with @NotNull when the
        // field is required. A blank string is a client sending an empty form
        // field and is treated as absent for the same reason.
        if (value == null || value.isBlank()) {
            return true;
        }

        if (ApplicationSource.from(value).isPresent()) {
            return true;
        }

        // Name what was accepted. The old regex reported only "Invalid
        // application source", which gave a caller sending PNET no way to tell
        // that the value was legitimate and the validation was not.
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(
                "Invalid application source '" + value + "'. Expected one of: "
                        + String.join(", ", ApplicationSource.names().stream().sorted().toList()))
                .addConstraintViolation();
        return false;
    }
}
