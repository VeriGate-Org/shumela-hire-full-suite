package com.arthmatic.shumelahire.repository.integration;

import com.arthmatic.shumelahire.entity.integration.SsoConfiguration;
import com.arthmatic.shumelahire.entity.integration.SsoProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SsoConfigurationRepository extends JpaRepository<SsoConfiguration, Long> {

    List<SsoConfiguration> findByIsEnabledTrue();

    List<SsoConfiguration> findByProvider(SsoProvider provider);
}
