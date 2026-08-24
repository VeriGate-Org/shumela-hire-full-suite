package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.repository.EmployeeDocumentDataRepository;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Exactly one {@link ESignatureService} must be wired, whatever the configuration.
 * <p>
 * DocuSignService previously carried {@code matchIfMissing = true}, so any provider
 * value other than "docusign" left no implementation at all and the application
 * context failed on the controller's required dependency.
 */
class ESignatureProviderSelectionTest {

    // Registered as component classes, not @Bean methods, so the class-level
    // @ConditionalOnProperty on each implementation is actually evaluated.
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
        .withUserConfiguration(StubDependencies.class, LocalESignatureService.class, DocuSignService.class);

    @Test
    void defaultsToTheSimulatedProvider() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context.getBeansOfType(ESignatureService.class)).hasSize(1);
            assertThat(context).hasSingleBean(LocalESignatureService.class);
            assertThat(context).doesNotHaveBean(DocuSignService.class);
        });
    }

    @Test
    void localProviderSelectsTheSimulatedImplementation() {
        runner.withPropertyValues("esignature.provider=local").run(context -> {
            assertThat(context).hasSingleBean(LocalESignatureService.class);
            assertThat(context).doesNotHaveBean(DocuSignService.class);
        });
    }

    @Test
    void docusignProviderSelectsTheRealImplementation() {
        runner.withPropertyValues(
            "esignature.provider=docusign",
            "docusign.base-url=https://demo.docusign.net/restapi",
            "docusign.account-id=acct",
            "docusign.integration-key=key",
            "docusign.secret-key=secret",
            "docusign.user-id=user"
        ).run(context -> {
            assertThat(context.getBeansOfType(ESignatureService.class)).hasSize(1);
            assertThat(context).hasSingleBean(DocuSignService.class);
            assertThat(context).doesNotHaveBean(LocalESignatureService.class);
        });
    }

    @Configuration(proxyBeanMethods = false)
    static class StubDependencies {
        @Bean
        OfferDataRepository offerDataRepository() {
            return mock(OfferDataRepository.class);
        }

        @Bean
        EmployeeDocumentDataRepository employeeDocumentDataRepository() {
            return mock(EmployeeDocumentDataRepository.class);
        }

        @Bean
        FileStorageService fileStorageService() {
            return mock(FileStorageService.class);
        }

        // FileStorageService field-injects this even when the bean itself is a mock.
        @Bean
        StorageService storageService() {
            return mock(StorageService.class);
        }

        @Bean
        ESignatureEventApplier eSignatureEventApplier() {
            return new ESignatureEventApplier();
        }
    }
}
