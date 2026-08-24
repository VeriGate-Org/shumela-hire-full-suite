package com.arthmatic.shumelahire.service.jobboard;

import com.arthmatic.shumelahire.entity.JobBoardType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class JobBoardConnectorRegistry {

    private final Map<JobBoardType, JobBoardConnector> connectors;

    @Autowired
    public JobBoardConnectorRegistry(List<JobBoardConnector> connectorBeans) {
        // Two connectors can claim the same board — a live one whose API key is
        // absent, and a sandbox one for the same board. Keeping whichever
        // happened to be constructed first made the winner depend on bean
        // ordering; prefer the one that reports itself enabled.
        this.connectors = connectorBeans.stream()
            .collect(Collectors.toMap(
                JobBoardConnector::getSupportedType,
                c -> c,
                (a, b) -> a.isEnabled() ? a : b));
    }

    public JobBoardConnector getConnector(JobBoardType type) {
        JobBoardConnector connector = connectors.get(type);
        if (connector != null && connector.isEnabled()) {
            return connector;
        }
        return null;
    }

    public boolean hasEnabledConnector(JobBoardType type) {
        JobBoardConnector connector = connectors.get(type);
        return connector != null && connector.isEnabled();
    }

    public List<Map<String, Object>> getAvailableBoards() {
        List<Map<String, Object>> boards = new ArrayList<>();
        for (JobBoardType type : JobBoardType.values()) {
            Map<String, Object> board = new LinkedHashMap<>();
            board.put("type", type.name());
            board.put("displayName", type.getDisplayName());
            board.put("requiresApiIntegration", type.isRequiresApiIntegration());

            JobBoardConnector connector = connectors.get(type);
            if (connector != null && connector.isEnabled()) {
                board.put("status", "connected");
                board.put("apiEnabled", true);
            } else if (connector != null) {
                board.put("status", "disconnected");
                board.put("apiEnabled", false);
            } else {
                board.put("status", type == JobBoardType.CUSTOM ? "available" : "disconnected");
                board.put("apiEnabled", false);
            }

            boards.add(board);
        }
        return boards;
    }
}
