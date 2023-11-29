export const NAIRA = "₦";
export const USER_LABEL = "user";
export const OTP_LABEL = "otp";
export const SUPER_ADMIN_LABEL = "super admin";
export const USER_PRIVILEGE_LABEL = "user_privilege";
export const USER_PASSWORD_LABEL = "user_password";
export const LOGIN_SESSION_LABEL = "login_session";
export const OTP_VALIDITY_PERIOD = 5;

export const USER_STATUS = Object.freeze({
    IN_REVIEW: "in review",
    PENDING: 'pending',
    ACTIVE: 'active',
    SELF_DEACTIVATED: 'self_deactivated',
    DELETED: 'deleted',
    SUSPENDED: 'suspended',
    DEACTIVATED: 'deactivated',
    HIDDEN: 'hidden'
})

export const STAFF_CATEGORY = Object.freeze({
    MANAGER: 'Manager',
    SENIOR: 'Senior',
    JUNIOR: 'Junior'
})

export const ITEM_STATUS = Object.freeze({
    OPEN: 'open',
    CREATED: 'created',
    PENDING: 'pending',
    IN_REVIEW: 'in review',
    ACTIVE: 'active',
    DEACTIVATED: 'deactivated',
    DELETED: 'deleted',
    ARCHIVED: 'archived',
    SUSPENDED: 'suspended',
    HIDDEN: 'hidden',
    CLOSED: 'closed',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    USED: 'used',
    SkIPPED: 'skipped',
})

export const MARITAL_STATUS = Object.freeze({
    SINGLE: "single",
    MARRIED: "married",
    DIVORCED: "divorced",
    SEPARATED: "separated",
    WIDOWED: "widowed",
    OTHER: "other",
    NOT_SAY: "I will rather not say"
});

export const GENDER = Object.freeze({
    MALE: "male",
    FEMALE: "female",
    NOT_SAY: "I will rather not say"
});

export const BIT = Object.freeze({
    ON: 1,
    OFF: 0
});

export const DOCUMENT_STATUS = Object.freeze({
    CREATED: "created",
    VALIDATED: "validated",
    REJECTED: "rejected",
    APPROVED: "approved",
    DELETED: "deleted",
    ARCHIVED: "archived",
    IN_REVIEW: "in review"
});

export const COMPLIANCE_LEVEL = Object.freeze({
    ZERO: 0,
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4
});

export const USER_ROLES = Object.freeze({
    ADMIN: "admin",
    SUPER_ADMIN: "super admin",
    STORE_KEEPER: "store keeper",
    CASHIER: "cashier",
    ACCOUNTANT: "accountant",
    ATTENDANT: "attendant"
});

export const PAYMENT_METHOD = Object.freeze({
    CASH: "Cash",
    BANK: "Bank",
    BANK_TRANSFER: "Bank Transfer"
});

export const SEQUENCE_COUNTER_TYPES = Object.freeze({
    
});

export const OTP_TYPES = Object.freeze({
    LOGIN: "login",
    PASSWORD_UPDATE: "password update",
    EMAIL_RESET: "email reset",
    ACCOUNT_RESET: "account reset"
});

export const OTP_STATUS = Object.freeze({
    ACTIVE: "active",
    DEACTIVATED: "deactivated",
    USED: "used",
    BARRED: "barred"
});

export const PASSWORD_STATUS = Object.freeze({
    ACTIVE: "active",
    DEACTIVATED: "deactivated",
    COMPROMISED: "compromised",
    BLACKLISTED: "blacklisted"
});

export const ENVIRONMENTS = Object.freeze({
    PROD: "production",
    DEV: "development",
    UAT: "user acceptance testing",
    STAGING: "staging"
});

export const PRODUCT_STATUS = Object.freeze({
    ACTIVE: "active",
    DEACTIVATED: "deactivated",
    SUSPENDED: "suspended",
    BANNED: "banned",
    DELETED: "deleted"
});

export const DISCOUNT_TYPES = Object.freeze({
    PERCENTAGE: "percentage",
    FIXED: "fixed"
});

export const INVOICE_STATUS = Object.freeze({
    PAID: "paid",
    PENDING: "pending",
    RETURNED: "returned"
});