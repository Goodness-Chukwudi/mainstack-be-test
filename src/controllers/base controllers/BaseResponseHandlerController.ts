import Logger from "../../common/utils/Logger";
import { Response } from "express";
import mongoose, { ClientSession } from "mongoose";
import { IResponseMessage } from "../../interfaces/interfaces";
import ErrorResponseMessage from "../../common/constants/error_response_message";
import SuccessResponseMessage from "../../common/constants/success_response_message";

abstract class BaseResponseHandler {

    protected errorResponseMessage: ErrorResponseMessage;
    protected successResponseMessage: SuccessResponseMessage;
    protected logger: Logger;

    constructor() {
        this.errorResponseMessage = new ErrorResponseMessage();
        this.successResponseMessage = new SuccessResponseMessage();
        this.logger = new Logger();
    }
    
    /**
     * Terminates the http request with the provided express res object.
     * An error response is created with the provided error details and returned to the client.
     * Returns the appropriate error message for MongoDb validation and duplicate key errors
     * @param res The express response object to be used to send the error response 
     * @param error The error object. This is only for log purposes and it's not returned to client
     * @param responseMessage A response message of type IResponseMessage
     * @param statusCode HTTP status code of the error response
     * @param session An optional mongoose client session, required to abort a running database transaction if any
     * @returns  void
    */
    protected async sendErrorResponse( res: Response, err: Error, responseMessage: IResponseMessage, statusCode: number, session?: ClientSession) {

        if(session) await session.abortTransaction();

        let response;

        if (err instanceof mongoose.Error.ValidationError) {
            response = {
                message: err.message,
                success: false,
                error_code: 0
            };
            statusCode = 400;

        } else if (this.isDuplicateKeyError(err)) {
            //Extract the duplicate field from the error message
            const start = err.message.indexOf("index: ");
            const end = err.message.indexOf(" dup key:");
            const duplicateKey = err.message.slice(start + 7, end);
            const field = duplicateKey.slice(0, duplicateKey.lastIndexOf("_"));

            response = {
                message: "Duplicate value for " + field,
                success: false,
                error_code: 1
            };
            statusCode = 400;
            
        } else {
            response = {
                message: responseMessage.message,
                success: false,
                error_code: responseMessage.response_code
            };

            if (statusCode == 500) this.logger.logError(err, res);
        }

        res.status(statusCode).json(response);
    }

    /**
     * Terminates the http request with the provided express res object.
     * A success response is created and an optional data object data returned to the client.
     * @param res The express response object to be used to send the success response 
     * @param data An optional data to be returned to the user
     * @param session An optional mongoose client session, required to commit a running database transaction if any
     * @param statusCode HTTP status code of the success response
     * @returns  void
    */
    protected async sendSuccessResponse(res: Response, data:any = null, session?: ClientSession, statusCode = 200) {
        if (session) await session.commitTransaction();
        const response = {
            success: true,
            data: data
        }
        res.status(statusCode).json(response);
    }

    private isDuplicateKeyError(error: Error) {
        if (error.message.includes("E11000 duplicate key error collection")) return true;
        return false;
    }
}

export default BaseResponseHandler;
