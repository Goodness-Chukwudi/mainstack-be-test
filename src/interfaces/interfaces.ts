import joi, { Extension, Root, string } from "joi";
import { IUser } from "../models/user";
import { ILoginSession } from "../models/login_session";
import { IUserPrivilege } from "../models/user_privilege";

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
