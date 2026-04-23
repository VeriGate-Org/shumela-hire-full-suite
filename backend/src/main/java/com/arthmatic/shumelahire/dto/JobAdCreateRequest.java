package com.arthmatic.shumelahire.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class JobAdCreateRequest {
    
    private String requisitionId;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "HTML body is required")
    private String htmlBody;
    
    @NotNull(message = "Internal channel flag is required")
    private Boolean channelInternal;
    
    @NotNull(message = "External channel flag is required")
    private Boolean channelExternal;
    
    private LocalDate closingDate;
    
    private String slug;
    
    @NotBlank(message = "Created by is required")
    private String createdBy;
    
    // Flag to indicate if this should be published immediately
    private Boolean publishImmediately = false;
    
    // Constructors
    public JobAdCreateRequest() {}
    
    // Getters and Setters
    public String getRequisitionId() {
        return requisitionId;
    }
    
    public void setRequisitionId(String requisitionId) {
        this.requisitionId = requisitionId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getHtmlBody() {
        return htmlBody;
    }
    
    public void setHtmlBody(String htmlBody) {
        this.htmlBody = htmlBody;
    }
    
    public Boolean getChannelInternal() {
        return channelInternal;
    }
    
    public void setChannelInternal(Boolean channelInternal) {
        this.channelInternal = channelInternal;
    }
    
    public Boolean getChannelExternal() {
        return channelExternal;
    }
    
    public void setChannelExternal(Boolean channelExternal) {
        this.channelExternal = channelExternal;
    }
    
    public LocalDate getClosingDate() {
        return closingDate;
    }
    
    public void setClosingDate(LocalDate closingDate) {
        this.closingDate = closingDate;
    }
    
    public String getSlug() {
        return slug;
    }
    
    public void setSlug(String slug) {
        this.slug = slug;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public Boolean getPublishImmediately() {
        return publishImmediately;
    }
    
    public void setPublishImmediately(Boolean publishImmediately) {
        this.publishImmediately = publishImmediately;
    }
}