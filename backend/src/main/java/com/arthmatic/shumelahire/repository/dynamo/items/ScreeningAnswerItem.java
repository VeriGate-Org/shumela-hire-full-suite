package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the ScreeningAnswer entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  SCREENING_ANSWER#{id}
 *
 * GSI2 (application FK lookup, sorted by question ID):
 *   GSI2PK: SA_APP#{applicationId}
 *   GSI2SK: SCREENING_ANSWER#{screeningQuestionId}
 *
 * GSI4 (unique constraint -- application + question):
 *   GSI4PK: SA_APPQ#{tenantId}#{applicationId}#{screeningQuestionId}
 *   GSI4SK: SCREENING_ANSWER#{id}
 */
@DynamoDbBean
public class ScreeningAnswerItem {

    private String pk;
    private String sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi4pk;
    private String gsi4sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String applicationId;
    private String screeningQuestionId;
    private String answerValue;
    private String answerFileUrl;
    private String answerFileName;
    private Boolean isValid;
    private String validationMessage;
    private String answeredAt;

    // -- Table keys -----------------------------------------------------------

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // -- GSI2: Application FK lookup ------------------------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // -- GSI4: Unique constraint on application + question --------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4PK")
    public String getGsi4pk() { return gsi4pk; }
    public void setGsi4pk(String gsi4pk) { this.gsi4pk = gsi4pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4SK")
    public String getGsi4sk() { return gsi4sk; }
    public void setGsi4sk(String gsi4sk) { this.gsi4sk = gsi4sk; }

    // -- Entity fields --------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getScreeningQuestionId() { return screeningQuestionId; }
    public void setScreeningQuestionId(String screeningQuestionId) { this.screeningQuestionId = screeningQuestionId; }

    public String getAnswerValue() { return answerValue; }
    public void setAnswerValue(String answerValue) { this.answerValue = answerValue; }

    public String getAnswerFileUrl() { return answerFileUrl; }
    public void setAnswerFileUrl(String answerFileUrl) { this.answerFileUrl = answerFileUrl; }

    public String getAnswerFileName() { return answerFileName; }
    public void setAnswerFileName(String answerFileName) { this.answerFileName = answerFileName; }

    public Boolean getIsValid() { return isValid; }
    public void setIsValid(Boolean isValid) { this.isValid = isValid; }

    public String getValidationMessage() { return validationMessage; }
    public void setValidationMessage(String validationMessage) { this.validationMessage = validationMessage; }

    public String getAnsweredAt() { return answeredAt; }
    public void setAnsweredAt(String answeredAt) { this.answeredAt = answeredAt; }
}
