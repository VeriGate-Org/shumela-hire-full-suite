package com.arthmatic.shumelahire.lambda;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

/**
 * Hands the running application context to the Lambda entry point.
 *
 * <p>{@link ApiLambdaHandler} is instantiated by the Lambda runtime, not by Spring, so it cannot
 * be injected. For an HTTP request that does not matter — the container handler dispatches through
 * the servlet stack — but a scheduled invocation has to reach a bean directly, and needs a way in.
 *
 * <p>The alternative was to read the context off {@code SpringBootLambdaContainerHandler}, which
 * does not expose it: version 2.1.5 has no {@code getApplicationContext()}. This does not depend on
 * that library's shape at all.
 */
@Component
public class SpringContextHolder implements ApplicationContextAware {

    private static volatile ApplicationContext context;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        context = applicationContext;
    }

    /**
     * The application context, once Spring has started.
     *
     * @throws IllegalStateException if called before startup — loudly, because a scheduled job
     *         silently doing nothing is the failure this whole change exists to remove.
     */
    public static ApplicationContext get() {
        ApplicationContext current = context;
        if (current == null) {
            throw new IllegalStateException(
                    "Spring has not started yet — no application context to dispatch a scheduled job to");
        }
        return current;
    }

    /** Visible for tests, which must not leak a context into one another. */
    static void reset() {
        context = null;
    }
}
