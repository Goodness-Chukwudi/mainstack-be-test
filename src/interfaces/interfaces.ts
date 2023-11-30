import joi, { Extension, Root } from "joi";
import { IUser } from "../models/user";
import { ILoginSession } from "../models/login_session";
import { IUserPrivilege } from "../models/user_privilege";
import { IDiscount } from "../models/store/discount";
import { Model, ObjectId, Types } from "mongoose";
import { ErrorResponseData, MongoId } from "./types";

export interface IResponseMessage {
    response_code: number;
    message: string;
}

export interface IServiceResponse {
    data: any,
    error: IServiceError|null
}

export interface ICachedRequestData {
    user: IUser,
    loginSession: ILoginSession,
    privileges: [IUserPrivilege]
}

export interface IItemsObject {
    error: ErrorResponseData;
    data: ProcessedItemsObject[]
}

export interface ProcessedItemsObject {
    quantity: number;
    name: string;
    price: number;
    cost: number;
    code: string;
    categories: string[];
    available_quantity: number;
    discount: any;
    product: string;
}

export interface SalesItemData {
    product_id: string|ObjectId,
    product_name: string,
    sales_id: string,
    quantity: number,
    unit_cost: number,
    price: number,
    discount: IDiscount,
    categories: string[],
    user_id: string
}

interface IServiceError {
    service_error: Error,
    responseMessage: IResponseMessage,
    statusCode: number
}

interface IObjectIdExtension extends Extension {
    type: 'string',
    base: joi.StringSchema
    messages: {'string.objectId': string},
    rules: {
        objectId: { validate(value:string, helpers:any): any }
    }
}
export declare const JoiExtensionFactory: (joi: Root) => IObjectIdExtension;
