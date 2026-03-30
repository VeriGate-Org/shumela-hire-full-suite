package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.WorkflowDefinition;
import com.arthmatic.shumelahire.repository.WorkflowDefinitionDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class WorkflowService {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowService.class);

    private final WorkflowDefinitionDataRepository workflowDefinitionRepository;

    public WorkflowService(WorkflowDefinitionDataRepository workflowDefinitionRepository) {
        this.workflowDefinitionRepository = workflowDefinitionRepository;
    }

    @Transactional(readOnly = true)
    public List<WorkflowDefinition> getAllWorkflows() {
        return workflowDefinitionRepository.findAllByOrderByUpdatedAtDesc();
    }

    @Transactional(readOnly = true)
    public WorkflowDefinition getWorkflowById(Long id) {
        return workflowDefinitionRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + id));
    }

    public WorkflowDefinition createWorkflow(WorkflowDefinition workflow) {
        logger.info("Creating workflow: {}", workflow.getName());
        workflow.setCreatedAt(LocalDateTime.now());
        workflow.setUpdatedAt(LocalDateTime.now());
        WorkflowDefinition saved = workflowDefinitionRepository.save(workflow);
        logger.info("Workflow created with ID: {}", saved.getId());
        return saved;
    }

    public WorkflowDefinition updateWorkflow(Long id, WorkflowDefinition updated) {
        logger.info("Updating workflow: {}", id);
        WorkflowDefinition existing = getWorkflowById(id);

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setCategory(updated.getCategory());
        existing.setTriggerType(updated.getTriggerType());
        existing.setTriggerConfig(updated.getTriggerConfig());
        existing.setStepsJson(updated.getStepsJson());

        WorkflowDefinition saved = workflowDefinitionRepository.save(existing);
        logger.info("Workflow {} updated", id);
        return saved;
    }

    public void deleteWorkflow(Long id) {
        logger.info("Deleting workflow: {}", id);
        WorkflowDefinition workflow = getWorkflowById(id);
        workflowDefinitionRepository.delete(workflow);
        logger.info("Workflow {} deleted", id);
    }

    public WorkflowDefinition duplicateWorkflow(Long id) {
        logger.info("Duplicating workflow: {}", id);
        WorkflowDefinition original = getWorkflowById(id);

        WorkflowDefinition copy = new WorkflowDefinition();
        copy.setName(original.getName() + " (Copy)");
        copy.setDescription(original.getDescription());
        copy.setCategory(original.getCategory());
        copy.setActive(false);
        copy.setTriggerType(original.getTriggerType());
        copy.setTriggerConfig(original.getTriggerConfig());
        copy.setStepsJson(original.getStepsJson());
        copy.setCreatedBy(original.getCreatedBy());
        copy.setCreatedAt(LocalDateTime.now());
        copy.setUpdatedAt(LocalDateTime.now());

        WorkflowDefinition saved = workflowDefinitionRepository.save(copy);
        logger.info("Workflow {} duplicated as {}", id, saved.getId());
        return saved;
    }

    public WorkflowDefinition toggleWorkflow(Long id, boolean isActive) {
        logger.info("Toggling workflow {} to active={}", id, isActive);
        WorkflowDefinition workflow = getWorkflowById(id);
        workflow.setActive(isActive);
        return workflowDefinitionRepository.save(workflow);
    }
}
