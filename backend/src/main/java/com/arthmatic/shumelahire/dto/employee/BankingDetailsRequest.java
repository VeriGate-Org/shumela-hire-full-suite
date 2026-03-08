package com.arthmatic.shumelahire.dto.employee;

public class BankingDetailsRequest {

    private String bankName;
    private String bankBranchCode;
    private String bankAccountNumber;

    public BankingDetailsRequest() {}

    // Getters and Setters
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getBankBranchCode() { return bankBranchCode; }
    public void setBankBranchCode(String bankBranchCode) { this.bankBranchCode = bankBranchCode; }

    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }
}
