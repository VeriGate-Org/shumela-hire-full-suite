package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.integration.SsoConfiguration;
import com.arthmatic.shumelahire.entity.integration.SsoProvider;

import java.util.List;
import java.util.Optional;

public interface SsoConfigurationDataRepository {
    Optional<SsoConfiguration> findById(String id);
    SsoConfiguration save(SsoConfiguration entity);
    List<SsoConfiguration> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<SsoConfiguration> findByIsEnabledTrue();
    List<SsoConfiguration> findByProvider(SsoProvider provider);
}
